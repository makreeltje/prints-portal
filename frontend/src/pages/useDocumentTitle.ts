import { useEffect } from 'react';
import { t, type MessageKey } from '../i18n/nl';

/** Sets the browser tab title for a page. */
export function useDocumentTitle(title: MessageKey): void {
  const text = t(title);
  useEffect(() => {
    document.title = `${text} · ${t('app.name')}`;
  }, [text]);
}
