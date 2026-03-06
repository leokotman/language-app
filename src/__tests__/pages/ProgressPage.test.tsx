import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProgressPage } from "@/pages/ProgressPage/ProgressPage";

vi.mock("@/hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("@/hooks/useVocabulary", () => ({
  useVocabularyScores: vi.fn(),
  useDueToday: vi.fn(),
}));

import { useAuth } from "@/hooks/useAuth";
import { useVocabularyScores, useDueToday } from "@/hooks/useVocabulary";

const mockUser = { id: "user-1", email: "u@test.com" };
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe("ProgressPage", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      isAuthenticated: false,
      signOut: vi.fn(),
    });
    vi.mocked(useVocabularyScores).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useVocabularyScores>);
    vi.mocked(useDueToday).mockReturnValue({
      data: [],
    } as ReturnType<typeof useDueToday>);
  });

  it("renders Progress heading and sign-in message when not authenticated", () => {
    render(<ProgressPage />, { wrapper: createWrapper() });
    expect(
      screen.getByRole("heading", { name: "Progress" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Sign in to see your progress/),
    ).toBeInTheDocument();
  });

  it("renders loading state when authenticated and scores loading", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser as never,
      session: {} as never,
      isAuthenticated: true,
      signOut: vi.fn(),
    });
    vi.mocked(useVocabularyScores).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useVocabularyScores>);
    render(<ProgressPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId("progress-loading")).toBeInTheDocument();
  });

  it("renders error alert when scores fail to load", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser as never,
      session: {} as never,
      isAuthenticated: true,
      signOut: vi.fn(),
    });
    vi.mocked(useVocabularyScores).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Network error"),
    } as ReturnType<typeof useVocabularyScores>);
    render(<ProgressPage />, { wrapper: createWrapper() });
    expect(screen.getByText(/Failed to load progress/)).toBeInTheDocument();
  });

  it("renders empty state when authenticated and no progress", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser as never,
      session: {} as never,
      isAuthenticated: true,
      signOut: vi.fn(),
    });
    vi.mocked(useVocabularyScores).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useVocabularyScores>);
    render(<ProgressPage />, { wrapper: createWrapper() });
    expect(
      screen.getByText(/No progress yet. Add words to your library/),
    ).toBeInTheDocument();
  });

  it("renders due today alert when user has due cards", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser as never,
      session: {} as never,
      isAuthenticated: true,
      signOut: vi.fn(),
    });
    vi.mocked(useVocabularyScores).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useVocabularyScores>);
    vi.mocked(useDueToday).mockReturnValue({
      data: [{ id: "uv-1" }] as never,
    } as ReturnType<typeof useDueToday>);
    render(<ProgressPage />, { wrapper: createWrapper() });
    const dueAlert = screen.getByTestId("progress-due-today");
    expect(dueAlert).toBeInTheDocument();
    expect(dueAlert).toHaveTextContent(/1 card.*due today/);
  });

  it("renders pair stats when user has score data", () => {
    const scoreRows = [
      {
        user_id: "user-1",
        vocabulary_id: "v-1",
        score: 65,
        last_exercise_at: "2026-02-20T12:00:00.000Z",
        practised_dates_count: 2,
        learnt: true,
        created_at: "2026-02-20T12:00:00.000Z",
        updated_at: "2026-02-20T12:00:00.000Z",
        vocabulary: {
          id: "v-1",
          word: "hello",
          translation: "привет",
          language_from: "en",
          language_to: "ru",
          source: "app",
          created_by: null,
          created_at: "2026-01-01T00:00:00.000Z",
        },
      },
    ];
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser as never,
      session: {} as never,
      isAuthenticated: true,
      signOut: vi.fn(),
    });
    vi.mocked(useVocabularyScores).mockReturnValue({
      data: scoreRows as never,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useVocabularyScores>);
    render(<ProgressPage />, { wrapper: createWrapper() });
    expect(
      screen.getByRole("heading", { name: "Russian ↔ English" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/English → Russian/)).toBeInTheDocument();
    expect(screen.getByText(/1 words/)).toBeInTheDocument();
    expect(screen.getByText(/Avg 65/)).toBeInTheDocument();
    expect(screen.getByText(/1 learnt/)).toBeInTheDocument();
  });
});
