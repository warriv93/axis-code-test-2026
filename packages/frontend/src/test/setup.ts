import "@testing-library/jest-dom/vitest";

/**
 * Node 22+ ships its own experimental `localStorage` global, which is inert
 * unless the process is started with --localstorage-file. It shadows the
 * implementation jsdom provides, so window.localStorage ends up undefined
 * under Vitest even though jsdom implements it correctly.
 *
 * The app genuinely depends on localStorage (session and theme persistence),
 * so tests get a minimal in-memory implementation rather than skipping that
 * behaviour. Delete this once Node stops shadowing the jsdom global.
 */
if (typeof window !== "undefined" && !window.localStorage) {
  const store = new Map<string, string>();

  const localStorageStub: Storage = {
    get length() {
      return store.size;
    },
    key: (index: number) => [...store.keys()][index] ?? null,
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  };

  Object.defineProperty(window, "localStorage", {
    value: localStorageStub,
    configurable: true,
  });
}
