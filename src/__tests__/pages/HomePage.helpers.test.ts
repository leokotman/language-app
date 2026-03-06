import { describe, expect, it } from "vitest";
import { buildHomeStats } from "@/pages/HomePage/HomePage.helpers";
import type { VocabularyScoreWithVocabulary } from "@/api/vocabulary";

function createScoreRow(
  overrides: Partial<VocabularyScoreWithVocabulary>,
): VocabularyScoreWithVocabulary {
  return {
    user_id: "user-1",
    vocabulary_id: "vocab-1",
    score: 40,
    last_exercise_at: "2026-03-05T10:00:00.000Z",
    practised_dates_count: 1,
    learnt: false,
    created_at: "2026-03-05T10:00:00.000Z",
    updated_at: "2026-03-05T10:00:00.000Z",
    vocabulary: {
      id: "vocab-1",
      word: "hello",
      translation: "привет",
      language_from: "en",
      language_to: "ru",
      source: "app",
      created_by: null,
      created_at: "2026-03-05T10:00:00.000Z",
    },
    ...overrides,
  };
}

describe("buildHomeStats", () => {
  it("returns zeroed stats for empty input", () => {
    expect(buildHomeStats([])).toEqual({
      trackedWords: 0,
      learntWords: 0,
      averageScore: 0,
      pairCount: 0,
    });
  });

  it("aggregates tracked words, learnt words, average score, and pair count", () => {
    const rows: VocabularyScoreWithVocabulary[] = [
      createScoreRow({ score: 40, learnt: true }),
      createScoreRow({
        vocabulary_id: "vocab-2",
        score: 80,
        learnt: true,
        vocabulary: {
          id: "vocab-2",
          word: "cat",
          translation: "кот",
          language_from: "en",
          language_to: "ru",
          source: "app",
          created_by: null,
          created_at: "2026-03-05T10:00:00.000Z",
        },
      }),
      createScoreRow({
        vocabulary_id: "vocab-3",
        score: 50,
        learnt: false,
        vocabulary: {
          id: "vocab-3",
          word: "book",
          translation: "книга",
          language_from: "ru",
          language_to: "en",
          source: "app",
          created_by: null,
          created_at: "2026-03-05T10:00:00.000Z",
        },
      }),
      createScoreRow({
        vocabulary_id: "vocab-4",
        score: 20,
        learnt: false,
        vocabulary: {
          id: "vocab-4",
          word: "word",
          translation: "слово",
          language_from: "en",
          language_to: "sr",
          source: "app",
          created_by: null,
          created_at: "2026-03-05T10:00:00.000Z",
        },
      }),
    ];

    expect(buildHomeStats(rows)).toEqual({
      trackedWords: 4,
      learntWords: 2,
      averageScore: 47.5,
      pairCount: 2,
    });
  });

  it("ignores rows without joined vocabulary for pair count", () => {
    const rows: VocabularyScoreWithVocabulary[] = [
      createScoreRow({ vocabulary: null }),
    ];

    expect(buildHomeStats(rows)).toEqual({
      trackedWords: 1,
      learntWords: 0,
      averageScore: 40,
      pairCount: 0,
    });
  });
});
