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
import * as sanitizeMod from "@/lib/sanitize";

describe("dictionary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sanitizeMod.sanitizeSearch).mockImplementation((q: string) =>
      (q ?? "").trim(),
    );
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

    it("evicts oldest from memory when over LOOKUP_CACHE_MAX_ENTRIES", async () => {
      const entry: DictionaryEntry[] = [
        {
          word: "w",
          translation: "t",
          language_from: "en",
          language_to: "ru",
        },
      ];
      for (let i = 0; i < 80; i++) {
        vi.mocked(offlineCache.getDictionaryLookupCache).mockResolvedValue(
          entry,
        );
        await getLookupCache("en", "ru", `q${i}`);
      }
      vi.mocked(offlineCache.getDictionaryLookupCache).mockResolvedValue([
        { ...entry[0], word: "new", translation: "newt" },
      ]);
      const result = await getLookupCache("en", "ru", "newkey");
      expect(result).toHaveLength(1);
      expect(result![0].word).toBe("new");
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

    it("evicts oldest when over LOOKUP_CACHE_MAX_ENTRIES on set", () => {
      const entry: DictionaryEntry[] = [
        {
          word: "w",
          translation: "t",
          language_from: "en",
          language_to: "ru",
        },
      ];
      for (let i = 0; i < 81; i++) {
        setLookupCache("en", "ru", `evict${i}`, entry);
      }
      expect(offlineCache.setDictionaryLookupCache).toHaveBeenCalledTimes(81);
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

    it("returns entries from API matches, uses segment as word when present", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            matches: [
              { segment: "key", translation: "ključ", quality: 100 },
              { segment: "key", translation: "ključna", quality: 90 },
            ],
          }),
      } as Response);
      const result = await lookup("key", "en", "sr");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        word: "key",
        translation: "ključ",
        language_from: "en",
        language_to: "sr",
      });
      expect(result[1].translation).toBe("ključna");
      expect(offlineCache.setDictionaryLookupCache).toHaveBeenCalledWith(
        "en|sr|key",
        result,
      );
    });

    it("sorts by quality and accepts string quality from API", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            matches: [
              { translation: "low", quality: "10" },
              { translation: "high", quality: "95" },
            ],
          }),
      } as Response);
      const result = await lookup("x", "en", "ru");
      expect(result[0].translation).toBe("high");
      expect(result[1].translation).toBe("low");
    });

    it("filters echo/same-word and sorts by quality", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            matches: [
              { translation: "Love", quality: 50 },
              { translation: "affection", quality: 90 },
            ],
          }),
      } as Response);
      const result = await lookup("love", "en", "ru");
      expect(result).toHaveLength(1);
      expect(result[0].translation).toBe("affection");
    });

    it("uses responseData fallback when matches are empty after filtering", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            matches: [],
            responseData: { translatedText: "zdravo" },
          }),
      } as Response);
      const result = await lookup("hello", "en", "sr");
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        word: "hello",
        translation: "zdravo",
        language_from: "en",
        language_to: "sr",
      });
    });

    it("does not use fallback when same as query (normalized)", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            matches: [],
            responseData: { translatedText: "Hello" },
          }),
      } as Response);
      const result = await lookup("hello", "en", "ru");
      expect(result).toHaveLength(0);
    });

    it("throws and logs on fetch error", async () => {
      const err = new Error("Network failure");
      vi.spyOn(globalThis, "fetch").mockRejectedValue(err);
      const { logError } = await import("@/lib/errors");
      await expect(lookup("hi", "en", "ru")).rejects.toThrow("Network failure");
      expect(logError).toHaveBeenCalledWith("dictionary.lookup", err);
    });

    it("throws when response is not ok", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);
      await expect(lookup("hi", "en", "ru")).rejects.toThrow(
        "Dictionary API 500: Internal Server Error",
      );
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
