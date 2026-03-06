import { describe, it, expect } from "vitest";
import { aggregateProgressByPair } from "@/pages/ProgressPage/ProgressPage.helpers";
import type { VocabularyScoreWithVocabulary } from "@/api/vocabulary";
import type { VocabularyRow } from "@/types/database";

function vocab(language_from: string, language_to: string): VocabularyRow {
  return {
    id: "v1",
    word: "hello",
    translation: "trans",
    language_from,
    language_to,
    source: "app",
    created_by: null,
    created_at: "2026-01-01T00:00:00.000Z",
  };
}

function row(
  overrides: Partial<VocabularyScoreWithVocabulary> = {},
): VocabularyScoreWithVocabulary {
  return {
    user_id: "u1",
    vocabulary_id: "v1",
    score: 50,
    last_exercise_at: "2026-02-20T12:00:00.000Z",
    practised_dates_count: 1,
    learnt: false,
    created_at: "2026-02-20T12:00:00.000Z",
    updated_at: "2026-02-20T12:00:00.000Z",
    vocabulary: vocab("en", "ru"),
    ...overrides,
  };
}

describe("aggregateProgressByPair", () => {
  it("returns empty array when no rows", () => {
    expect(aggregateProgressByPair([])).toEqual([]);
  });

  it("ignores rows with null vocabulary", () => {
    expect(aggregateProgressByPair([row({ vocabulary: null })])).toEqual([]);
  });

  it("aggregates one direction (en-ru) into one pair with one direction stats", () => {
    const rows = [
      row({
        vocabulary: vocab("en", "ru"),
        score: 60,
        learnt: true,
        last_exercise_at: "2026-02-20T10:00:00.000Z",
      }),
      row({
        vocabulary: vocab("en", "ru"),
        score: 40,
        learnt: false,
      }),
    ];
    const result = aggregateProgressByPair(rows);
    expect(result).toHaveLength(1);
    expect(result[0].pairKey).toBe("en-ru");
    expect(result[0].pairLabel).toBe("Russian ↔ English");
    expect(result[0].directionFromTo).toMatchObject({
      directionKey: "en-ru",
      wordCount: 2,
      averageScore: 50,
      learntCount: 1,
      // latest last_exercise_at of the two rows (second row has default 12:00)
      lastStudiedAt: "2026-02-20T12:00:00.000Z",
    });
    expect(result[0].directionToFrom).toBeNull();
  });

  it("aggregates both directions (en-ru and ru-en) into one pair with two direction stats", () => {
    const rows = [
      row({
        vocabulary: vocab("en", "ru"),
        score: 70,
        learnt: true,
      }),
      row({
        vocabulary: vocab("ru", "en"),
        score: 30,
        learnt: false,
      }),
    ];
    const result = aggregateProgressByPair(rows);
    expect(result).toHaveLength(1);
    expect(result[0].pairKey).toBe("en-ru");
    expect(result[0].directionFromTo).toMatchObject({
      directionKey: "en-ru",
      wordCount: 1,
      averageScore: 70,
      learntCount: 1,
    });
    expect(result[0].directionToFrom).toMatchObject({
      directionKey: "ru-en",
      wordCount: 1,
      averageScore: 30,
      learntCount: 0,
    });
  });

  it("uses latest last_exercise_at per direction", () => {
    const rows = [
      row({
        vocabulary: vocab("en", "ru"),
        last_exercise_at: "2026-02-18T00:00:00.000Z",
      }),
      row({
        vocabulary: vocab("en", "ru"),
        last_exercise_at: "2026-02-20T12:00:00.000Z",
      }),
    ];
    const result = aggregateProgressByPair(rows);
    expect(result[0].directionFromTo?.lastStudiedAt).toBe(
      "2026-02-20T12:00:00.000Z",
    );
  });

  it("sorts pairs by pairKey", () => {
    const rows = [
      row({ vocabulary: vocab("ru", "sr") }),
      row({ vocabulary: vocab("en", "ru") }),
    ];
    const result = aggregateProgressByPair(rows);
    expect(result.map((p) => p.pairKey)).toEqual(["en-ru", "ru-sr"]);
  });
});
