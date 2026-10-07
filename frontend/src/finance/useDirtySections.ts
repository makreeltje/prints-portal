import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Which sections of Instellingen hold edits that are not saved yet
 * (ScreenSettings 1.9, GAP-083). Sections register themselves, so the page can
 * name them when you try to leave, and the browser can ask on its own prompt.
 */
export function useDirtySections() {
  const [dirty, setDirty] = useState<ReadonlyMap<string, string>>(new Map());

  const report = useCallback((key: string, title: string, isDirty: boolean) => {
    setDirty((current) => {
      const has = current.has(key);
      if (has === isDirty) return current;
      const next = new Map(current);
      if (isDirty) next.set(key, title);
      else next.delete(key);
      return next;
    });
  }, []);

  const titles = useMemo(() => [...dirty.values()], [dirty]);

  // Closing the tab is the browser's own prompt; its text is not ours to set.
  useEffect(() => {
    if (titles.length === 0) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [titles.length]);

  return { titles, report };
}

/** "Standaardprijzen en Printers", as the leave dialog names them. */
export function joinSections(titles: readonly string[]): string {
  if (titles.length <= 1) return titles[0] ?? '';
  return `${titles.slice(0, -1).join(', ')} en ${titles[titles.length - 1] ?? ''}`;
}
