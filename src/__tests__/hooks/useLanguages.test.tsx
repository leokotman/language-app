import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useLanguages } from "@/hooks/useLanguages";
import { getLanguages } from "@/api/languages";
import type { LanguageRow } from "@/types/database";

vi.mock("@/api/languages", () => ({
  getLanguages: vi.fn(),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useLanguages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns languages data when getLanguages succeeds", async () => {
    const data: LanguageRow[] = [
      { code: "en", name: "English" },
      { code: "ru", name: "Russian" },
    ];
    vi.mocked(getLanguages).mockResolvedValue({ data, error: null });

    const { result } = renderHook(() => useLanguages(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual(data);
    expect(getLanguages).toHaveBeenCalledTimes(1);
  });

  it("returns error state when getLanguages returns error", async () => {
    const err = new Error("fetch failed");
    vi.mocked(getLanguages).mockResolvedValue({ data: [], error: err });

    const { result } = renderHook(() => useLanguages(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error).toBe(err);
  });
});
