import { useEffect } from 'react';
import { t, type MessageKey } from '../i18n/nl';

/** Page header (`pp-ph`) with the page's single h1; also sets the document title. */
export function PageTitle({ title }: { title: MessageKey }) {
  const text = t(title);

  useEffect(() => {
    document.title = `${text} · ${t('app.name')}`;
  }, [text]);

  return (
    <div className="pp-ph">
      <h1>{text}</h1>
    </div>
  );
}
