/**
 * Dictionary lookup for en↔ru (MyMemory API). No cache yet; offline/Offline mode skip API.
 * See docs/DICTIONARY_PLAN.md.
 */

import { logError } from '@/lib/errors'
import { sanitizeSearch } from '@/lib/sanitize'

const MYMEMORY_BASE = 'https://api.mymemory.translated.net/get'
const SUPPORTED_LANGS = ['en', 'ru'] as const

export type DictionaryEntry = {
  word: string
  translation: string
  language_from: string
  language_to: string
}

function isSupported(lang: string): lang is (typeof SUPPORTED_LANGS)[number] {
  return SUPPORTED_LANGS.includes(lang as (typeof SUPPORTED_LANGS)[number])
}

/** Single match from MyMemory matches array. */
interface MyMemoryMatch {
  segment?: string
  translation?: string
  quality?: number | string
}

/** MyMemory response shape. We use matches when present to avoid echo (e.g. "любовь" → "Любовь"). */
interface MyMemoryResponse {
  responseData?: { translatedText?: string }
  responseStatus?: number
  matches?: MyMemoryMatch[]
}

/** Normalize for same-word check: trim and lowercase so "Любовь" vs "любовь" or "Love" vs "love" match. */
function normalizedSame(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

/** Numeric quality for sorting (higher = better). */
function matchQuality(m: MyMemoryMatch): number {
  const q = m.quality
  if (q == null) return 0
  return typeof q === 'string' ? parseInt(q, 10) || 0 : q
}

/** Max translations to return (API may return more; we show this many, best quality first). */
export const MAX_TRANSLATIONS = 50

/**
 * Look up a word/phrase. Returns multiple entries when the API has several translations (e.g. "key" → клавиша, ключ, …).
 * Filters out echo/same-word (e.g. "любовь" → "Любовь"); dedupes by normalized translation; sorts by quality.
 * When offline or offlineMode is true, returns empty array (no network call).
 * Only en↔ru is supported for now. MyMemory does not document a fixed limit for matches; we cap at MAX_TRANSLATIONS.
 */
export async function lookup(
  query: string,
  fromLang: string,
  toLang: string,
  options: { offlineMode?: boolean } = {}
): Promise<DictionaryEntry[]> {
  const trimmed = sanitizeSearch(query)
  if (!trimmed) return []

  if (options.offlineMode || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return []
  }

  if (!isSupported(fromLang) || !isSupported(toLang) || fromLang === toLang) {
    return []
  }

  const langpair = `${fromLang}|${toLang}`
  const url = `${MYMEMORY_BASE}?${new URLSearchParams({
    q: trimmed,
    langpair,
  }).toString()}`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Dictionary API ${res.status}: ${res.statusText}`)
    }
    const json = (await res.json()) as MyMemoryResponse

    const matches = json.matches ?? []
    const realTranslations = matches.filter(
      (m) =>
        m.translation != null &&
        m.translation !== '' &&
        !normalizedSame(trimmed, m.translation)
    )
    const byQuality = realTranslations.sort((a, b) => matchQuality(b) - matchQuality(a))

    // Dedupe by normalized translation (e.g. "love" and "Love" → one entry)
    const seen = new Set<string>()
    const entries: DictionaryEntry[] = []
    for (const m of byQuality) {
      const t = String(m.translation).trim()
      const key = t.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      entries.push({
        word: trimmed,
        translation: t,
        language_from: fromLang,
        language_to: toLang,
      })
      if (entries.length >= MAX_TRANSLATIONS) break
    }

    if (entries.length === 0) {
      const fallback = json.responseData?.translatedText
      if (fallback != null && fallback !== '' && !normalizedSame(trimmed, fallback)) {
        entries.push({
          word: trimmed,
          translation: String(fallback).trim(),
          language_from: fromLang,
          language_to: toLang,
        })
      }
    }

    return entries
  } catch (err) {
    logError('dictionary.lookup', err)
    throw err
  }
}

export { SUPPORTED_LANGS }
