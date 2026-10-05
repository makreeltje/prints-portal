import { useCallback, useLayoutEffect, useState } from 'react';
import { applyTheme, nextTheme, readStoredTheme, storeTheme, type ThemePreference } from './theme';

export interface ThemeControls {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  cycleTheme: () => void;
}

export function useTheme(): ThemeControls {
  const [theme, setThemeState] = useState<ThemePreference>(() => readStoredTheme());

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((value: ThemePreference) => {
    storeTheme(value);
    setThemeState(value);
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((current) => {
      const value = nextTheme(current);
      storeTheme(value);
      return value;
    });
  }, []);

  return { theme, setTheme, cycleTheme };
}
