import type { DictionaryEntry } from '@/lib/dictionary'

export type ResultItem =
  | {
      source: 'store'
      vocabularyId: string
      word: string
      translation: string
      from: string
      to: string
    }
  | { source: 'api'; entry: DictionaryEntry }
