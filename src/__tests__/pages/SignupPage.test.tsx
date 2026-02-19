import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SignupPage } from "@/pages/SignupPage/SignupPage";

const mockSignUp = vi.fn();
const mockUpsertProfile = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => mockSignUp(...args),
    },
  },
}));
vi.mock("@/api/profiles", () => ({
  upsertProfile: (...args: unknown[]) => mockUpsertProfile(...args),
}));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});
vi.mock("@/lib/errors", () => ({
  getAuthErrorMessage: (err: { message?: string }) =>
    err?.message ?? "Auth error",
  isNetworkError: () => false,
  logError: vi.fn(),
  OFFLINE_AUTH_MESSAGE: "You are offline. Please connect and try again.",
}));
vi.mock("@/lib/sanitize", () => ({
  sanitizeEmail: (e: string) => e.trim().toLowerCase(),
  sanitizePassword: (p: string) => p.trim(),
  clampAndStripControlChars: (s: string) => s,
  MIN_PASSWORD_LENGTH: 6,
  MAX_EMAIL_LENGTH: 255,
  MAX_PASSWORD_LENGTH: 72,
}));

function renderSignupPage() {
  return render(
    <MemoryRouter>
      <SignupPage />
    </MemoryRouter>,
  );
}

describe("SignupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignUp.mockResolvedValue({ data: { user: null }, error: null });
    mockUpsertProfile.mockResolvedValue(undefined);
    Object.defineProperty(globalThis, "navigator", {
      value: { onLine: true },
      writable: true,
    });
  });

  it("renders sign up form with email, password and confirm password", () => {
    renderSignupPage();
    expect(
      screen.getByRole("heading", { name: "Sign up" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /email/i })).toBeInTheDocument();
    const passwordFields = document.querySelectorAll('input[type="password"]');
    expect(passwordFields).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Sign up" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /already have an account/i }),
    ).toBeInTheDocument();
  });

  it("shows error when passwords do not match", async () => {
    renderSignupPage();
    fireEvent.change(screen.getByRole("textbox", { name: /email/i }), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: "password1" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password2" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Sign up" }));
    expect(
      await screen.findByText("Passwords do not match."),
    ).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("shows error when password is too short", async () => {
    renderSignupPage();
    fireEvent.change(screen.getByRole("textbox", { name: /email/i }), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: "12345" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "12345" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Sign up" }));
    expect(
      await screen.findByText("Password must be at least 6 characters."),
    ).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("shows offline message when navigator is offline", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: { onLine: false },
      writable: true,
    });
    renderSignupPage();
    fireEvent.change(screen.getByRole("textbox", { name: /email/i }), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: "password1" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password1" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Sign up" }));
    expect(
      await screen.findByText("You are offline. Please connect and try again."),
    ).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("calls signUp and navigates on success", async () => {
    mockSignUp.mockResolvedValue({
      data: {
        user: { id: "u1", email: "test@example.com" },
      },
      error: null,
    });
    renderSignupPage();
    fireEvent.change(screen.getByRole("textbox", { name: /email/i }), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: "password1" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password1" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Sign up" }));
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password1",
      });
    });
    await waitFor(() => {
      expect(mockUpsertProfile).toHaveBeenCalledWith({
        id: "u1",
        email: "test@example.com",
      });
    });
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });
});
