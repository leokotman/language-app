import { describe, it, expect } from "vitest";
import {
  normalizeText,
  sanitizeText,
  sanitizeEmail,
  sanitizePassword,
  clampAndStripControlChars,
  sanitizeWord,
  sanitizeTranslation,
  sanitizeSearch,
  MAX_EMAIL_LENGTH,
  MAX_WORD_LENGTH,
  MAX_SEARCH_LENGTH,
} from "@/lib/sanitize";

describe("sanitize", () => {
  describe("normalizeText", () => {
    it("trims whitespace", () => {
      expect(normalizeText("  hello  ")).toBe("hello");
    });
    it("strips control characters", () => {
      expect(normalizeText("a\x00b\x1Fc")).toBe("abc");
    });
    it("keeps tab and newline", () => {
      expect(normalizeText("a\tb\nc")).toBe("a\tb\nc");
    });
  });

  describe("sanitizeText", () => {
    it("trims and clamps to max length", () => {
      expect(sanitizeText("  ab  ", 10)).toBe("ab");
      expect(sanitizeText("a".repeat(20), 5)).toBe("aaaaa");
    });
  });

  describe("sanitizeEmail", () => {
    it("trims and clamps to MAX_EMAIL_LENGTH", () => {
      expect(sanitizeEmail("  user@example.com  ")).toBe("user@example.com");
      expect(sanitizeEmail("a".repeat(300)).length).toBe(MAX_EMAIL_LENGTH);
    });
  });

  describe("sanitizePassword", () => {
    it("trims and strips control chars", () => {
      expect(sanitizePassword("  pass  ")).toBe("pass");
      expect(sanitizePassword("p\x00ass")).toBe("pass");
    });
    it("clamps to max length", () => {
      expect(sanitizePassword("a".repeat(200)).length).toBeLessThanOrEqual(128);
    });
  });

  describe("clampAndStripControlChars", () => {
    it("does not trim", () => {
      expect(clampAndStripControlChars("  x  ", 10)).toBe("  x  ");
    });
    it("strips control chars and clamps", () => {
      expect(clampAndStripControlChars("a\x00b", 10)).toBe("ab");
      expect(clampAndStripControlChars("a".repeat(50), 5)).toBe("aaaaa");
    });
  });

  describe("sanitizeWord / sanitizeTranslation", () => {
    it("trims and clamps to MAX_WORD_LENGTH", () => {
      expect(sanitizeWord("  word  ")).toBe("word");
      expect(sanitizeWord("x".repeat(1000)).length).toBe(MAX_WORD_LENGTH);
      expect(sanitizeTranslation("  translation  ")).toBe("translation");
    });
  });

  describe("sanitizeSearch", () => {
    it("trims and clamps to MAX_SEARCH_LENGTH", () => {
      expect(sanitizeSearch("  query  ")).toBe("query");
      expect(sanitizeSearch("q".repeat(500)).length).toBe(MAX_SEARCH_LENGTH);
    });
  });
});
