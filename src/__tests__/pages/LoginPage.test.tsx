import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "@/pages/LoginPage/LoginPage";

const mockSignIn = vi.fn();
const mockSetAuth = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { signInWithPassword: (...args: unknown[]) => mockSignIn(...args) },
  },
}));
vi.mock("@/stores/authStore", () => ({
  useAuthStore: {
    getState: () => ({ setAuth: mockSetAuth }),
  },
}));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});
const mockIsNetworkError = vi.fn().mockReturnValue(false);
vi.mock("@/lib/errors", () => ({
  getAuthErrorMessage: (err: { message?: string }) =>
    err?.message ?? "Auth error",
  isNetworkError: (err: unknown) => mockIsNetworkError(err),
  logError: vi.fn(),
  OFFLINE_AUTH_MESSAGE: "You are offline. Please connect and try again.",
}));
vi.mock("@/lib/sanitize", () => ({
  sanitizeEmail: (e: string) => e.trim().toLowerCase(),
  sanitizePassword: (p: string) => p.trim(),
  clampAndStripControlChars: (s: string) => s,
  MAX_EMAIL_LENGTH: 255,
  MAX_PASSWORD_LENGTH: 72,
}));

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignIn.mockResolvedValue({
      data: { session: { user: { id: "u1" }, access_token: "t" } },
      error: null,
    });
    Object.defineProperty(globalThis, "navigator", {
      value: { onLine: true },
      writable: true,
    });
  });

  it("renders login form with email and password fields", () => {
    renderLoginPage();
    expect(
      screen.getByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /email/i })).toBeInTheDocument();
    expect(
      document.querySelector('input[type="password"]'),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Forgot password?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /don't have an account/i }),
    ).toBeInTheDocument();
  });

  it("calls signIn and navigates on success", async () => {
    renderLoginPage();
    fireEvent.change(screen.getByRole("textbox", { name: /email/i }), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(document.querySelector('input[type="password"]')!, {
      target: { value: "password1" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password1",
      });
    });
    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });

  it("shows error when sign in fails", async () => {
    mockSignIn.mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid login credentials" },
    });
    renderLoginPage();
    fireEvent.change(screen.getByRole("textbox", { name: /email/i }), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(document.querySelector('input[type="password"]')!, {
      target: { value: "wrong" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Sign in" }));
    expect(
      await screen.findByText("Invalid login credentials"),
    ).toBeInTheDocument();
  });

  it("shows offline message when signIn fails with network error", async () => {
    mockSignIn.mockRejectedValue(new Error("Failed to fetch"));
    mockIsNetworkError.mockReturnValue(true);
    renderLoginPage();
    fireEvent.change(screen.getByRole("textbox", { name: /email/i }), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(document.querySelector('input[type="password"]')!, {
      target: { value: "password1" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Sign in" }));
    expect(
      await screen.findByText("You are offline. Please connect and try again."),
    ).toBeInTheDocument();
  });

  it("shows generic error when signIn fails and not network error", async () => {
    mockSignIn.mockRejectedValue(new Error("Server error"));
    mockIsNetworkError.mockReturnValue(false);
    renderLoginPage();
    fireEvent.change(screen.getByRole("textbox", { name: /email/i }), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(document.querySelector('input[type="password"]')!, {
      target: { value: "password1" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Sign in" }));
    expect(
      await screen.findByText("Something went wrong. Please try again."),
    ).toBeInTheDocument();
  });

  it("dismisses error when alert onClose is clicked", async () => {
    mockSignIn.mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid credentials" },
    });
    renderLoginPage();
    fireEvent.change(screen.getByRole("textbox", { name: /email/i }), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(document.querySelector('input[type="password"]')!, {
      target: { value: "wrong" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Sign in" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Invalid credentials");
    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);
    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
