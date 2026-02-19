import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/features/auth/ProtectedRoute";

vi.mock("@/hooks/useAuth", () => ({ useAuth: vi.fn() }));

const mockUseAuth = (overrides: {
  isAuthenticated: boolean;
  loading: boolean;
}) =>
  vi.mocked(useAuth).mockReturnValue({
    user: overrides.isAuthenticated ? ({} as never) : null,
    session: overrides.isAuthenticated ? ({} as never) : null,
    loading: overrides.loading,
    isAuthenticated: overrides.isAuthenticated,
    signOut: vi.fn().mockResolvedValue(undefined),
  });

function renderProtected(initialEntry = "/dashboard") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>Protected content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("shows loading spinner when loading", () => {
    mockUseAuth({ isAuthenticated: false, loading: true });
    renderProtected();
    expect(
      document.querySelector(".MuiCircularProgress-root"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("redirects to /login when not authenticated", () => {
    mockUseAuth({ isAuthenticated: false, loading: false });
    renderProtected();
    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    mockUseAuth({ isAuthenticated: true, loading: false });
    renderProtected();
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});
