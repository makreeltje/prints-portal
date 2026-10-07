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

/**
 * The theme actually shown: "system" resolved against the browser setting.
 * Components that cannot read CSS (an embedded renderer) need this.
 */
export function useResolvedTheme(): 'light' | 'dark' {
  const { theme } = useTheme();
  const query = '(prefers-color-scheme: dark)';
  const [systemDark, setSystemDark] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => {
      setSystemDark(event.matches);
    };
    media.addEventListener('change', onChange);
    return () => {
      media.removeEventListener('change', onChange);
    };
  }, []);

  if (theme === 'system') return systemDark ? 'dark' : 'light';
  return theme;
}
