import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/authStore";
import { logError } from "@/lib/errors";

const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (cb: (e: string, s: unknown) => void) => {
        mockOnAuthStateChange(cb);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
      signOut: () => mockSignOut(),
    },
  },
}));

vi.mock("@/lib/errors", () => ({
  logError: vi.fn(),
}));

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, session: null, loading: false });
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSignOut.mockResolvedValue(undefined);
  });

  it("returns user, session, loading, isAuthenticated and signOut", async () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current).toMatchObject({
      user: null,
      session: null,
      isAuthenticated: false,
    });
    expect(typeof result.current.signOut).toBe("function");
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("updates store when getSession resolves with session", async () => {
    const user = { id: "u1", email: "a@b.com" };
    const session = { access_token: "x", user };
    mockGetSession.mockResolvedValue({ data: { session } });
    renderHook(() => useAuth());
    await waitFor(() => {
      expect(useAuthStore.getState().session).toEqual(session);
      expect(useAuthStore.getState().user).toEqual(user);
    });
  });

  it("on getSession reject calls logError and sets auth to null", async () => {
    const err = new Error("session failed");
    mockGetSession.mockRejectedValue(err);
    renderHook(() => useAuth());
    await waitFor(() => {
      expect(logError).toHaveBeenCalledWith("useAuth.getSession", err);
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().session).toBeNull();
    });
  });

  it("signOut calls supabase.auth.signOut and clearStore", async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signOut();
    });
    expect(mockSignOut).toHaveBeenCalled();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().session).toBeNull();
  });

  it("signOut still clears store when signOut throws", async () => {
    mockSignOut.mockRejectedValue(new Error("sign out failed"));
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signOut();
    });
    expect(logError).toHaveBeenCalledWith("useAuth.signOut", expect.any(Error));
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().session).toBeNull();
  });
});
