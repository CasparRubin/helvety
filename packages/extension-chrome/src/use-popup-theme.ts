import { useCallback, useEffect, useState } from "react";

import {
  applyThemeClassToDocument,
  defaultThemeFromSystem,
  parseThemePreference,
  resolveIsDark,
  type ThemePreference,
} from "./theme-preference";

/** Loads and persists popup light/dark preference in `chrome.storage.local`. */
export function usePopupTheme(storageKey: string): {
  themePreference: ThemePreference;
  themeLoaded: boolean;
  saveTheme: (next: ThemePreference) => void;
} {
  const [themePreference, setThemePreference] = useState<ThemePreference>(() =>
    defaultThemeFromSystem()
  );
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void chrome.storage.local
      .get(storageKey)
      .then((localResult) => {
        if (cancelled) {
          return;
        }
        const raw = localResult[storageKey];
        const theme = parseThemePreference(raw);
        setThemePreference(theme);
        applyThemeClassToDocument(resolveIsDark(theme));
        if (raw !== theme) {
          void chrome.storage.local.set({ [storageKey]: theme });
        }
        setThemeLoaded(true);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        const theme = parseThemePreference(undefined);
        setThemePreference(theme);
        applyThemeClassToDocument(resolveIsDark(theme));
        setThemeLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  useEffect(() => {
    applyThemeClassToDocument(resolveIsDark(themePreference));
  }, [themePreference]);

  const saveTheme = useCallback(
    (next: ThemePreference) => {
      setThemePreference(next);
      void chrome.storage.local.set({ [storageKey]: next });
    },
    [storageKey]
  );

  return { themePreference, themeLoaded, saveTheme };
}
