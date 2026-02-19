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
  getUserLanguages: vi.fn(),
  setUserLanguages: vi.fn(),
}));

import {
  getUserLanguages,
  addUserLanguage,
  removeUserLanguage,
  removeUserLanguagesByIds,
  addBidirectionalPair,
  updateUserLanguage,
} from "@/api/userLanguages";
import { supabase } from "@/lib/supabase";
import { isNetworkError } from "@/lib/errors";
import * as offlineCache from "@/lib/offlineCache";
import type { UserLanguageRow, UserLanguageInsert } from "@/types/database";

const mockUserLanguageRow: UserLanguageRow = {
  id: "ul-1",
  user_id: "user-1",
  native_code: "en",
  learning_code: "ru",
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("userLanguages API", () => {
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

  describe("getUserLanguages", () => {
    it("returns data from Supabase and writes cache when online", async () => {
      const data = [mockUserLanguageRow];
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({ data, error: null }) as never,
      );
      const result = await getUserLanguages("user-1");
      expect(result.data).toEqual(data);
      expect(result.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith("user_languages");
      expect(offlineCache.setUserLanguages).toHaveBeenCalledWith(
        "user-1",
        data,
      );
    });

    it("returns error when Supabase returns error and not network error", async () => {
      const err = new Error("db error");
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({ data: null, error: err }) as never,
      );
      const result = await getUserLanguages("user-1");
      expect(result.data).toEqual([]);
      expect(result.error).toBe(err);
    });

    it("returns cached data when network error and isNetworkError true", async () => {
      const cached = [mockUserLanguageRow];
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({
          data: null,
          error: new Error("Failed to fetch"),
        }) as never,
      );
      vi.mocked(isNetworkError).mockReturnValue(true);
      vi.mocked(offlineCache.getUserLanguages).mockResolvedValue(cached);
      const result = await getUserLanguages("user-1");
      expect(result.data).toEqual(cached);
      expect(result.error).toBeNull();
      expect(offlineCache.getUserLanguages).toHaveBeenCalledWith("user-1");
    });

    it("returns cached data when offline", async () => {
      const cached = [mockUserLanguageRow];
      Object.defineProperty(globalThis, "navigator", {
        value: { onLine: false },
        writable: true,
      });
      vi.mocked(offlineCache.getUserLanguages).mockResolvedValue(cached);
      const result = await getUserLanguages("user-1");
      expect(result.data).toEqual(cached);
      expect(result.error).toBeNull();
      expect(offlineCache.getUserLanguages).toHaveBeenCalledWith("user-1");
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("returns cached data when Supabase throws and isNetworkError is true", async () => {
      const networkErr = new Error("Failed to fetch");
      const cached = [mockUserLanguageRow];
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
      vi.mocked(offlineCache.getUserLanguages).mockResolvedValue(cached);
      const result = await getUserLanguages("user-1");
      expect(result.data).toEqual(cached);
      expect(result.error).toBeNull();
      expect(offlineCache.getUserLanguages).toHaveBeenCalledWith("user-1");
    });
  });

  describe("addUserLanguage", () => {
    it("inserts and returns new row", async () => {
      const payload: UserLanguageInsert = {
        user_id: "user-1",
        native_code: "en",
        learning_code: "ru",
      };
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({
          data: mockUserLanguageRow,
          error: null,
        }) as never,
      );
      const result = await addUserLanguage(payload);
      expect(result.data).toEqual(mockUserLanguageRow);
      expect(result.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith("user_languages");
    });
  });

  describe("removeUserLanguage", () => {
    it("deletes by id and returns no error", async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({ error: null }) as never,
      );
      const result = await removeUserLanguage("ul-1");
      expect(result.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith("user_languages");
    });
  });

  describe("removeUserLanguagesByIds", () => {
    it("returns no error when ids is empty", async () => {
      const result = await removeUserLanguagesByIds([]);
      expect(result.error).toBeNull();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("deletes by ids and returns no error", async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({ error: null }) as never,
      );
      const result = await removeUserLanguagesByIds(["ul-1", "ul-2"]);
      expect(result.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith("user_languages");
    });
  });

  describe("addBidirectionalPair", () => {
    it("returns error for invalid pair key", async () => {
      const result = await addBidirectionalPair("user-1", "invalid");
      expect(result.data).toEqual([]);
      expect(result.error).toBeInstanceOf(Error);
      expect((result.error as Error).message).toBe("Invalid pair key");
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("inserts both directions and returns rows", async () => {
      const rows = [
        {
          ...mockUserLanguageRow,
          id: "ul-1",
          native_code: "en",
          learning_code: "ru",
        },
        {
          ...mockUserLanguageRow,
          id: "ul-2",
          native_code: "ru",
          learning_code: "en",
        },
      ];
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({ data: rows, error: null }) as never,
      );
      const result = await addBidirectionalPair("user-1", "en-ru");
      expect(result.data).toEqual(rows);
      expect(result.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith("user_languages");
    });
  });

  describe("updateUserLanguage", () => {
    it("updates and returns row", async () => {
      const updated = { ...mockUserLanguageRow, learning_code: "sr" };
      vi.mocked(supabase.from).mockReturnValue(
        createSupabaseChain({ data: updated, error: null }) as never,
      );
      const result = await updateUserLanguage("ul-1", { learning_code: "sr" });
      expect(result.data).toEqual(updated);
      expect(result.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith("user_languages");
    });
  });
});
