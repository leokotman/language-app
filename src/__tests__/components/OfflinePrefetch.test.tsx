import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { OfflinePrefetch } from "@/components/features/offline/OfflinePrefetch";

vi.mock("@/stores/authStore", () => ({
  useAuthStore: (selector: (s: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: "user-1" } }),
}));

vi.mock("@/lib/offlineSync", () => ({
  syncForOffline: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/offlineDebug", () => ({
  offlineLog: vi.fn(),
}));

describe("OfflinePrefetch", () => {
  it("renders nothing", () => {
    const { container } = render(<OfflinePrefetch />);
    expect(container.firstChild).toBeNull();
  });

  it("calls syncForOffline when user is logged in and online", async () => {
    const { syncForOffline } = await import("@/lib/offlineSync");
    Object.defineProperty(globalThis, "navigator", {
      value: { onLine: true },
      writable: true,
    });
    render(<OfflinePrefetch />);
    await vi.waitFor(() => {
      expect(syncForOffline).toHaveBeenCalledWith("user-1");
    });
  });
});
