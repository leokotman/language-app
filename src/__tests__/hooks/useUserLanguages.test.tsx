import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useUserLanguages,
  useAddUserLanguage,
  useRemoveUserLanguage,
  USER_LANGUAGES_QUERY_KEY,
} from "@/hooks/useUserLanguages";
import * as userLanguagesApi from "@/api/userLanguages";
import type { UserLanguageRow } from "@/types/database";

vi.mock("@/api/userLanguages", () => ({
  getUserLanguages: vi.fn(),
  addUserLanguage: vi.fn(),
  removeUserLanguage: vi.fn(),
  removeUserLanguagesByIds: vi.fn(),
  addBidirectionalPair: vi.fn(),
  updateUserLanguage: vi.fn(),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

const mockRow: UserLanguageRow = {
  id: "ul-1",
  user_id: "user-1",
  native_code: "en",
  learning_code: "ru",
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("useUserLanguages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userLanguagesApi.getUserLanguages).mockResolvedValue({
      data: [mockRow],
      error: null,
    });
  });

  it("returns user languages when userId is set and fetch succeeds", async () => {
    const { result } = renderHook(() => useUserLanguages("user-1"), {
      wrapper,
    });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual([mockRow]);
    expect(userLanguagesApi.getUserLanguages).toHaveBeenCalledWith("user-1");
  });

  it("does not run query when userId is undefined", async () => {
    const { result } = renderHook(() => useUserLanguages(undefined), {
      wrapper,
    });
    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(userLanguagesApi.getUserLanguages).not.toHaveBeenCalled();
  });

  it("returns error when getUserLanguages returns error", async () => {
    const err = new Error("fetch failed");
    vi.mocked(userLanguagesApi.getUserLanguages).mockResolvedValue({
      data: [],
      error: err,
    });
    const { result } = renderHook(() => useUserLanguages("user-1"), {
      wrapper,
    });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error).toBe(err);
  });
});

describe("useAddUserLanguage", () => {
  it("calls addUserLanguage and invalidates user languages", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }
    vi.mocked(userLanguagesApi.addUserLanguage).mockResolvedValue({
      data: mockRow,
      error: null,
    });
    const { result } = renderHook(() => useAddUserLanguage(), {
      wrapper: Wrapper,
    });
    await act(async () => {
      result.current.mutate({
        user_id: "user-1",
        native_code: "en",
        learning_code: "ru",
      });
    });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(userLanguagesApi.addUserLanguage).toHaveBeenCalledWith({
      user_id: "user-1",
      native_code: "en",
      learning_code: "ru",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [...USER_LANGUAGES_QUERY_KEY, "user-1"],
    });
  });
});

describe("useRemoveUserLanguage", () => {
  it("calls removeUserLanguage and invalidates queries", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }
    vi.mocked(userLanguagesApi.removeUserLanguage).mockResolvedValue({
      error: null,
    });
    const { result } = renderHook(() => useRemoveUserLanguage("user-1"), {
      wrapper: Wrapper,
    });
    await act(async () => {
      result.current.mutate("ul-1");
    });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(userLanguagesApi.removeUserLanguage).toHaveBeenCalledWith("ul-1");
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [...USER_LANGUAGES_QUERY_KEY, "user-1"],
    });
  });
});
