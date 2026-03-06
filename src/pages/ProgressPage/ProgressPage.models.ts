/**
 * Progress page types: stats per direction and per pair.
 * Direction = language_from → language_to (A→B vs B→A are separate).
 */

export interface ProgressDirectionStats {
  /** Direction key e.g. "en-ru" (language_from-language_to). */
  directionKey: string;
  /** Human-readable label e.g. "English → Russian". */
  directionLabel: string;
  /** Number of words with at least one score row in this direction. */
  wordCount: number;
  /** Average score 0–100 in this direction. */
  averageScore: number;
  /** Number of words marked learnt in this direction. */
  learntCount: number;
  /** Most recent last_exercise_at in this direction (ISO string or null). */
  lastStudiedAt: string | null;
}

export interface ProgressPairStats {
  /** Bidirectional pair key e.g. "en-ru". */
  pairKey: string;
  /** Human-readable pair label e.g. "Russian ↔ English". */
  pairLabel: string;
  /** Stats for direction A→B. */
  directionFromTo: ProgressDirectionStats | null;
  /** Stats for direction B→A. */
  directionToFrom: ProgressDirectionStats | null;
}
