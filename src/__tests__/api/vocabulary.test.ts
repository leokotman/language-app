import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSupabaseChain } from "../helpers/supabaseMock";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("@/lib/errors", () => ({
  isNetworkError: vi.fn(),
}));

vi.mock("@/lib/offlineDebug", () => ({
  offlineLog: vi.fn(),
}));

vi.mock("@/lib/offlineCache", () => ({
  getAppVocabulary: vi.fn(),
  mergeAppVocabulary: vi.fn(),
  getUserVocabularyList: vi.fn(),
  setUserVocabularyList: vi.fn(),
}));

import {
  listAllAppVocabulary,
  listVocabulary,
  createVocabulary,
  updateVocabulary,
  deleteVocabulary,
  getVocabularyById,
  listDueToday,
  listUserVocabulary,
  addToUserLibrary,
  updateUserVocabulary,
  removeFromUserLibrary,
  addWordToLibrary,
} from "@/api/vocabulary";
import { supabase } from "@/lib/supabase";
import { isNetworkError } from "@/lib/errors";
import * as offlineCache from "@/lib/offlineCache";
import type {
  VocabularyRow,
  UserVocabularyRow,
  UserVocabularyInsert,
  UserVocabularyUpdate,
} from "@/types/database";

const mockVocabularyRow: VocabularyRow = {
  id: "v-1",
  word: "hello",
  translation: "привет",
  language_from: "en",
  language_to: "ru",
  source: "app",
  created_by: null,
  created_at: "2026-01-01T00:00:00.000Z",
};

