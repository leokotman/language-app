import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HomePage } from "@/pages/HomePage";
import { ThemeModeProvider } from "@/theme/ThemeModeContext";
import { useAuth } from "@/hooks/useAuth";
import { useDueToday, useVocabularyScores } from "@/hooks/useVocabulary";

type UseAuthReturn = ReturnType<typeof useAuth>;
type UseVocabularyScoresReturn = ReturnType<typeof useVocabularyScores>;
type UseDueTodayReturn = ReturnType<typeof useDueToday>;

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/useVocabulary", () => ({
  useVocabularyScores: vi.fn(),
  useDueToday: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeModeProvider>
          <MemoryRouter>{children}</MemoryRouter>
        </ThemeModeProvider>
      </QueryClientProvider>
    );
  };
}

function mockUseAuthState(value: unknown) {
  vi.mocked(useAuth).mockReturnValue(value as UseAuthReturn);
}

function mockUseVocabularyScoresState(
  value: unknown,
) {
  vi.mocked(useVocabularyScores).mockReturnValue(
    value as unknown as UseVocabularyScoresReturn,
  );
}

function mockUseDueTodayState(value: unknown) {
  vi.mocked(useDueToday).mockReturnValue(
    value as unknown as UseDueTodayReturn,
  );
}

describe("HomePage", () => {
  beforeEach(() => {
    mockUseAuthState({
      user: { id: "user-1", email: "test@example.com" },
      session: { access_token: "token" },
      loading: false,
      isAuthenticated: true,
      signOut: vi.fn(),
    });

    mockUseVocabularyScoresState({
      data: [],
      isLoading: false,
      error: null,
    });

    mockUseDueTodayState({
      data: [],
      isLoading: false,
      error: null,
    });
  });

  it("renders loading state", () => {
    mockUseVocabularyScoresState({
      data: [],
      isLoading: true,
      error: null,
    });

    render(<HomePage />, { wrapper: createWrapper() });

    expect(screen.getByTestId("home-loading")).toBeInTheDocument();
  });

  it("renders error state", () => {
    mockUseVocabularyScoresState({
      data: [],
      isLoading: false,
      error: new Error("failed"),
    });

    render(<HomePage />, { wrapper: createWrapper() });

    expect(screen.getByTestId("home-error")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(<HomePage />, { wrapper: createWrapper() });

    expect(screen.getByTestId("home-empty")).toBeInTheDocument();
  });

  it("renders dashboard stats and quick actions", () => {
    mockUseVocabularyScoresState({
      data: [
        {
          user_id: "user-1",
          vocabulary_id: "vocab-1",
          score: 75,
          last_exercise_at: "2026-03-05T10:00:00.000Z",
          practised_dates_count: 1,
          learnt: true,
          created_at: "2026-03-05T10:00:00.000Z",
          updated_at: "2026-03-05T10:00:00.000Z",
          vocabulary: {
            id: "vocab-1",
            word: "hello",
            translation: "привет",
            language_from: "en",
            language_to: "ru",
            source: "app",
            created_by: null,
            created_at: "2026-03-05T10:00:00.000Z",
          },
        },
      ],
      isLoading: false,
      error: null,
    });

    mockUseDueTodayState({
      data: [
        {
          id: "due-1",
        },
        {
          id: "due-2",
        },
      ],
      isLoading: false,
      error: null,
    });

    render(<HomePage />, { wrapper: createWrapper() });

    expect(screen.getByText("Due today")).toBeInTheDocument();
    expect(screen.getByText("Tracked words")).toBeInTheDocument();
    expect(screen.queryByTestId("home-empty")).not.toBeInTheDocument();

    expect(screen.getByTestId("home-quick-action-study")).toBeInTheDocument();
    expect(
      screen.getByTestId("home-quick-action-dictionary"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("home-quick-action-progress"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("home-quick-action-library"),
    ).toBeInTheDocument();
  });

  it("renders sign-in info when user is not present", () => {
    mockUseAuthState({
      user: null,
      session: null,
      loading: false,
      isAuthenticated: false,
      signOut: vi.fn(),
    });

    render(<HomePage />, { wrapper: createWrapper() });

    expect(
      screen.getByText(/sign in to view your dashboard/i),
    ).toBeInTheDocument();
  });
});
