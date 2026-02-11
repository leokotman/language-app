import type { UserVocabularyRow } from '@/types/database'
import type { VocabularyRow } from '@/types/database'

export type StudyCardItem = UserVocabularyRow & { vocabulary: VocabularyRow | null }

export type StudySessionState = {
  cards: StudyCardItem[]
  currentIndex: number
}