const mockUserVocabularyRow: UserVocabularyRow = {
  id: "uv-1",
  user_id: "user-1",
  vocabulary_id: "v-1",
  state: 0,
  due: "2026-02-18T12:00:00.000Z",
  stability: 0,
  difficulty: 0,
  elapsed_days: 0,
  scheduled_days: 0,
  learning_steps: 0,
  reps: 0,
  lapses: 0,
  last_review: null,
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("vocabulary API", () => {
  beforeEach(() => {
    vi.mocked(isNetworkError).mockReturnValue(false);
    Object.defineProperty(globalThis, "navigator", {
      value: { onLine: true },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("listAllAppVocabulary", () => {
    it("returns app vocabulary and no error", async () => {
      const data = [mockVocabularyRow];
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({ data, error: null }) as never,
      );
      const result = await listAllAppVocabulary();
      expect(result.data).toEqual(data);
      expect(result.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith("vocabulary");
    });
  });

  describe("listVocabulary", () => {
    it("returns filtered data when online and merges to cache when non-empty", async () => {
      const data = [mockVocabularyRow];
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({ data, error: null }) as never,
      );
      const result = await listVocabulary({
        languageFrom: "en",
        languageTo: "ru",
        includeUserCreated: false,
      });
      expect(result.data).toEqual(data);
      expect(result.error).toBeNull();
      expect(offlineCache.mergeAppVocabulary).toHaveBeenCalledWith(data);
    });

    it("does not merge when data is empty", async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({ data: [], error: null }) as never,
      );
      await listVocabulary({ languageFrom: "en", languageTo: "ru" });
      expect(offlineCache.mergeAppVocabulary).not.toHaveBeenCalled();
    });

    it("returns cached app vocabulary when offline", async () => {
      Object.defineProperty(globalThis, "navigator", {
        value: { onLine: false },
        writable: true,
      });
      const cached = [mockVocabularyRow];
      vi.mocked(offlineCache.getAppVocabulary).mockResolvedValue(cached);
      const result = await listVocabulary({
        languageFrom: "en",
        languageTo: "ru",
      });
      expect(result.data).toEqual(cached);
      expect(result.error).toBeNull();
      expect(offlineCache.getAppVocabulary).toHaveBeenCalled();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("returns cached filtered data on network error", async () => {
      const cached = [mockVocabularyRow];
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({
          data: null,
          error: new Error("Failed to fetch"),
        }) as never,
      );
      vi.mocked(isNetworkError).mockReturnValue(true);
      vi.mocked(offlineCache.getAppVocabulary).mockResolvedValue(cached);
      const result = await listVocabulary({
        languageFrom: "en",
        languageTo: "ru",
      });
      expect(result.data).toEqual(cached);
      expect(result.error).toBeNull();
    });

    it("returns cached filtered data when query throws and isNetworkError is true", async () => {
      const networkErr = new Error("Failed to fetch");
      const cached = [mockVocabularyRow];
      const rejectingChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then(_: unknown, reject?: (r: unknown) => void) {
          return Promise.reject(networkErr).then(undefined, reject);
        },
      };
      vi.mocked(supabase.from).mockReturnValue(rejectingChain as never);
      vi.mocked(isNetworkError).mockReturnValue(true);
      vi.mocked(offlineCache.getAppVocabulary).mockResolvedValue(cached);
      const result = await listVocabulary({
        languageFrom: "en",
        languageTo: "ru",
      });
      expect(result.data).toEqual(cached);
      expect(result.error).toBeNull();
    });
  });

  describe("createVocabulary", () => {
    it("inserts and returns row", async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({ data: mockVocabularyRow, error: null }) as never,
      );
      const result = await createVocabulary({
        word: "hello",
        translation: "привет",
        language_from: "en",
        language_to: "ru",
        source: "user",
        created_by: "user-1",
      });
      expect(result.data).toEqual(mockVocabularyRow);
      expect(result.error).toBeNull();
    });
  });

  describe("updateVocabulary", () => {
    it("updates and returns row", async () => {
      const updated = { ...mockVocabularyRow, translation: "здравствуй" };
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({ data: updated, error: null }) as never,
      );
      const result = await updateVocabulary("v-1", {
        translation: "здравствуй",
      });
      expect(result.data).toEqual(updated);
      expect(result.error).toBeNull();
    });
  });

  describe("deleteVocabulary", () => {
    it("deletes by id and returns no error", async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({ error: null }) as never,
      );
      const result = await deleteVocabulary("v-1");
      expect(result.error).toBeNull();
    });
  });

  describe("getVocabularyById", () => {
    it("returns row by id", async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({ data: mockVocabularyRow, error: null }) as never,
      );
      const result = await getVocabularyById("v-1");
      expect(result.data).toEqual(mockVocabularyRow);
      expect(result.error).toBeNull();
    });
  });

  describe("listDueToday", () => {
    const dueRow = {
      ...mockUserVocabularyRow,
      vocabulary: mockVocabularyRow,
    };

    it("returns due rows and no error", async () => {
      const data = [dueRow];
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({ data, error: null }) as never,
      );
      const result = await listDueToday("user-1");
      expect(result.data).toEqual(data);
      expect(result.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith("user_vocabulary");
    });

    it("filters by pairKey when provided", async () => {
      const enRu = {
        ...dueRow,
        vocabulary: {
          ...mockVocabularyRow,
          language_from: "en",
          language_to: "ru",
        },
      };
      const ruEn = {
        ...dueRow,
        id: "uv-2",
        vocabulary: {
          ...mockVocabularyRow,
          language_from: "ru",
          language_to: "en",
        },
      };
      const other = {
        ...dueRow,
        id: "uv-3",
        vocabulary: {
          ...mockVocabularyRow,
          language_from: "sr",
          language_to: "en",
        },
      };
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({
          data: [enRu, ruEn, other],
          error: null,
        }) as never,
      );
      const result = await listDueToday("user-1", { pairKey: "en-ru" });
      expect(result.data).toHaveLength(2);
      expect(result.data?.map((row) => row.id)).toEqual(["uv-1", "uv-2"]);
      expect(result.error).toBeNull();
    });

    it("filters by languageFrom and languageTo when provided", async () => {
      const matching = {
        ...dueRow,
        vocabulary: {
          ...mockVocabularyRow,
          language_from: "en",
          language_to: "ru",
        },
      };
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({ data: [matching], error: null }) as never,
      );
      const result = await listDueToday("user-1", {
        languageFrom: "en",
        languageTo: "ru",
      });
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].vocabulary?.language_from).toBe("en");
      expect(result.data?.[0].vocabulary?.language_to).toBe("ru");
    });

    it("returns all rows when pairKey has no hyphen (a && b falsy)", async () => {
      const dueRow1 = {
        ...dueRow,
        vocabulary: {
          ...mockVocabularyRow,
          language_from: "en",
          language_to: "ru",
        },
      };
      const dueRow2 = {
        ...dueRow,
        id: "uv-2",
        vocabulary: {
          ...mockVocabularyRow,
          language_from: "sr",
          language_to: "en",
        },
      };
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({ data: [dueRow1, dueRow2], error: null }) as never,
      );
      const result = await listDueToday("user-1", { pairKey: "en" as "en-ru" });
      expect(result.data).toHaveLength(2);
      expect(result.error).toBeNull();
    });
  });

  describe("listUserVocabulary", () => {
    const listItem = {
      ...mockUserVocabularyRow,
      vocabulary: mockVocabularyRow,
    };

    it("returns data from Supabase and writes cache when online", async () => {
      const data = [listItem];
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({ data, error: null }) as never,
      );
      const result = await listUserVocabulary("user-1");
      expect(result.data).toEqual(data);
      expect(result.error).toBeNull();
      expect(offlineCache.setUserVocabularyList).toHaveBeenCalledWith(
        "user-1",
        data,
      );
    });

    it("returns cached data when offline", async () => {
      Object.defineProperty(globalThis, "navigator", {
        value: { onLine: false },
        writable: true,
      });
      const cached = [listItem];
      vi.mocked(offlineCache.getUserVocabularyList).mockResolvedValue(cached);
      const result = await listUserVocabulary("user-1");
      expect(result.data).toEqual(cached);
      expect(result.error).toBeNull();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("returns cached data when Supabase returns error and isNetworkError is true", async () => {
      const networkErr = new Error("Failed to fetch");
      const cached = [listItem];
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({ data: null, error: networkErr }) as never,
      );
      vi.mocked(isNetworkError).mockReturnValue(true);
      vi.mocked(offlineCache.getUserVocabularyList).mockResolvedValue(cached);
      const result = await listUserVocabulary("user-1");
      expect(result.data).toEqual(cached);
      expect(result.error).toBeNull();
      expect(offlineCache.getUserVocabularyList).toHaveBeenCalledWith("user-1");
    });

    it("returns cached data when Supabase throws and isNetworkError is true", async () => {
      const networkErr = new Error("Failed to fetch");
      const cached = [listItem];
      const rejectingChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then(_: unknown, reject?: (r: unknown) => void) {
          return Promise.reject(networkErr).then(undefined, reject);
        },
      };
      vi.mocked(supabase.from).mockReturnValue(rejectingChain as never);
      vi.mocked(isNetworkError).mockReturnValue(true);
      vi.mocked(offlineCache.getUserVocabularyList).mockResolvedValue(cached);
      const result = await listUserVocabulary("user-1");
      expect(result.data).toEqual(cached);
      expect(result.error).toBeNull();
      expect(offlineCache.getUserVocabularyList).toHaveBeenCalledWith("user-1");
    });
  });

  describe("addToUserLibrary", () => {
    it("inserts and returns user_vocabulary row", async () => {
      const payload: UserVocabularyInsert = {
        user_id: "user-1",
        vocabulary_id: "v-1",
      };
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({
          data: mockUserVocabularyRow,
          error: null,
        }) as never,
      );
      const result = await addToUserLibrary(payload);
      expect(result.data).toEqual(mockUserVocabularyRow);
      expect(result.error).toBeNull();
    });
  });

  describe("updateUserVocabulary", () => {
    it("updates FSRS fields and returns row", async () => {
      const updates: UserVocabularyUpdate = {
        due: "2026-02-19T12:00:00.000Z",
        state: 1,
      };
      const updated = { ...mockUserVocabularyRow, ...updates };
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({ data: updated, error: null }) as never,
      );
      const result = await updateUserVocabulary("uv-1", updates);
      expect(result.data).toEqual(updated);
      expect(result.error).toBeNull();
    });
  });

  describe("removeFromUserLibrary", () => {
    it("deletes by id and returns no error", async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({ error: null }) as never,
      );
      const result = await removeFromUserLibrary("uv-1");
      expect(result.error).toBeNull();
    });
  });

  describe("addWordToLibrary", () => {
    it("creates vocabulary then user_vocabulary and returns combined", async () => {
      const vocabRow = {
        ...mockVocabularyRow,
        source: "user" as const,
        created_by: "user-1",
      };
      const userVocabRow = { ...mockUserVocabularyRow, vocabulary: vocabRow };
      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return createSupabaseChain({ data: vocabRow, error: null }) as never;
        }
        return createSupabaseChain({
          data: userVocabRow,
          error: null,
        }) as never;
      });
      const result = await addWordToLibrary("user-1", {
        word: " hello ",
        translation: " привет ",
        language_from: "en",
        language_to: "ru",
      });
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.vocabulary?.word).toBe("hello");
      expect(result.data?.vocabulary?.translation).toBe("привет");
    });

    it("returns error when createVocabulary fails", async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({
          data: null,
          error: new Error("create failed"),
        }) as never,
      );
      const result = await addWordToLibrary("user-1", {
        word: "hi",
        translation: "привет",
        language_from: "en",
        language_to: "ru",
      });
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });

    it("returns error when addToUserLibrary fails after createVocabulary succeeds", async () => {
      const vocabRow = {
        ...mockVocabularyRow,
        id: "v-new",
        source: "user" as const,
        created_by: "user-1",
      };
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "vocabulary") {
          return createSupabaseChain({ data: vocabRow, error: null }) as never;
        }
        return createSupabaseChain({
          data: null,
          error: new Error("add to library failed"),
        }) as never;
      });
      const result = await addWordToLibrary("user-1", {
        word: "hi",
        translation: "привет",
        language_from: "en",
        language_to: "ru",
      });
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });
});
