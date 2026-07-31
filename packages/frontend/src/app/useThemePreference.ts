import { useCallback, useState } from "react";
import {
  webDarkTheme,
  webLightTheme,
  type Theme,
} from "@fluentui/react-components";

const STORAGE_KEY = "axis.theme";

export type ThemeMode = "light" | "dark";

function readStored(): ThemeMode {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

/** Theme choice, persisted so a reload does not flip the operator back. */
export function useThemePreference(): {
  mode: ThemeMode;
  theme: Theme;
  toggle: () => void;
} {
  const [mode, setMode] = useState<ThemeMode>(readStored);

  const toggle = useCallback(() => {
    setMode((current) => {
      const next: ThemeMode = current === "light" ? "dark" : "light";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* preference simply will not persist */
      }
      return next;
    });
  }, []);

  return {
    mode,
    theme: mode === "dark" ? webDarkTheme : webLightTheme,
    toggle,
  };
}
