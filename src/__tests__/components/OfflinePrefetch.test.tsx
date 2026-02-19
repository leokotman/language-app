import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { OfflinePrefetch } from "@/components/features/offline/OfflinePrefetch";

const mockSyncForOffline = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/offlineSync", () => ({
  syncForOffline: (...args: unknown[]) => mockSyncForOffline(...args),
}));

vi.mock("@/lib/offlineDebug", () => ({
  offlineLog: vi.fn(),
}));

let mockAuthState: { user: { id: string } | null } = { user: { id: "user-1" } };
vi.mock("@/stores/authStore", () => ({
  useAuthStore: (selector: (s: { user: { id: string } | null }) => unknown) =>
    selector(mockAuthState),
}));

describe("OfflinePrefetch", () => {
  const originalNavigator = globalThis.navigator;

  afterEach(() => {
    vi.clearAllMocks();
    mockAuthState = { user: { id: "user-1" } };
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      writable: true,
    });
  });

  it("renders nothing", () => {
    const { container } = render(<OfflinePrefetch />);
    expect(container.firstChild).toBeNull();
  });

  it("calls syncForOffline when user is logged in and online", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: { onLine: true },
      writable: true,
    });
    render(<OfflinePrefetch />);
    await vi.waitFor(() => {
      expect(mockSyncForOffline).toHaveBeenCalledWith("user-1");
    });
  });

  it("does not call syncForOffline when user is null", async () => {
    mockAuthState = { user: null };
    Object.defineProperty(globalThis, "navigator", {
      value: { onLine: true },
      writable: true,
    });
    render(<OfflinePrefetch />);
    await vi.waitFor(() => {
      expect(mockSyncForOffline).not.toHaveBeenCalled();
    });
  });

  it("does not call syncForOffline when navigator.onLine is false", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: { onLine: false },
      writable: true,
    });
    render(<OfflinePrefetch />);
    expect(mockSyncForOffline).not.toHaveBeenCalled();
  });

  it("calls syncForOffline only once when re-rendered with same userId", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: { onLine: true },
      writable: true,
    });
    const { rerender } = render(<OfflinePrefetch />);
    await vi.waitFor(() => {
      expect(mockSyncForOffline).toHaveBeenCalledWith("user-1");
    });
    const callCount = mockSyncForOffline.mock.calls.length;
    rerender(<OfflinePrefetch />);
    await vi.waitFor(() => {
      expect(mockSyncForOffline.mock.calls.length).toBe(callCount);
    });
  });
});
