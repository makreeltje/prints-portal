import { t } from '../i18n/nl';

/**
 * PrintNote: the short internal note on a print (GAP-152).
 *
 * Never a status, badge, colour, sort or filter — it is the operator's own
 * prose and the system makes no claim about it. A note does not mean "this
 * must be designed"; it may say "wacht op maten van Eva" or "in zwart
 * printen". 2.10 refused exactly that inference for "no files" (GAP-143).
 *
 * It says beside itself, every time, that a klant never sees it.
 */
export function NoteBlock({ note }: { note: string }) {
  return (
    <div className="pp-note">
      <span className="l">{t('print.note')}</span>
      <p>{note}</p>
      <span className="pp-help">{t('print.note.internal')}</span>
    </div>
  );
}
