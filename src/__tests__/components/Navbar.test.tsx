import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { ThemeModeProvider } from "@/theme/ThemeModeContext";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: "u1", email: "test@example.com" },
    signOut: vi.fn(),
  }),
}));

vi.mock("@/stores/offlineModeStore", () => ({
  useOfflineModeStore: (
    selector: (s: {
      offlineMode: boolean;
      setOfflineMode: (v: boolean) => void;
    }) => unknown,
  ) => {
    const state = { offlineMode: false, setOfflineMode: vi.fn() };
    return selector(state);
  },
}));

vi.mock("@/lib/offlineSync", () => ({
  syncForOffline: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/offlineDebug", () => ({
  offlineLog: vi.fn(),
}));

function renderNavbar() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeModeProvider>
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      </ThemeModeProvider>
    </QueryClientProvider>,
  );
}

describe("Navbar", () => {
  it("renders app title and nav links", () => {
    renderNavbar();
    expect(screen.getByText("Language App")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "My Library" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Dictionary" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Study" })).toBeInTheDocument();
  });

  it("shows user email when authenticated", () => {
    renderNavbar();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("has theme toggle and sign out button when authenticated", () => {
    renderNavbar();
    expect(
      screen.getByRole("button", { name: /switch to dark mode/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign out/i }),
    ).toBeInTheDocument();
  });

  it("toggles theme when theme button is clicked", () => {
    renderNavbar();
    const themeButton = screen.getByRole("button", {
      name: /switch to dark mode/i,
    });
    fireEvent.click(themeButton);
    expect(
      screen.getByRole("button", { name: /switch to light mode/i }),
    ).toBeInTheDocument();
  });
});
