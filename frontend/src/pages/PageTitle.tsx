import { t, type MessageKey } from '../i18n/nl';
import { useDocumentTitle } from './useDocumentTitle';

/** Page header (`pp-ph`) with the page's single h1; also sets the document title. */
export function PageTitle({ title }: { title: MessageKey }) {
  useDocumentTitle(title);
  return (
    <div className="pp-ph">
      <h1>{t(title)}</h1>
    </div>
  );
}

/** Sets the document title for a page that renders its own header. */
export function DocumentTitle({ title }: { title: MessageKey }) {
  useDocumentTitle(title);
  return null;
}
