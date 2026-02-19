import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/api/vocabulary", () => ({
  listAllAppVocabulary: vi.fn(),
  listUserVocabulary: vi.fn(),
}));
vi.mock("@/api/userLanguages", () => ({
  getUserLanguages: vi.fn(),
}));
vi.mock("@/lib/offlineCache", () => ({
  setAppVocabulary: vi.fn(),
}));
vi.mock("@/lib/offlineDebug", () => ({
  offlineLog: vi.fn(),
}));
vi.mock("@/lib/errors", () => ({
  logError: vi.fn(),
}));

import { syncForOffline } from "@/lib/offlineSync";
import * as vocabulary from "@/api/vocabulary";
import * as userLanguages from "@/api/userLanguages";
import * as offlineCache from "@/lib/offlineCache";

describe("offlineSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(vocabulary.listAllAppVocabulary).mockResolvedValue({
      data: [],
      error: null,
    });
    vi.mocked(userLanguages.getUserLanguages).mockResolvedValue({
      data: [],
      error: null,
    });
    vi.mocked(vocabulary.listUserVocabulary).mockResolvedValue({
      data: [],
      error: null,
    });
    vi.mocked(offlineCache.setAppVocabulary).mockResolvedValue(undefined);
  });

  it("returns success when all steps succeed and app vocab is empty", async () => {
    const result = await syncForOffline("user-1");
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(offlineCache.setAppVocabulary).not.toHaveBeenCalled();
  });

  it("calls setAppVocabulary when app vocab is non-empty", async () => {
    const appVocab = [
      {
        id: "v-1",
        word: "hi",
        translation: "привет",
        language_from: "en",
        language_to: "ru",
        source: "app" as const,
        created_by: null,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ];
    vi.mocked(vocabulary.listAllAppVocabulary).mockResolvedValue({
      data: appVocab,
      error: null,
    });
    const result = await syncForOffline("user-1");
    expect(result.success).toBe(true);
    expect(offlineCache.setAppVocabulary).toHaveBeenCalledWith(appVocab);
  });

  it("returns failure when listAllAppVocabulary returns error", async () => {
    const err = new Error("app vocab error");
    vi.mocked(vocabulary.listAllAppVocabulary).mockResolvedValue({
      data: [],
      error: err,
    });
    const result = await syncForOffline("user-1");
    expect(result.success).toBe(false);
    expect(result.error).toBe(err);
    expect(offlineCache.setAppVocabulary).not.toHaveBeenCalled();
  });

  it("returns failure when getUserLanguages returns error", async () => {
    const err = new Error("user langs error");
    vi.mocked(userLanguages.getUserLanguages).mockResolvedValue({
      data: [],
      error: err,
    });
    const result = await syncForOffline("user-1");
    expect(result.success).toBe(false);
    expect(result.error).toBe(err);
  });

  it("returns failure when listUserVocabulary returns error", async () => {
    const err = new Error("library error");
    vi.mocked(vocabulary.listUserVocabulary).mockResolvedValue({
      data: [],
      error: err,
    });
    const result = await syncForOffline("user-1");
    expect(result.success).toBe(false);
    expect(result.error).toBe(err);
  });

  it("wraps non-Error app error in Error", async () => {
    vi.mocked(vocabulary.listAllAppVocabulary).mockResolvedValue({
      data: [],
      error: "string error" as unknown as Error,
    });
    const result = await syncForOffline("user-1");
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe("string error");
  });

  it("returns failure and wraps error when sync throws", async () => {
    vi.mocked(vocabulary.listAllAppVocabulary).mockRejectedValue(
      new Error("network failed"),
    );
    const result = await syncForOffline("user-1");
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe("network failed");
  });

  it("wraps non-Error throw in Error", async () => {
    vi.mocked(vocabulary.listAllAppVocabulary).mockRejectedValue(
      "thrown string",
    );
    const result = await syncForOffline("user-1");
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe("thrown string");
  });
});
