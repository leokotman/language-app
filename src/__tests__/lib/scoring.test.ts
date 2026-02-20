import { describe, it, expect } from "vitest";
import { State } from "ts-fsrs";
import {
  retrievability,
  computeScore,
  isLearnt,
  STABILITY_LEARNT_DAYS,
} from "@/lib/scoring";
import type { ScoringInput } from "@/lib/scoring";

describe("scoring", () => {
  describe("retrievability", () => {
    it("returns 0 when stability is 0", () => {
      expect(retrievability(0, 0)).toBe(0);
      expect(retrievability(0, 10)).toBe(0);
    });

    it("returns 0.9 when elapsed_days equals stability", () => {
      expect(retrievability(10, 10)).toBeCloseTo(0.9, 10);
      expect(retrievability(21, 21)).toBeCloseTo(0.9, 10);
    });

    it("returns 1 when elapsed_days is 0", () => {
      expect(retrievability(10, 0)).toBe(1);
    });

    it("returns lower value when elapsed_days > stability", () => {
      expect(retrievability(10, 20)).toBeLessThan(0.9);
      expect(retrievability(10, 20)).toBeGreaterThan(0);
    });
  });

  describe("isLearnt", () => {
    it("returns true when state is Review and stability >= threshold", () => {
      expect(
        isLearnt({
          state: State.Review,
          stability: STABILITY_LEARNT_DAYS,
          elapsed_days: 0,
          reps: 5,
          lapses: 0,
        }),
      ).toBe(true);
      expect(
        isLearnt({
          state: State.Review,
          stability: 100,
          elapsed_days: 0,
          reps: 10,
          lapses: 0,
        }),
      ).toBe(true);
    });

    it("returns false when state is not Review", () => {
      expect(
        isLearnt({
          state: State.New,
          stability: 30,
          elapsed_days: 0,
          reps: 0,
          lapses: 0,
        }),
      ).toBe(false);
      expect(
        isLearnt({
          state: State.Learning,
          stability: 30,
          elapsed_days: 0,
          reps: 2,
          lapses: 0,
        }),
      ).toBe(false);
      expect(
        isLearnt({
          state: State.Relearning,
          stability: 30,
          elapsed_days: 0,
          reps: 2,
          lapses: 1,
        }),
      ).toBe(false);
    });

    it("returns false when stability < threshold", () => {
      expect(
        isLearnt({
          state: State.Review,
          stability: STABILITY_LEARNT_DAYS - 1,
          elapsed_days: 0,
          reps: 5,
          lapses: 0,
        }),
      ).toBe(false);
    });
  });

  describe("computeScore", () => {
    it("returns 0–50 for learning band (state not Review or stability < threshold)", () => {
      const input: ScoringInput = {
        state: State.Learning,
        stability: 5,
        elapsed_days: 0,
        reps: 2,
        lapses: 0,
      };
      const score = computeScore(input);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(50);
    });

    it("returns 50–100 for learnt band (Review and stability >= 21)", () => {
      const input: ScoringInput = {
        state: State.Review,
        stability: STABILITY_LEARNT_DAYS,
        elapsed_days: 0,
        reps: 5,
        lapses: 0,
      };
      const score = computeScore(input);
      expect(score).toBeGreaterThanOrEqual(50);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("reduces score when lapses increase", () => {
      const base: ScoringInput = {
        state: State.Review,
        stability: 100,
        elapsed_days: 0,
        reps: 10,
        lapses: 0,
      };
      const score0 = computeScore(base);
      const score1 = computeScore({ ...base, lapses: 1 });
      const score4 = computeScore({ ...base, lapses: 4 });
      expect(score1).toBeLessThan(score0);
      expect(score4).toBeLessThan(score1);
    });

    it("clamps learning band to [0, 50] and learnt band to [50, 100]", () => {
      const learningLow = computeScore({
        state: State.New,
        stability: 0,
        elapsed_days: 0,
        reps: 0,
        lapses: 4,
      });
      expect(learningLow).toBeGreaterThanOrEqual(0);
      expect(learningLow).toBeLessThanOrEqual(50);

      const learntHigh = computeScore({
        state: State.Review,
        stability: 400,
        elapsed_days: 0,
        reps: 20,
        lapses: 0,
      });
      expect(learntHigh).toBeGreaterThanOrEqual(50);
      expect(learntHigh).toBeLessThanOrEqual(100);
    });
  });
});
