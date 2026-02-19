import type { UserVocabularyRow } from "@/types/database";
import type { VocabularyRow } from "@/types/database";

export type StudyCardItem = UserVocabularyRow & {
  vocabulary: VocabularyRow | null;
};

/** Exercise form: flashcard, reverse flashcard, typing, multiple choice, reverse multiple choice, listening (TTS), speaking (record → play back → self-rate). */
export type ExerciseType =
  | "flashcard"
  | "reverse_flashcard"
  | "typing"
  | "multiple_choice"
  | "reverse_multiple_choice"
  | "listening"
  | "speaking";

export type StudySessionState = {
  cards: StudyCardItem[];
  currentIndex: number;
  /** Which exercise type to use per card (index matches cards). */
  exerciseTypes: ExerciseType[];
  /** Enabled exercise types chosen at session start. */
  enabledExerciseTypes: ExerciseType[];
};
