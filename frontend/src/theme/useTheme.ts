import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  applyTheme,
  isThemePreference,
  nextTheme,
  readStoredTheme,
  storeTheme,
  type ThemePreference,
} from './theme';

export interface ThemeControls {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  cycleTheme: () => void;
}

/** Tells every useTheme on the page (the shell's button, Instellingen) about a change. */
const THEME_EVENT = 'pp-theme-change';

function announce(theme: ThemePreference): void {
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
}

export function useTheme(): ThemeControls {
  const [theme, setThemeState] = useState<ThemePreference>(() => readStoredTheme());

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onChange = (event: Event) => {
      const value = (event as CustomEvent<unknown>).detail;
      if (isThemePreference(value)) setThemeState(value);
    };
    window.addEventListener(THEME_EVENT, onChange);
    return () => {
      window.removeEventListener(THEME_EVENT, onChange);
    };
  }, []);

  const setTheme = useCallback((value: ThemePreference) => {
    storeTheme(value);
    setThemeState(value);
    announce(value);
  }, []);

  const cycleTheme = useCallback(() => {
    const value = nextTheme(readStoredTheme());
    storeTheme(value);
    setThemeState(value);
    announce(value);
  }, []);

  return { theme, setTheme, cycleTheme };
}
