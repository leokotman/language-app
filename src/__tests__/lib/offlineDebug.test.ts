import { describe, it, expect, vi, afterEach } from "vitest";
import {
  isOfflineDebugEnabled,
  isDictionaryPerfDebugEnabled,
  offlineLog,
  dictPerfLog,
} from "@/lib/offlineDebug";

const OFFLINE_KEY = "language-app-debug-offline";
const DICT_PERF_KEY = "language-app-debug-dictionary-perf";

describe("offlineDebug", () => {
  const originalLocalStorage = globalThis.localStorage;
  const originalWindow = globalThis.window;

  afterEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: originalLocalStorage,
      writable: true,
    });
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  describe("isOfflineDebugEnabled", () => {
    it("returns false when window is undefined", () => {
      Object.defineProperty(globalThis, "window", {
        value: undefined,
        writable: true,
      });
      expect(isOfflineDebugEnabled()).toBe(false);
    });

    it("returns true when localStorage has offline debug key set to 1", () => {
      Object.defineProperty(globalThis, "localStorage", {
        value: { getItem: vi.fn().mockReturnValue("1") },
        writable: true,
      });
      expect(isOfflineDebugEnabled()).toBe(true);
    });

    it("returns false when key is not 1", () => {
      Object.defineProperty(globalThis, "localStorage", {
        value: { getItem: vi.fn().mockReturnValue(null) },
        writable: true,
      });
      expect(isOfflineDebugEnabled()).toBe(false);
    });

    it("returns false when localStorage.getItem throws", () => {
      Object.defineProperty(globalThis, "localStorage", {
        value: {
          getItem: vi.fn().mockImplementation(() => {
            throw new Error("quota");
          }),
        },
        writable: true,
      });
      expect(isOfflineDebugEnabled()).toBe(false);
    });
  });

  describe("isDictionaryPerfDebugEnabled", () => {
    it("returns true when dict-perf key is 1", () => {
      Object.defineProperty(globalThis, "localStorage", {
        value: {
          getItem: vi
            .fn()
            .mockImplementation((k: string) =>
              k === DICT_PERF_KEY ? "1" : null,
            ),
        },
        writable: true,
      });
      expect(isDictionaryPerfDebugEnabled()).toBe(true);
    });

    it("returns false when key is not 1", () => {
      Object.defineProperty(globalThis, "localStorage", {
        value: { getItem: vi.fn().mockReturnValue(null) },
        writable: true,
      });
      expect(isDictionaryPerfDebugEnabled()).toBe(false);
    });
  });

  describe("offlineLog", () => {
    it("does not log when offline debug is disabled", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      Object.defineProperty(globalThis, "localStorage", {
        value: { getItem: vi.fn().mockReturnValue(null) },
        writable: true,
      });
      offlineLog("test");
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it("logs message when enabled and no data", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      Object.defineProperty(globalThis, "localStorage", {
        value: {
          getItem: vi
            .fn()
            .mockImplementation((k: string) =>
              k === OFFLINE_KEY ? "1" : null,
            ),
        },
        writable: true,
      });
      offlineLog("test");
      expect(consoleSpy).toHaveBeenCalledWith("[offline]", "test");
    });

    it("logs message and data when enabled", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      Object.defineProperty(globalThis, "localStorage", {
        value: {
          getItem: vi
            .fn()
            .mockImplementation((k: string) =>
              k === OFFLINE_KEY ? "1" : null,
            ),
        },
        writable: true,
      });
      offlineLog("sync", { count: 1 });
      expect(consoleSpy).toHaveBeenCalledWith("[offline]", "sync", {
        count: 1,
      });
    });
  });

  describe("dictPerfLog", () => {
    it("does not log when dict-perf debug is disabled", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      Object.defineProperty(globalThis, "localStorage", {
        value: { getItem: vi.fn().mockReturnValue(null) },
        writable: true,
      });
      dictPerfLog("render");
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it("logs with timestamp and data when enabled", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      Object.defineProperty(globalThis, "localStorage", {
        value: {
          getItem: vi
            .fn()
            .mockImplementation((k: string) =>
              k === DICT_PERF_KEY ? "1" : null,
            ),
        },
        writable: true,
      });
      dictPerfLog("render", { id: "x" });
      expect(consoleSpy).toHaveBeenCalled();
      const call = consoleSpy.mock.calls[0];
      expect(call[0]).toBe("[dict-perf]");
      expect(call[2]).toBe("render");
      expect(call[3]).toEqual({ id: "x" });
    });
  });
});
