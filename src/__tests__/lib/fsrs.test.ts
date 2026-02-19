import { describe, it, expect } from "vitest";
import {
  userVocabularyRowToCard,
  cardToUserVocabularyUpdate,
  scheduleRating,
  StudyRating,
} from "@/lib/fsrs";
import type { UserVocabularyRow } from "@/types/database";

const baseRow: UserVocabularyRow = {
  id: "test-id",
  user_id: "user-1",
  vocabulary_id: "vocab-1",
  state: 0,
  due: new Date().toISOString(),
  stability: 0,
  difficulty: 0,
  elapsed_days: 0,
  scheduled_days: 0,
  learning_steps: 0,
  reps: 0,
  lapses: 0,
  last_review: null,
  created_at: new Date().toISOString(),
};

describe("fsrs", () => {
  it("userVocabularyRowToCard converts row to Card with Date due and last_review", () => {
    const row = {
      ...baseRow,
      due: "2026-02-11T12:00:00.000Z",
      last_review: "2026-02-10T12:00:00.000Z",
    };
    const card = userVocabularyRowToCard(row);
    expect(card.due).toBeInstanceOf(Date);
    expect(card.due.toISOString()).toBe("2026-02-11T12:00:00.000Z");
    expect(card.last_review).toBeInstanceOf(Date);
    expect(card.last_review?.toISOString()).toBe("2026-02-10T12:00:00.000Z");
    expect(card.state).toBe(0);
    expect(card.stability).toBe(0);
  });

  it("cardToUserVocabularyUpdate converts Card to update payload", () => {
    const card = userVocabularyRowToCard(baseRow);
    const update = cardToUserVocabularyUpdate(card);
    expect(update.due).toBeDefined();
    expect(typeof update.due).toBe("string");
    expect(update.state).toBe(0);
    expect(update.last_review).toBeNull();
  });

  it("scheduleRating returns update payload with new due and state", () => {
    const row = { ...baseRow, state: 0, due: new Date().toISOString() };
    const update = scheduleRating(row, StudyRating.Good);
    expect(update.due).toBeDefined();
    expect(update.state).toBeDefined();
    expect(update.stability).toBeDefined();
    expect(update.difficulty).toBeDefined();
    expect(update.last_review).toBeDefined();
  });
});
