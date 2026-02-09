import {
  SUPPORTED_LANGUAGE_PAIRS,
  BIDIRECTIONAL_PAIRS,
  VIRTUAL_PAIR_RU_SR,
} from '@/types'
import { parseLibraryFile, type LibraryExportRow } from '@/lib/importExport'

export function getLanguagePairLabel(languageFrom: string, languageTo: string): string {
  const pair = SUPPORTED_LANGUAGE_PAIRS.find(
    (option) => option.native === languageFrom && option.learning === languageTo
  )
  if (pair) return pair.label
  return `${languageFrom} → ${languageTo}`
}

export type ProcessLibraryImportDeps = {
  addWordAsync: (row: LibraryExportRow) => Promise<unknown>
  existingKeys: Set<string>
}

export type ProcessLibraryImportResult = {
  added: number
  skipped: number
  parseErrors: string[]
}

export async function processLibraryImport(
  file: File,
  deps: ProcessLibraryImportDeps
): Promise<ProcessLibraryImportResult> {
  const { rows, errors: parseErrors } = await parseLibraryFile(file)
  const result: ProcessLibraryImportResult = { added: 0, skipped: 0, parseErrors }

  if (parseErrors.length > 0 && rows.length === 0) {
    return result
  }

  for (const row of rows) {
    const key = `${row.word.toLowerCase()}|${row.translation.toLowerCase()}|${row.language_from}|${row.language_to}`
    if (deps.existingKeys.has(key)) {
      result.skipped += 1
      continue
    }
    try {
      await deps.addWordAsync(row)
      result.added += 1
      deps.existingKeys.add(key)
    } catch {
      throw new Error(`Import stopped after ${result.added} words. Could not add "${row.word}".`)
    }
  }

  return result
}

export function buildLibraryImportMessage(result: ProcessLibraryImportResult): string {
  const { added, skipped, parseErrors } = result
  if (parseErrors.length > 0 && added === 0 && skipped === 0) {
    return `Import failed: ${parseErrors.slice(0, 3).join('; ')}${parseErrors.length > 3 ? '…' : ''}`
  }
  if (parseErrors.length > 0) {
    return `Imported ${added} words, skipped ${skipped} duplicates. Some rows had errors: ${parseErrors.slice(0, 2).join('; ')}`
  }
  return `Imported ${added} words. ${skipped > 0 ? `Skipped ${skipped} duplicates.` : ''}`
}

export function downloadBlob(content: string, mimeType: string, filename: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function buildBidirectionalFilterOptions(
  bidirectionalKeysFromUser: string[],
  hasVirtualPair: boolean
): { value: string; label: string }[] {
  const list: { value: string; label: string }[] = bidirectionalKeysFromUser
    .map((key) => BIDIRECTIONAL_PAIRS.find((pair) => pair.key === key))
    .filter(Boolean)
    .map((pair) => ({ value: pair!.key, label: pair!.label }))
  if (hasVirtualPair) {
    list.push({ value: VIRTUAL_PAIR_RU_SR.key, label: VIRTUAL_PAIR_RU_SR.label })
  }
  return list
}

export function buildDirectionOptionsForPair(
  addPairKey: string,
  getLanguagePairLabel: (from: string, to: string) => string
): { value: string; label: string }[] {
  if (!addPairKey) return []
  const [sourceLang, targetLang] = addPairKey.split('-')
  if (!sourceLang || !targetLang) return []
  if (addPairKey === VIRTUAL_PAIR_RU_SR.key) {
    return [
      { value: 'ru-sr', label: VIRTUAL_PAIR_RU_SR.directionLabels['ru-sr'] },
      { value: 'sr-ru', label: VIRTUAL_PAIR_RU_SR.directionLabels['sr-ru'] },
    ]
  }
  return [
    { value: `${sourceLang}-${targetLang}`, label: getLanguagePairLabel(sourceLang, targetLang) },
    { value: `${targetLang}-${sourceLang}`, label: getLanguagePairLabel(targetLang, sourceLang) },
  ]
}
