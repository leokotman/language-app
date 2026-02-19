import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/errors", () => ({ logError: vi.fn() }));

import { useOfflineModeStore } from "@/stores/offlineModeStore";

const STORAGE_KEY = "language-app-offline-mode";

describe("offlineModeStore", () => {
  const originalLocalStorage = globalThis.localStorage;

  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
    useOfflineModeStore.setState({ offlineMode: false });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: originalLocalStorage,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  it("setOfflineMode persists to localStorage and updates state", () => {
    const setItem = vi.fn();
    Object.defineProperty(globalThis, "localStorage", {
      value: { getItem: vi.fn(), setItem, removeItem: vi.fn() },
      writable: true,
    });
    useOfflineModeStore.getState().setOfflineMode(true);
    expect(useOfflineModeStore.getState().offlineMode).toBe(true);
    expect(setItem).toHaveBeenCalledWith(STORAGE_KEY, "true");
  });

  it("setOfflineMode still updates state when localStorage.setItem throws", () => {
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: vi.fn(),
        setItem: () => {
          throw new Error("QuotaExceededError");
        },
        removeItem: vi.fn(),
      },
      writable: true,
    });
    useOfflineModeStore.getState().setOfflineMode(true);
    expect(useOfflineModeStore.getState().offlineMode).toBe(true);
  });
});
