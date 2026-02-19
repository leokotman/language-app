import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage/ForgotPasswordPage";

const mockResetPasswordForEmail = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: (...args: unknown[]) =>
        mockResetPasswordForEmail(...args),
    },
  },
}));
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
  clampAndStripControlChars: (s: string) => s,
  MAX_EMAIL_LENGTH: 255,
}));

function renderForgotPasswordPage() {
  return render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>,
  );
}

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    Object.defineProperty(globalThis, "navigator", {
      value: { onLine: true },
      writable: true,
    });
    Object.defineProperty(globalThis, "window", {
      value: { location: { origin: "http://localhost" } },
      writable: true,
    });
  });

  it("renders forgot password form with email field and submit button", () => {
    renderForgotPasswordPage();
    expect(
      screen.getByRole("heading", { name: "Forgot password" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /email/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send reset link" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to sign in" }),
    ).toBeInTheDocument();
  });

  it("shows success message after successful submit", async () => {
    renderForgotPasswordPage();
    fireEvent.change(screen.getByRole("textbox", { name: /email/i }), {
      target: { value: "user@example.com" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Send reset link" }));
    expect(
      await screen.findByRole("heading", { name: "Check your email" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/We sent a password reset link to/i),
    ).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith("user@example.com", {
      redirectTo: "http://localhost/settings",
    });
  });

  it("shows error when reset fails", async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: "Invalid email" },
    });
    renderForgotPasswordPage();
    fireEvent.change(screen.getByRole("textbox", { name: /email/i }), {
      target: { value: "bad@example.com" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByText("Invalid email")).toBeInTheDocument();
  });

  it("shows offline message when reset fails with network error", async () => {
    mockResetPasswordForEmail.mockRejectedValue(new Error("Failed to fetch"));
    mockIsNetworkError.mockReturnValue(true);
    renderForgotPasswordPage();
    fireEvent.change(screen.getByRole("textbox", { name: /email/i }), {
      target: { value: "user@example.com" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Send reset link" }));
    expect(
      await screen.findByText("You are offline. Please connect and try again."),
    ).toBeInTheDocument();
  });

  it("shows generic error when reset fails and not network error", async () => {
    mockResetPasswordForEmail.mockRejectedValue(new Error("Server error"));
    mockIsNetworkError.mockReturnValue(false);
    renderForgotPasswordPage();
    fireEvent.change(screen.getByRole("textbox", { name: /email/i }), {
      target: { value: "user@example.com" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Send reset link" }));
    expect(
      await screen.findByText("Something went wrong. Please try again."),
    ).toBeInTheDocument();
  });
});
