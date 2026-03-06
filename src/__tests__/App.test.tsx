import { describe, it, expect, vi } from "vitest";
import type { ReactElement } from "react";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeModeProvider } from "@/theme/ThemeModeContext";
import App, { AppRoutes } from "@/App";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    loading: false,
    user: { id: "user-1", email: "test@example.com" },
    session: {},
    signOut: vi.fn(),
  }),
}));

vi.mock("@/hooks/useVocabulary", () => ({
  useVocabularyScores: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
  useDueToday: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

function renderWithProviders(
  ui: ReactElement,
  options?: { initialEntries?: string[] },
) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeModeProvider>
        <MemoryRouter initialEntries={options?.initialEntries ?? ["/"]}>
          {ui}
        </MemoryRouter>
      </ThemeModeProvider>
    </QueryClientProvider>,
  );
}

describe("App", () => {
  it("renders default App with router and navbar", () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ThemeModeProvider>
          <App />
        </ThemeModeProvider>
      </QueryClientProvider>,
    );
    expect(screen.getByText("Language App")).toBeInTheDocument();
  });

  it("renders navbar with app title", () => {
    renderWithProviders(<AppRoutes />);
    expect(screen.getByText("Language App")).toBeInTheDocument();
  });

  it("renders home content on /", () => {
    renderWithProviders(<AppRoutes />, { initialEntries: ["/"] });
    expect(screen.getByRole("heading", { name: "Home" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Quick actions" }),
    ).toBeInTheDocument();

    const main = screen.getByRole("main");
    expect(within(main).getByTestId("home-quick-action-study")).toBeInTheDocument();
  });
});
