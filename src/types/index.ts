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

/** Supported language pairs: EN↔RU, EN↔SR (Serbian in Latin script). */
export const SUPPORTED_LANGUAGE_PAIRS = [
  { learning: 'ru', native: 'en', label: 'English → Russian' },
  { learning: 'en', native: 'ru', label: 'Russian → English' },
  { learning: 'sr', native: 'en', label: 'English → Serbian (Latin)' },
  { learning: 'en', native: 'sr', label: 'Serbian (Latin) → English' },
] as const

/** Example placeholders for add-word form (word/translation) per language code. */
export const LANGUAGE_PLACEHOLDERS: Record<string, string> = {
  en: 'e.g. hello',
  ru: 'e.g. привет',
  sr: 'e.g. zdravo',
}

export type LanguagePairCode = (typeof SUPPORTED_LANGUAGE_PAIRS)[number]['learning'] | (typeof SUPPORTED_LANGUAGE_PAIRS)[number]['native']
