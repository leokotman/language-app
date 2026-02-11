import { fsrs, Rating, State } from 'ts-fsrs'
import type { Card } from 'ts-fsrs'
import type { UserVocabularyRow, UserVocabularyUpdate } from '@/types/database'

const scheduler = fsrs()

/** Convert user_vocabulary row to ts-fsrs Card (due/last_review as Date). */
export function userVocabularyRowToCard(row: UserVocabularyRow): Card {
  return {
    due: new Date(row.due),
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: row.elapsed_days,
    scheduled_days: row.scheduled_days,
    learning_steps: row.learning_steps,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state as State,
    last_review: row.last_review ? new Date(row.last_review) : undefined,
  }
}

/** Convert ts-fsrs Card back to user_vocabulary update payload. */
export function cardToUserVocabularyUpdate(card: Card): UserVocabularyUpdate {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as number,
    last_review: card.last_review?.toISOString() ?? null,
  }
}

/** Rating for UI: Again=1, Hard=2, Good=3, Easy=4 (matches ts-fsrs Grade). */
export type StudyRating = Rating.Again | Rating.Hard | Rating.Good | Rating.Easy

export const StudyRating = {
  Again: Rating.Again,
  Hard: Rating.Hard,
  Good: Rating.Good,
  Easy: Rating.Easy,
} as const

/**
 * Compute next FSRS state for a card after user gives a rating.
 * Returns update payload for user_vocabulary.
 */
export function scheduleRating(
  row: UserVocabularyRow,
  grade: StudyRating
): UserVocabularyUpdate {
  const card = userVocabularyRowToCard(row)
  const now = new Date()
  const result = scheduler.next(card, now, grade)
  return cardToUserVocabularyUpdate(result.card)
}
