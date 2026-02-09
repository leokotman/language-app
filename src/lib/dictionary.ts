/**
 * Dictionary lookup for en↔ru (MyMemory API). No cache yet; offline/Offline mode skip API.
 * See docs/DICTIONARY_PLAN.md.
 */

import { logError } from '@/lib/errors'
import { sanitizeSearch } from '@/lib/sanitize'

const MYMEMORY_BASE = 'https://api.mymemory.translated.net/get'
const SUPPORTED_LANGS = ['en', 'ru', 'sr'] as const

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
function normalizedSame(textA: string, textB: string): boolean {
  return textA.trim().toLowerCase() === textB.trim().toLowerCase()
}

/** Numeric quality for sorting (higher = better). */
function matchQuality(match: MyMemoryMatch): number {
  const quality = match.quality
  if (quality == null) return 0
  return typeof quality === 'string' ? parseInt(quality, 10) || 0 : quality
}

/** Cyrillic letters (Russian, Serbian Cyrillic, etc.). */
const CYRILLIC_RANGE = /\p{Script=Cyrillic}/u

/** Serbian Latin expects Latin script; API sometimes returns Cyrillic or mojibake (e.g. ã for š). */
function isAcceptableTranslation(translation: string, targetLang: string): boolean {
  const t = translation.trim()
  if (!t.length) return false
  if (t.includes('\uFFFD')) return false
  if (/\u00E3|\u00C3/.test(t)) return false
  if (targetLang === 'sr') {
    const letters = t.replace(/\P{L}/gu, '')
    if (!letters.length) return true
    const cyrillicCount = (letters.match(CYRILLIC_RANGE) ?? []).length
    if (cyrillicCount / letters.length > 0.2) return false
  }
  return true
}

/** Max translations to return (API may return more; we show this many, best quality first). */
export const MAX_TRANSLATIONS = 50

/**
 * Look up a word/phrase. Returns multiple entries when the API has several translations (e.g. "key" → клавиша, ключ, …).
 * Filters out echo/same-word (e.g. "любовь" → "Любовь"); dedupes by normalized translation; sorts by quality.
 * When offline or offlineMode is true, returns empty array (no network call).
 * Supports en, ru, sr (Serbian). MyMemory does not document a fixed limit for matches; we cap at MAX_TRANSLATIONS.
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
      (match) =>
        match.translation != null &&
        match.translation !== '' &&
        !normalizedSame(trimmed, match.translation) &&
        isAcceptableTranslation(String(match.translation), toLang)
    )
    const byQuality = realTranslations.sort(
      (matchA, matchB) => matchQuality(matchB) - matchQuality(matchA)
    )

    // Use segment (source phrase) as word when present, so phrases are stored with the API's source text
    const seen = new Set<string>()
    const entries: DictionaryEntry[] = []
    for (const match of byQuality) {
      const translationText = String(match.translation).trim()
      const sourceWord =
        match.segment != null && String(match.segment).trim() !== ''
          ? String(match.segment).trim()
          : trimmed
      const key = `${sourceWord.toLowerCase()}|${translationText.toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)
      entries.push({
        word: sourceWord,
        translation: translationText,
        language_from: fromLang,
        language_to: toLang,
      })
      if (entries.length >= MAX_TRANSLATIONS) break
    }

    if (entries.length === 0) {
      const fallback = json.responseData?.translatedText
      if (
        fallback != null &&
        fallback !== '' &&
        !normalizedSame(trimmed, fallback) &&
        isAcceptableTranslation(String(fallback), toLang)
      ) {
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
