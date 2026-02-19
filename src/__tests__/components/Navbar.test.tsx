import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { ThemeModeProvider } from "@/theme/ThemeModeContext";
import { useAuth } from "@/hooks/useAuth";
import * as offlineSync from "@/lib/offlineSync";

const mockSignOut = vi.fn();
const mockNavigate = vi.fn();
vi.mock("@/hooks/useAuth");
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

const mockUser = {
  id: "u1",
  email: "test@example.com",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "",
} as const;

describe("Navbar", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      session: { access_token: "x", user: mockUser } as ReturnType<
        typeof useAuth
      >["session"],
      loading: false,
      isAuthenticated: true,
      signOut: mockSignOut as ReturnType<typeof useAuth>["signOut"],
    });
    mockNavigate.mockClear();
    mockSignOut.mockClear();
  });

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

  it("shows Log in and Sign up when not authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      isAuthenticated: false,
      signOut: mockSignOut as ReturnType<typeof useAuth>["signOut"],
    });
    renderNavbar();
    expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign up/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sign out/i })).toBeNull();
  });

  it("calls signOut and navigates to /login when sign out is clicked", () => {
    renderNavbar();
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
  });

  it("shows success snackbar when offline toggle ON and sync succeeds", async () => {
    vi.mocked(offlineSync.syncForOffline).mockResolvedValue({ success: true });
    Object.defineProperty(globalThis, "navigator", {
      value: { onLine: true },
      writable: true,
    });
    renderNavbar();
    const offlineSwitch = screen.getByRole("switch");
    await act(async () => {
      fireEvent.click(offlineSwitch);
    });
    expect(await screen.findByText(/ready for offline/i)).toBeInTheDocument();
  });

  it("shows failure snackbar when offline toggle ON and sync fails", async () => {
    vi.mocked(offlineSync.syncForOffline).mockResolvedValue({ success: false });
    Object.defineProperty(globalThis, "navigator", {
      value: { onLine: true },
      writable: true,
    });
    renderNavbar();
    const offlineSwitch = screen.getByRole("switch");
    await act(async () => {
      fireEvent.click(offlineSwitch);
    });
    expect(await screen.findByText(/sync failed/i)).toBeInTheDocument();
  });
});
