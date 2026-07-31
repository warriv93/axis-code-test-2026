const STORAGE_KEY = "axis.auth.token";

/**
 * The session's single source of truth, wrapped so nothing else touches
 * localStorage directly. Access is guarded because a browser in private mode
 * can throw on read/write, and losing a session is better than a blank page.
 */
export const tokenStorage = {
  read(): string | null {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  },

  write(token: string): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, token);
    } catch {
      /* session simply will not survive a reload */
    }
  },

  clear(): void {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing to do */
    }
  },
};
