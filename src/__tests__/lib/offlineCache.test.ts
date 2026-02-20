/**
 * Tests for offlineCache use fake-indexeddb so IndexedDB APIs run in Node.
 * Must import fake-indexeddb/auto before the module under test.
 */
import "fake-indexeddb/auto";

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/offlineDebug", () => ({ offlineLog: vi.fn() }));

import {
  getAppVocabulary,
  setAppVocabulary,
  mergeAppVocabulary,
  getUserLanguages,
  setUserLanguages,
  getUserVocabularyList,
  setUserVocabularyList,
  getDictionaryLookupCache,
  setDictionaryLookupCache,
  type DictionaryLookupEntry,
  type UserVocabularyListItem,
} from "@/lib/offlineCache";
import type { VocabularyRow } from "@/types/database";
import type { UserLanguageRow } from "@/types/database";

const DB_NAME = "language-app-offline";

function deleteDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

const vocabRow = (overrides: Partial<VocabularyRow> = {}): VocabularyRow => ({
  id: "v1",
  word: "hello",
  translation: "привет",
  language_from: "en",
  language_to: "ru",
  source: "app",
  created_by: null,
  created_at: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const userLangRow = (
  overrides: Partial<UserLanguageRow> = {},
): UserLanguageRow => ({
  id: "ul1",
  user_id: "user-1",
  learning_code: "ru",
  native_code: "en",
  created_at: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const userVocabListItem = (
  overrides: Partial<UserVocabularyListItem> = {},
): UserVocabularyListItem => ({
  id: "uv1",
  user_id: "user-1",
  vocabulary_id: "v1",
  state: 0,
  due: "2026-01-01",
  stability: 0,
  difficulty: 0,
  elapsed_days: 0,
  scheduled_days: 0,
  learning_steps: 0,
  reps: 0,
  lapses: 0,
  last_review: null,
  created_at: "2026-01-01T00:00:00.000Z",
  vocabulary: vocabRow(),
  ...overrides,
});

const lookupEntry = (
  overrides: Partial<DictionaryLookupEntry> = {},
): DictionaryLookupEntry => ({
  word: "hello",
  translation: "привет",
  language_from: "en",
  language_to: "ru",
  ...overrides,
});

describe("offlineCache", () => {
  beforeEach(async () => {
    await deleteDb();
  });

  describe("getAppVocabulary / setAppVocabulary", () => {
    it("returns empty array when nothing stored", async () => {
      const result = await getAppVocabulary();
      expect(result).toEqual([]);
    });

    it("returns stored rows after setAppVocabulary", async () => {
      const rows: VocabularyRow[] = [
        vocabRow(),
        vocabRow({ id: "v2", word: "world" }),
      ];
      await setAppVocabulary(rows);
      const result = await getAppVocabulary();
      expect(result).toEqual(rows);
    });
  });

  describe("mergeAppVocabulary", () => {
    it("does nothing when newRows is empty", async () => {
      await setAppVocabulary([vocabRow()]);
      await mergeAppVocabulary([]);
      const result = await getAppVocabulary();
      expect(result).toHaveLength(1);
    });

    it("merges new rows by id and overwrites existing", async () => {
      await setAppVocabulary([vocabRow({ id: "v1", word: "old" })]);
      await mergeAppVocabulary([
        vocabRow({ id: "v1", word: "new" }),
        vocabRow({ id: "v2" }),
      ]);
      const result = await getAppVocabulary();
      expect(result).toHaveLength(2);
      expect(result.find((row) => row.id === "v1")?.word).toBe("new");
      expect(result.find((row) => row.id === "v2")).toBeDefined();
    });
  });

  describe("getUserLanguages / setUserLanguages", () => {
    it("returns empty array when nothing stored for user", async () => {
      const result = await getUserLanguages("user-1");
      expect(result).toEqual([]);
    });

    it("returns stored rows after setUserLanguages", async () => {
      const rows: UserLanguageRow[] = [userLangRow()];
      await setUserLanguages("user-1", rows);
      const result = await getUserLanguages("user-1");
      expect(result).toEqual(rows);
    });
  });

  describe("getUserVocabularyList / setUserVocabularyList", () => {
    it("returns empty array when nothing stored for user", async () => {
      const result = await getUserVocabularyList("user-1");
      expect(result).toEqual([]);
    });

    it("returns stored items after setUserVocabularyList", async () => {
      const items: UserVocabularyListItem[] = [userVocabListItem()];
      await setUserVocabularyList("user-1", items);
      const result = await getUserVocabularyList("user-1");
      expect(result).toEqual(items);
    });
  });

  describe("getDictionaryLookupCache / setDictionaryLookupCache", () => {
    it("returns null when key not stored", async () => {
      const result = await getDictionaryLookupCache("en|ru|hello");
      expect(result).toBeNull();
    });

    it("does not write when entries are empty", async () => {
      await setDictionaryLookupCache("en|ru|x", []);
      const result = await getDictionaryLookupCache("en|ru|x");
      expect(result).toBeNull();
    });

    it("returns stored entries after setDictionaryLookupCache", async () => {
      const entries: DictionaryLookupEntry[] = [
        lookupEntry(),
        lookupEntry({ word: "world", translation: "мир" }),
      ];
      await setDictionaryLookupCache("en|ru|hello", entries);
      const result = await getDictionaryLookupCache("en|ru|hello");
      expect(result).toEqual(entries);
    });

    it("evicts oldest lookup keys when over limit", async () => {
      const entry = lookupEntry();
      for (let index = 0; index < 82; index++) {
        await setDictionaryLookupCache(`key-${index}`, [entry]);
      }
      const first = await getDictionaryLookupCache("key-0");
      const last = await getDictionaryLookupCache("key-81");
      expect(first).toBeNull();
      expect(last).toEqual([entry]);
    });
  });
});
