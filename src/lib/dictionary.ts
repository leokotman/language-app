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

/**
 * Look up a word/phrase. Returns one entry (word → translation).
 * When offline or offlineMode is true, returns empty array (no network call).
 * Only en↔ru is supported for now.
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

    // Prefer a match where translation actually differs from source (avoids "любовь" → "Любовь" or names echoed back)
    const matches = json.matches ?? []
    const realTranslations = matches.filter(
      (m) =>
        m.translation != null &&
        m.translation !== '' &&
        !normalizedSame(trimmed, m.translation)
    )
    const best = realTranslations.length > 0
      ? realTranslations.sort((a, b) => matchQuality(b) - matchQuality(a))[0]
      : null

    const translatedText = best?.translation ?? json.responseData?.translatedText
    if (translatedText == null || translatedText === '') {
      return []
    }
    return [
      {
        word: trimmed,
        translation: String(translatedText).trim(),
        language_from: fromLang,
        language_to: toLang,
      },
    ]
  } catch (err) {
    logError('dictionary.lookup', err)
    throw err
  }
}

export { SUPPORTED_LANGS }
