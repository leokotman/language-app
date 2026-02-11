import type { UserVocabularyRow } from '@/types/database'
import type { VocabularyRow } from '@/types/database'

export type StudyCardItem = UserVocabularyRow & { vocabulary: VocabularyRow | null }

/** Exercise form: typing (write translation) or multiple choice. */
export type ExerciseType = 'typing' | 'multiple_choice'

export type StudySessionState = {
  cards: StudyCardItem[]
  currentIndex: number
  /** Which exercise type to use per card (index matches cards). */
  exerciseTypes: ExerciseType[]
  /** Enabled exercise types chosen at session start. */
  enabledExerciseTypes: ExerciseType[]
}
