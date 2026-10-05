import { describe, expect, it } from 'vitest';
import { applyTheme, nextTheme, readStoredTheme, storeTheme } from './theme';

function throwingStorage(): Storage {
  const fail = (): never => {
    throw new Error('blocked');
  };
  return {
    length: 0,
    clear: fail,
    getItem: fail,
    key: fail,
    removeItem: fail,
    setItem: fail,
  };
}

describe('theme preference', () => {
  it('cycles Systeem → Licht → Donker → Systeem', () => {
    expect(nextTheme('system')).toBe('light');
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('system');
  });

  it('remembers light and dark, and forgets system', () => {
    storeTheme('dark', window.localStorage);
    expect(readStoredTheme(window.localStorage)).toBe('dark');
    storeTheme('system', window.localStorage);
    expect(window.localStorage.length).toBe(0);
    expect(readStoredTheme(window.localStorage)).toBe('system');
  });

  it('ignores unknown stored values', () => {
    window.localStorage.setItem('prints-portal.theme', 'purple');
    expect(readStoredTheme(window.localStorage)).toBe('system');
  });

  it('survives storage that throws', () => {
    expect(readStoredTheme(throwingStorage())).toBe('system');
    expect(() => {
      storeTheme('dark', throwingStorage());
    }).not.toThrow();
  });

  it('sets data-theme for light and dark and removes it for system', () => {
    const root = document.documentElement;
    applyTheme('light', root);
    expect(root.dataset.theme).toBe('light');
    applyTheme('dark', root);
    expect(root.dataset.theme).toBe('dark');
    applyTheme('system', root);
    expect(root.hasAttribute('data-theme')).toBe(false);
  });
});
