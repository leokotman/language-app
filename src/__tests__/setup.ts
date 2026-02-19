import "@testing-library/jest-dom";

/**
 * Ensure localStorage is usable in tests. Node 25+ can expose a native Web Storage
 * that conflicts with jsdom (e.g. getItem/setItem not a function, or --localstorage-file warning).
 * Polyfill with a simple in-memory store when needed.
 */
function installLocalStoragePolyfill(): void {
  const storage = new Map<string, string>();
  const impl = {
    getItem(key: string): string | null {
      return storage.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      storage.set(key, String(value));
    },
    removeItem(key: string): void {
      storage.delete(key);
    },
    get length(): number {
      return storage.size;
    },
    key(index: number): string | null {
      return [...storage.keys()][index] ?? null;
    },
    clear(): void {
      storage.clear();
    },
  };
  const desc = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const current = desc?.value;
  if (
    !current ||
    typeof (current as Storage).getItem !== "function" ||
    typeof (current as Storage).setItem !== "function"
  ) {
    Object.defineProperty(globalThis, "localStorage", {
      value: impl,
      writable: true,
      configurable: true,
    });
  }
}

installLocalStoragePolyfill();
