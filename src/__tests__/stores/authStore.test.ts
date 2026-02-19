import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/stores/authStore";

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, session: null, loading: false });
  });

  it("starts with null user and session after reset", () => {
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().session).toBeNull();
  });

  it("setAuth updates user and session and sets loading false", () => {
    const user = { id: "1", email: "a@b.com" } as unknown as ReturnType<
      typeof useAuthStore.getState
    >["user"];
    const session = { access_token: "x" } as unknown as ReturnType<
      typeof useAuthStore.getState
    >["session"];
    useAuthStore.getState().setAuth(user, session);
    expect(useAuthStore.getState().user).toBe(user);
    expect(useAuthStore.getState().session).toBe(session);
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it("signOut clears user and session", () => {
    const user = { id: "1" } as unknown as ReturnType<
      typeof useAuthStore.getState
    >["user"];
    useAuthStore
      .getState()
      .setAuth(user, {} as ReturnType<typeof useAuthStore.getState>["session"]);
    useAuthStore.getState().signOut();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().session).toBeNull();
  });

  it("setLoading updates loading state", () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().loading).toBe(true);
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().loading).toBe(false);
  });
});
