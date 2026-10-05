/**
 * Theme preference per browser. "system" removes `data-theme`, so tokens.css
 * follows prefers-color-scheme (design system: tokens.css is authoritative).
 */
export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_ORDER: readonly ThemePreference[] = ['system', 'light', 'dark'];

const STORAGE_KEY = 'prints-portal.theme';

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function nextTheme(current: ThemePreference): ThemePreference {
  const index = THEME_ORDER.indexOf(current);
  return THEME_ORDER[(index + 1) % THEME_ORDER.length] ?? 'system';
}

/** Storage can be missing or throw (private mode, blocked site data); fall back to "system". */
export function readStoredTheme(
  storage: Storage | undefined = safeLocalStorage(),
): ThemePreference {
  try {
    const value = storage?.getItem(STORAGE_KEY);
    return isThemePreference(value) ? value : 'system';
  } catch {
    return 'system';
  }
}

export function storeTheme(
  theme: ThemePreference,
  storage: Storage | undefined = safeLocalStorage(),
): void {
  try {
    if (theme === 'system') storage?.removeItem(STORAGE_KEY);
    else storage?.setItem(STORAGE_KEY, theme);
  } catch {
    // The preference simply is not remembered.
  }
}

export function applyTheme(
  theme: ThemePreference,
  root: HTMLElement = document.documentElement,
): void {
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

function safeLocalStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
