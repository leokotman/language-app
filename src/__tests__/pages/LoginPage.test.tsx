import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "@/pages/LoginPage/LoginPage";

vi.mock("@/lib/supabase", () => ({
  supabase: { auth: { signInWithPassword: vi.fn() } },
}));
vi.mock("@/stores/authStore", () => ({
  useAuthStore: {
    getState: () => ({ setAuth: vi.fn() }),
  },
}));

describe("LoginPage", () => {
  it("renders login form with email and password fields", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /email/i })).toBeInTheDocument();
    expect(
      document.querySelector('input[type="password"]'),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });
});
