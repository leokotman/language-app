import { describe, it, expect } from "vitest";
import {
  normalizeAnswer,
  isAnswerCorrect,
  pickDistractors,
  buildMultipleChoiceOptions,
  buildReverseMultipleChoiceOptions,
  assignExerciseTypes,
  speakWord,
  hasVoiceForLang,
  playRecordingBlob,
} from "@/pages/StudyPage/StudyPage.helpers";
import type { StudyCardItem } from "@/pages/StudyPage/StudyPage.models";

function makeCard(
  id: string,
  word: string,
  translation: string,
): StudyCardItem {
  return {
    id,
    user_id: "u1",
    vocabulary_id: "v1",
    created_at: "",
    last_review: null,
    state: 0,
    due: "",
    stability: 0,
    difficulty: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: 0,
    reps: 0,
    lapses: 0,
    vocabulary: {
      id: "v1",
      word,
      translation,
      language_from: "en",
      language_to: "ru",
      source: "app",
      created_by: null,
      created_at: "",
    },
  };
}

describe("StudyPage.helpers", () => {
  describe("normalizeAnswer", () => {
    it("trims and lowercases", () => {
      expect(normalizeAnswer("  Привет  ")).toBe("привет");
    });
    it("collapses multiple spaces", () => {
      expect(normalizeAnswer("a   b")).toBe("a b");
    });
  });

  describe("isAnswerCorrect", () => {
    it("returns true when normalized match", () => {
      expect(isAnswerCorrect("привет", "привет")).toBe(true);
      expect(isAnswerCorrect("  Привет  ", "привет")).toBe(true);
    });
    it("returns false when different", () => {
      expect(isAnswerCorrect("hello", "привет")).toBe(false);
    });
  });

  describe("pickDistractors", () => {
    it("returns shuffled unique translations from other cards", () => {
      const cards = [
        makeCard("1", "hello", "привет"),
        makeCard("2", "bye", "пока"),
        makeCard("3", "yes", "да"),
        makeCard("4", "no", "нет"),
      ];
      const distractors = pickDistractors(cards, cards[0], 3);
      expect(distractors).toHaveLength(3);
      expect(distractors).not.toContain("привет");
      expect(new Set(distractors).size).toBe(3);
    });
    it("returns fewer when not enough other cards", () => {
      const cards = [
        makeCard("1", "hello", "привет"),
        makeCard("2", "bye", "пока"),
      ];
      const distractors = pickDistractors(cards, cards[0], 3);
      expect(distractors).toHaveLength(1);
      expect(distractors[0]).toBe("пока");
    });
  });

  describe("buildMultipleChoiceOptions", () => {
    it("returns 4 options including correct", () => {
      const cards = [
        makeCard("1", "hello", "привет"),
        makeCard("2", "bye", "пока"),
        makeCard("3", "yes", "да"),
        makeCard("4", "no", "нет"),
        makeCard("5", "one", "один"),
      ];
      const options = buildMultipleChoiceOptions(cards, cards[0]);
      expect(options).toHaveLength(4);
      expect(options).toContain("привет");
    });
  });

  describe("buildReverseMultipleChoiceOptions", () => {
    it("returns 4 options including correct word", () => {
      const cards = [
        makeCard("1", "hello", "привет"),
        makeCard("2", "bye", "пока"),
        makeCard("3", "yes", "да"),
        makeCard("4", "no", "нет"),
        makeCard("5", "one", "один"),
      ];
      const options = buildReverseMultipleChoiceOptions(cards, cards[0]);
      expect(options).toHaveLength(4);
      expect(options).toContain("hello");
    });
  });

  describe("assignExerciseTypes", () => {
    it("returns empty array when enabledTypes is empty", () => {
      expect(assignExerciseTypes(5, [])).toEqual([]);
    });
    it("returns same type for all when one enabled", () => {
      const result = assignExerciseTypes(3, ["typing"]);
      expect(result).toEqual(["typing", "typing", "typing"]);
    });
    it("returns array of length cardCount with values from enabledTypes", () => {
      const enabled: Array<"flashcard" | "typing"> = ["flashcard", "typing"];
      const result = assignExerciseTypes(10, enabled);
      expect(result).toHaveLength(10);
      result.forEach((t) => {
        expect(enabled).toContain(t);
      });
    });
  });

  describe("speakWord", () => {
    it("returns missingLang when window or speechSynthesis is undefined", () => {
      const originalSpeechSynthesis = window.speechSynthesis;
      Object.defineProperty(window, "speechSynthesis", {
        value: undefined,
        writable: true,
      });
      expect(speakWord("hello", "en")).toEqual({
        spoke: false,
        missingLang: "en",
      });
      Object.defineProperty(window, "speechSynthesis", {
        value: originalSpeechSynthesis,
        writable: true,
      });
    });

    it("does not speak and returns missingLang when voices not yet loaded (Chrome)", () => {
      const speak = vi.fn();
      const cancel = vi.fn();
      Object.defineProperty(window, "speechSynthesis", {
        value: { speak, cancel, getVoices: () => [] },
        writable: true,
      });
      Object.defineProperty(window, "SpeechSynthesisUtterance", {
        value: class {},
        writable: true,
      });
      expect(speakWord("hello", "ru")).toEqual({
        spoke: false,
        missingLang: "ru",
      });
      expect(speak).not.toHaveBeenCalled();
    });

    it("sets utterance.voice when a matching language voice is available", () => {
      const speak = vi.fn();
      const cancel = vi.fn();
      const srVoice = {
        default: false,
        lang: "sr-Latn-RS",
        localService: true,
        name: "Serbian",
        voiceURI: "sr-latn",
      } as SpeechSynthesisVoice;
      Object.defineProperty(window, "speechSynthesis", {
        value: {
          speak,
          cancel,
          getVoices: () => [srVoice],
        },
        writable: true,
      });
      class MockUtterance {
        lang = "";
        rate = 1;
        voice: SpeechSynthesisVoice | null = null;
        text: string;
        constructor(text: string) {
          this.text = text;
        }
      }
      Object.defineProperty(window, "SpeechSynthesisUtterance", {
        value: MockUtterance,
        writable: true,
      });
      expect(speakWord("veče", "sr")).toEqual({ spoke: true });
      const utterance = speak.mock.calls[0][0];
      expect(utterance.lang).toBe("sr-Latn");
      expect(utterance.voice).toBe(srVoice);
    });

    it("does not speak and returns missingLang when no voice for language", () => {
      const speak = vi.fn();
      const cancel = vi.fn();
      const enVoice = {
        default: true,
        lang: "en-US",
        localService: true,
        name: "English",
        voiceURI: "en-us",
      } as SpeechSynthesisVoice;
      Object.defineProperty(window, "speechSynthesis", {
        value: {
          speak,
          cancel,
          getVoices: () => [enVoice],
        },
        writable: true,
      });
      Object.defineProperty(window, "SpeechSynthesisUtterance", {
        value: class {},
        writable: true,
      });
      expect(speakWord("dobar dan", "sr")).toEqual({
        spoke: false,
        missingLang: "sr",
      });
      expect(speak).not.toHaveBeenCalled();
    });
  });

  describe("hasVoiceForLang", () => {
    it("returns false when speechSynthesis is undefined", () => {
      const original = window.speechSynthesis;
      Object.defineProperty(window, "speechSynthesis", {
        value: undefined,
        writable: true,
      });
      expect(hasVoiceForLang("sr")).toBe(false);
      Object.defineProperty(window, "speechSynthesis", {
        value: original,
        writable: true,
      });
    });

    it("returns false when no voices loaded", () => {
      Object.defineProperty(window, "speechSynthesis", {
        value: { getVoices: () => [] },
        writable: true,
      });
      expect(hasVoiceForLang("sr")).toBe(false);
    });

    it("returns true when a matching voice exists", () => {
      const srVoice = {
        lang: "sr-Latn-RS",
      } as SpeechSynthesisVoice;
      Object.defineProperty(window, "speechSynthesis", {
        value: { getVoices: () => [srVoice] },
        writable: true,
      });
      expect(hasVoiceForLang("sr")).toBe(true);
    });
  });

  describe("playRecordingBlob", () => {
    it("does nothing when window is undefined", () => {
      const originalWindow = globalThis.window;
      Object.defineProperty(globalThis, "window", {
        value: undefined,
        writable: true,
      });
      expect(() => playRecordingBlob(new Blob())).not.toThrow();
      Object.defineProperty(globalThis, "window", {
        value: originalWindow,
        writable: true,
      });
    });

    it("revokes object URL when audio.play() rejects", async () => {
      const revokeSpy = vi
        .spyOn(URL, "revokeObjectURL")
        .mockImplementation(() => {});
      const mockPlay = vi.fn().mockRejectedValue(new Error("play failed"));
      class MockAudio {
        play = mockPlay;
        onended = null;
        onerror = null;
      }
      const originalAudio = globalThis.window.Audio;
      Object.defineProperty(globalThis.window, "Audio", {
        value: MockAudio,
        writable: true,
      });
      playRecordingBlob(new Blob());
      await vi.waitFor(() => {
        expect(mockPlay).toHaveBeenCalled();
      });
      await vi.waitFor(() => {
        expect(revokeSpy).toHaveBeenCalled();
      });
      Object.defineProperty(globalThis.window, "Audio", {
        value: originalAudio,
        writable: true,
      });
      revokeSpy.mockRestore();
    });
  });
});
