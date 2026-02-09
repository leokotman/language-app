// Re-export database and app types
export type {
  Database,
  ProfileRow,
  LanguageRow,
  UserLanguageRow,
  VocabularyRow,
  UserVocabularyRow,
  VocabularyInsert,
  VocabularyUpdate,
  UserVocabularyInsert,
  UserVocabularyUpdate,
  UserLanguageInsert,
  UserLanguageRowUpdate,
} from './database'

/** Supported language pairs: EN↔RU, EN↔SR (Serbian in Latin script). Used for direction when adding words. */
export const SUPPORTED_LANGUAGE_PAIRS = [
  { learning: 'ru', native: 'en', label: 'English → Russian' },
  { learning: 'en', native: 'ru', label: 'Russian → English' },
  { learning: 'sr', native: 'en', label: 'English → Serbian (Latin)' },
  { learning: 'en', native: 'sr', label: 'Serbian (Latin) → English' },
] as const

/** Bidirectional pairs: one entry per language combination (e.g. "Russian ↔ English"). */
export const BIDIRECTIONAL_PAIRS = [
  { key: 'en-ru', langs: ['en', 'ru'] as const, label: 'Russian ↔ English' },
  { key: 'en-sr', langs: ['en', 'sr'] as const, label: 'Serbian (Latin) ↔ English' },
] as const

/** Virtual pair: Russian ↔ Serbian via English. User can add words (stored as ru–sr / sr–ru). */
export const VIRTUAL_PAIR_RU_SR = {
  key: 'ru-sr',
  label: 'Russian ↔ Serbian (via English)',
  pivot: 'en',
  langs: ['ru', 'sr'] as const,
  directionLabels: {
    'ru-sr': 'Russian → Serbian (via English)',
    'sr-ru': 'Serbian → Russian (via English)',
  } as const,
} as const

/** Normalize two language codes to a bidirectional key (sorted). */
export function getBidirectionalKey(
  languageCodeA: string,
  languageCodeB: string
): string {
  return [languageCodeA, languageCodeB].sort().join('-')
}

/** Example placeholders for add-word form (word/translation) per language code. */
export const LANGUAGE_PLACEHOLDERS: Record<string, string> = {
  en: 'e.g. hello',
  ru: 'e.g. привет',
  sr: 'e.g. zdravo',
}

export type LanguagePairCode = (typeof SUPPORTED_LANGUAGE_PAIRS)[number]['learning'] | (typeof SUPPORTED_LANGUAGE_PAIRS)[number]['native']
