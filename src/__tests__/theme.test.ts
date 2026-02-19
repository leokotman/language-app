import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/errors", () => ({ logError: vi.fn() }));

import {
  theme,
  getTheme,
  getStoredThemeMode,
  setStoredThemeMode,
} from "@/theme/theme";

describe("theme", () => {
  it("has primary color", () => {
    expect(theme.palette.primary.main).toBe("#1976d2");
  });

  it("has typography font family", () => {
    expect(theme.typography.fontFamily).toContain("Roboto");
  });

  it("getTheme(dark) returns dark palette", () => {
    const dark = getTheme("dark");
    expect(dark.palette.mode).toBe("dark");
    expect(dark.palette.background.default).toBe("#121212");
  });
});

describe("getStoredThemeMode", () => {
  const getItem = vi.fn();
  const originalLocalStorage = globalThis.localStorage;

  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: { getItem, setItem: vi.fn() },
      writable: true,
    });
  });
  afterEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: originalLocalStorage,
      writable: true,
    });
  });

  it('returns stored "dark" or "light"', () => {
    getItem.mockReturnValue("dark");
    expect(getStoredThemeMode()).toBe("dark");
    getItem.mockReturnValue("light");
    expect(getStoredThemeMode()).toBe("light");
  });

  it('returns "light" when stored value is invalid or missing', () => {
    getItem.mockReturnValue(null);
    expect(getStoredThemeMode()).toBe("light");
    getItem.mockReturnValue("invalid");
    expect(getStoredThemeMode()).toBe("light");
  });

  it('returns "light" and does not throw when getItem throws', () => {
    getItem.mockImplementation(() => {
      throw new Error("QuotaExceeded");
    });
    expect(getStoredThemeMode()).toBe("light");
  });
});

describe("setStoredThemeMode", () => {
  const originalLocalStorage = globalThis.localStorage;
  afterEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: originalLocalStorage,
      writable: true,
    });
  });

  it("calls localStorage.setItem with mode", () => {
    const setItem = vi.fn();
    Object.defineProperty(globalThis, "localStorage", {
      value: { getItem: vi.fn(), setItem },
      writable: true,
    });
    setStoredThemeMode("dark");
    expect(setItem).toHaveBeenCalledWith("themeMode", "dark");
  });

  it("does not throw when setItem throws (e.g. quota)", () => {
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: vi.fn(),
        setItem: () => {
          throw new Error("QuotaExceeded");
        },
      },
      writable: true,
    });
    expect(() => setStoredThemeMode("dark")).not.toThrow();
  });
});
