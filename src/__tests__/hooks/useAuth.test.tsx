import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { User, Session } from "@supabase/supabase-js";
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

  it("updates store when onAuthStateChange callback is invoked with session", async () => {
    let authStateCallback: ((_e: string, s: Session | null) => void) | null =
      null;
    mockOnAuthStateChange.mockImplementation(
      (cb: (e: string, s: unknown) => void) => {
        authStateCallback = cb as (e: string, s: Session | null) => void;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    );
    mockGetSession.mockResolvedValue({ data: { session: null } });
    renderHook(() => useAuth());
    await waitFor(() => {
      expect(authStateCallback).not.toBeNull();
    });
    const user = { id: "u2", email: "b@c.com" };
    const session = { access_token: "y", user } as Session;
    act(() => {
      authStateCallback!("SIGNED_IN", session);
    });
    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().session).toEqual(session);
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

  it("does not set loading when store already has session on init", async () => {
    const session = {
      access_token: "x",
      user: { id: "u1", email: "a@b.com" },
    } as Session;
    useAuthStore.setState({
      user: session.user as User,
      session,
      loading: false,
    });
    mockGetSession.mockResolvedValue({ data: { session } });
    renderHook(() => useAuth());
    await waitFor(() => {
      expect(useAuthStore.getState().session).toEqual(session);
    });
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it("does not call setAuth when getSession rejects after unmount", async () => {
    let rejectGetSession: (err: Error) => void;
    const getSessionPromise = new Promise<never>((_, rej) => {
      rejectGetSession = rej;
    });
    mockGetSession.mockReturnValue(getSessionPromise);
    const session = {
      access_token: "x",
      user: { id: "u1", email: "a@b.com" },
    } as Session;
    useAuthStore.setState({
      user: session.user as User,
      session,
      loading: false,
    });

    const { unmount } = renderHook(() => useAuth());
    unmount();

    await act(async () => {
      rejectGetSession!(new Error("session failed"));
    });

    expect(logError).toHaveBeenCalledWith(
      "useAuth.getSession",
      expect.any(Error),
    );
    expect(useAuthStore.getState().session).toEqual(session);
    expect(useAuthStore.getState().user).toEqual(session.user);
  });
});
