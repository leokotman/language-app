import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/errors", () => ({ logError: vi.fn() }));
vi.mock("@/lib/sanitize", () => ({
  sanitizeSearch: vi.fn((q: string) => q.trim()),
}));
vi.mock("@/lib/offlineCache", () => ({
  getDictionaryLookupCache: vi.fn(),
  setDictionaryLookupCache: vi.fn(),
}));

import {
  lookupCacheKey,
  getLookupCache,
  setLookupCache,
  lookup,
  MAX_TRANSLATIONS,
  SUPPORTED_LANGS,
  type DictionaryEntry,
} from "@/lib/dictionary";
import * as offlineCache from "@/lib/offlineCache";

describe("dictionary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(offlineCache.getDictionaryLookupCache).mockResolvedValue(null);
    vi.mocked(offlineCache.setDictionaryLookupCache).mockResolvedValue(
      undefined,
    );
    Object.defineProperty(globalThis, "navigator", {
      value: { onLine: true },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("lookupCacheKey", () => {
    it("returns key from fromLang, toLang and trimmed lowercased query", () => {
      expect(lookupCacheKey("en", "ru", "  Hello  ")).toBe("en|ru|hello");
      expect(lookupCacheKey("ru", "en", "привет")).toBe("ru|en|привет");
    });
  });

  describe("getLookupCache", () => {
    it("returns undefined when not in memory or IDB", async () => {
      const result = await getLookupCache("en", "ru", "hello");
      expect(result).toBeUndefined();
    });

    it("returns from IDB when not in memory and IDB has entries", async () => {
      const entries: DictionaryEntry[] = [
        {
          word: "hello",
          translation: "привет",
          language_from: "en",
          language_to: "ru",
        },
      ];
      vi.mocked(offlineCache.getDictionaryLookupCache).mockResolvedValue(
        entries,
      );
      const result = await getLookupCache("en", "ru", "hello");
      expect(result).toEqual(entries);
      expect(offlineCache.getDictionaryLookupCache).toHaveBeenCalledWith(
        "en|ru|hello",
      );
    });

    it("returns from memory on second call after IDB populated first", async () => {
      const entries: DictionaryEntry[] = [
        {
          word: "hi",
          translation: "привет",
          language_from: "en",
          language_to: "ru",
        },
      ];
      vi.mocked(offlineCache.getDictionaryLookupCache).mockResolvedValue(
        entries,
      );
      await getLookupCache("en", "ru", "hi");
      vi.mocked(offlineCache.getDictionaryLookupCache).mockResolvedValue(null);
      const second = await getLookupCache("en", "ru", "hi");
      expect(second).toEqual(entries);
    });

    it("returns undefined when IDB returns empty array", async () => {
      vi.mocked(offlineCache.getDictionaryLookupCache).mockResolvedValue([]);
      const result = await getLookupCache("en", "ru", "nonexistentkey");
      expect(result).toBeUndefined();
    });
  });

  describe("setLookupCache", () => {
    it("does nothing when entries are empty", () => {
      setLookupCache("en", "ru", "x", []);
      expect(offlineCache.setDictionaryLookupCache).not.toHaveBeenCalled();
    });

    it("stores entries in memory and calls setDictionaryLookupCache", async () => {
      const entries: DictionaryEntry[] = [
        {
          word: "hello",
          translation: "привет",
          language_from: "en",
          language_to: "ru",
        },
      ];
      setLookupCache("en", "ru", "hello", entries);
      expect(offlineCache.setDictionaryLookupCache).toHaveBeenCalledWith(
        "en|ru|hello",
        entries,
      );
      const fromMemory = await getLookupCache("en", "ru", "hello");
      vi.mocked(offlineCache.getDictionaryLookupCache).mockResolvedValue(null);
      expect(fromMemory).toEqual(entries);
    });
  });

  describe("lookup", () => {
    it("returns empty array when query is empty after sanitize", async () => {
      const { sanitizeSearch } = await import("@/lib/sanitize");
      vi.mocked(sanitizeSearch).mockReturnValue("");
      const result = await lookup("  ", "en", "ru");
      expect(result).toEqual([]);
    });

    it("returns empty array when offlineMode is true", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");
      const result = await lookup("hello", "en", "ru", { offlineMode: true });
      expect(result).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("returns empty array when navigator is offline", async () => {
      Object.defineProperty(globalThis, "navigator", {
        value: { onLine: false },
        writable: true,
      });
      const fetchSpy = vi.spyOn(globalThis, "fetch");
      const result = await lookup("hello", "en", "ru");
      expect(result).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("returns empty array for unsupported lang or same from/to", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");
      expect(await lookup("hi", "xx", "ru")).toEqual([]);
      expect(await lookup("hi", "en", "zz")).toEqual([]);
      expect(await lookup("hi", "en", "en")).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("exports", () => {
    it("MAX_TRANSLATIONS is 50", () => {
      expect(MAX_TRANSLATIONS).toBe(50);
    });
    it("SUPPORTED_LANGS includes en, ru, sr", () => {
      expect(SUPPORTED_LANGS).toEqual(["en", "ru", "sr"]);
    });
  });
});
