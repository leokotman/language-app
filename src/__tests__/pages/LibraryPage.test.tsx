import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { LibraryPage } from "@/pages/LibraryPage/LibraryPage";

const mockMutate = vi.fn();
const mockMutateAsync = vi.fn().mockResolvedValue(undefined);
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

vi.mock("@/stores/authStore", () => ({
  useAuthStore: (selector: (s: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: "user-1" } }),
}));
vi.mock("@/hooks/useUserLanguages", () => ({
  useUserLanguages: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
}));
vi.mock("@/hooks/useVocabulary", () => ({
  useUserVocabularyList: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
  useAddWordToLibrary: () => ({
    mutate: mockMutate,
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useUpdateVocabulary: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteVocabulary: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/lib/errors", () => ({
  isSupabaseTableMissingError: () => false,
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
}

describe("LibraryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders My Library heading", () => {
    render(<LibraryPage />, { wrapper });
    expect(
      screen.getByRole("heading", { name: "My Library" }),
    ).toBeInTheDocument();
  });
});
