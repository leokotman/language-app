import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { DictionaryPage } from "@/pages/DictionaryPage/DictionaryPage";

const mockMutate = vi.fn();
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

vi.mock("@/stores/authStore", () => ({
  useAuthStore: (selector: (s: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: "user-1" } }),
}));
vi.mock("@/stores/offlineModeStore", () => ({
  useOfflineModeStore: (selector: (s: { offlineMode: boolean }) => unknown) =>
    selector({ offlineMode: false }),
}));
vi.mock("@/hooks/useVocabulary", () => ({
  useVocabularyList: () => ({
    data: [],
    isLoading: false,
    isSuccess: true,
  }),
  useUserVocabularyList: () => ({
    data: [],
    isLoading: false,
    isSuccess: true,
  }),
  useAddToUserLibrary: () => ({ mutate: mockMutate, isPending: false }),
  useAddWordToLibrary: () => ({ mutate: mockMutate, isPending: false }),
}));
vi.mock("@/lib/dictionary", () => ({
  lookup: vi.fn().mockResolvedValue([]),
  getLookupCache: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/offlineDebug", () => ({
  offlineLog: vi.fn(),
  dictPerfLog: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("DictionaryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Dictionary heading and lookup UI", () => {
    render(<DictionaryPage />, { wrapper });
    expect(
      screen.getByRole("heading", { name: "Dictionary" }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Search \(e\.g\. hello/),
    ).toBeInTheDocument();
  });
});
