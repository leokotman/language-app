import { State } from "ts-fsrs";

/** Constants for Formula C (tiered: 0–50 learning, 50–100 learnt). See docs/SCORING_DESIGN.md. */
export const STABILITY_LEARNT_DAYS = 21;
export const STABILITY_CAP_DAYS = 365;
export const REPS_BONUS_CAP = 5;
export const LAPSE_PENALTY_PER = 5;
export const LAPSE_PENALTY_CAP = 4;
export const LEARNING_REPS_FACTOR = 0.2;

/** Input shape for score computation: FSRS card fields (e.g. UserVocabularyRow or merged row after scheduleRating). */
export type ScoringInput = {
  stability: number;
  elapsed_days: number;
  reps: number;
  lapses: number;
  state: number;
};

/**
 * Retrievability: probability of recall. R = 0.9^(elapsed_days / stability).
 * When elapsed_days = stability, R = 0.9. When stability is 0, returns 0.
 */
export function retrievability(stability: number, elapsedDays: number): number {
  if (stability <= 0) return 0;
  return Math.pow(0.9, elapsedDays / stability);
}

/**
 * Compute score (0–100) using Formula C: tiered learning (0–50) vs learnt (50–100).
 * Uses current FSRS state; typically called with the updated row after a rating.
 */
export function computeScore(input: ScoringInput): number {
  const R = retrievability(input.stability, input.elapsed_days);
  const repsBonus = Math.min(REPS_BONUS_CAP, input.reps);
  const lapsePenalty =
    Math.min(LAPSE_PENALTY_CAP, input.lapses) * LAPSE_PENALTY_PER;
  const isLearntBand =
    input.state === State.Review && input.stability >= STABILITY_LEARNT_DAYS;

  if (!isLearntBand) {
    const raw = 50 * R * (1 + LEARNING_REPS_FACTOR * repsBonus) - lapsePenalty;
    return Math.max(0, Math.min(50, Math.round(raw)));
  }

  const stabilityNorm = Math.min(1, input.stability / STABILITY_CAP_DAYS);
  const raw = 50 + 50 * stabilityNorm * R - lapsePenalty;
  return Math.max(50, Math.min(100, Math.round(raw)));
}

/**
 * Whether the item counts as "learnt": in Review state and stability >= threshold.
 */
export function isLearnt(input: ScoringInput): boolean {
  return (
    input.state === State.Review && input.stability >= STABILITY_LEARNT_DAYS
  );
}
