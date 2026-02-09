/**
 * Import/export personal library as CSV or JSON.
 * CSV/JSON format: rows with word, translation, language_from, language_to.
 */

const SUPPORTED_LANGS = ['en', 'ru', 'sr'] as const

export type LibraryExportRow = {
  word: string
  translation: string
  language_from: string
  language_to: string
}

function escapeCsvField(value: string): string {
  if (!/[,"\n\r]/.test(value)) return value
  return `"${value.replace(/"/g, '""')}"`
}

/** Export rows to CSV string (header + rows). */
export function exportToCsv(rows: LibraryExportRow[]): string {
  const header = 'word,translation,language_from,language_to'
  const lines = rows.map(
    (r) =>
      [r.word, r.translation, r.language_from, r.language_to].map(escapeCsvField).join(',')
  )
  return [header, ...lines].join('\n')
}

/** Export rows to JSON string. */
export function exportToJson(rows: LibraryExportRow[]): string {
  return JSON.stringify(rows, null, 2)
}

/** Result of parsing a file: valid rows and errors. */
export type ParseResult = {
  rows: LibraryExportRow[]
  errors: string[]
}

function validateRow(
  row: unknown,
  index: number
): { ok: true; row: LibraryExportRow } | { ok: false; error: string } {
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    return { ok: false, error: `Row ${index + 1}: expected an object` }
  }
  const record = row as Record<string, unknown>
  const word = typeof record.word === 'string' ? record.word.trim() : ''
  const translation = typeof record.translation === 'string' ? record.translation.trim() : ''
  const language_from = typeof record.language_from === 'string' ? record.language_from.trim().toLowerCase() : ''
  const language_to = typeof record.language_to === 'string' ? record.language_to.trim().toLowerCase() : ''

  if (!word) return { ok: false, error: `Row ${index + 1}: missing or empty word` }
  if (!translation) return { ok: false, error: `Row ${index + 1}: missing or empty translation` }
  if (!SUPPORTED_LANGS.includes(language_from as (typeof SUPPORTED_LANGS)[number])) {
    return { ok: false, error: `Row ${index + 1}: language_from must be en, ru, or sr` }
  }
  if (!SUPPORTED_LANGS.includes(language_to as (typeof SUPPORTED_LANGS)[number])) {
    return { ok: false, error: `Row ${index + 1}: language_to must be en, ru, or sr` }
  }
  if (language_from === language_to) {
    return { ok: false, error: `Row ${index + 1}: language_from and language_to must differ` }
  }

  return {
    ok: true,
    row: { word, translation, language_from, language_to },
  }
}

/** Parse CSV text: first line is header (word,translation,language_from,language_to). */
function parseCsvText(text: string): ParseResult {
  const errors: string[] = []
  const rows: LibraryExportRow[] = []
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length === 0) return { rows: [], errors: ['File is empty'] }
  const header = lines[0].toLowerCase()
  const dataLines = lines.slice(1)
  if (!header.includes('word') || !header.includes('translation')) {
    return { rows: [], errors: ['CSV must have header: word,translation,language_from,language_to'] }
  }
  const colIndex = (name: string): number => {
    const cols = lines[0].split(',').map((c) => c.trim().toLowerCase().replace(/^"|"$/g, ''))
    const i = cols.findIndex((c) => c === name)
    return i >= 0 ? i : cols.length
  }
  const wordIdx = colIndex('word')
  const transIdx = colIndex('translation')
  const fromIdx = colIndex('language_from')
  const toIdx = colIndex('language_to')

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i]
    const parts: string[] = []
    let current = ''
    let inQuotes = false
    for (let j = 0; j < line.length; j++) {
      const ch = line[j]
      if (ch === '"') {
        if (inQuotes && line[j + 1] === '"') {
          current += '"'
          j++
        } else {
          inQuotes = !inQuotes
        }
      } else if ((ch === ',' && !inQuotes) || ch === '\n' || ch === '\r') {
        parts.push(current.trim())
        current = ''
        if (ch !== ',') break
      } else {
        current += ch
      }
    }
    parts.push(current.trim())
    const word = parts[wordIdx] ?? ''
    const translation = parts[transIdx] ?? ''
    const language_from = (parts[fromIdx] ?? '').toLowerCase()
    const language_to = (parts[toIdx] ?? '').toLowerCase()
    const result = validateRow(
      { word, translation, language_from, language_to },
      rows.length
    )
    if (result.ok) rows.push(result.row)
    else errors.push(result.error)
  }
  return { rows, errors }
}

/** Parse JSON array of { word, translation, language_from, language_to }. */
function parseJsonText(text: string): ParseResult {
  const errors: string[] = []
  const rows: LibraryExportRow[] = []
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { rows: [], errors: ['Invalid JSON'] }
  }
  if (!Array.isArray(data)) {
    return { rows: [], errors: ['JSON must be an array of objects'] }
  }
  for (let i = 0; i < data.length; i++) {
    const result = validateRow(data[i], i)
    if (result.ok) rows.push(result.row)
    else errors.push(result.error)
  }
  return { rows, errors }
}

/** Parse file (CSV or JSON) and return valid rows + parse errors. */
export async function parseLibraryFile(file: File): Promise<ParseResult> {
  const text = await file.text()
  const name = file.name.toLowerCase()
  if (name.endsWith('.json')) return parseJsonText(text)
  if (name.endsWith('.csv')) return parseCsvText(text)
  if (text.trimStart().startsWith('[')) return parseJsonText(text)
  return parseCsvText(text)
}
