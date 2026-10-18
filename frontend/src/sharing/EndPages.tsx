import { Link as LinkIcon, LogOut } from 'lucide-react';
import { t } from '../i18n/nl';

/**
 * "Deze link is verlopen of ingetrokken": the one page every link that does
 * not work gets — unknown, malformed, expired and revoked alike, so nothing
 * about a token can be learned by probing (ScreenSharePage 1.6, untouched by
 * 2.14).
 *
 * It is also the end of a session, and then it is drawn **without the guest
 * shell**: a nav of dead links is worse than no nav. It appears at the
 * visitor's next action and never on a timer — a page already on screen was
 * true when it loaded, and the visitor cannot change anything on it.
 */
export function Gone() {
  return (
    <main className="pp-center pp-gap-2 pp-center-t">
      <div className="pp-illus pp-card pp-illus-box">
        <LinkIcon className="pp-ico pp-ico-24" aria-hidden="true" />
      </div>
      <h1 className="pp-share-h404">{t('share.notFound')}</h1>
      <p className="pp-muted pp-m0 pp-maxch">{t('share.askNew')}</p>
    </main>
  );
}

/**
 * "Sessie afsluiten" has its own page, because the two endings are not the
 * same fact (ScreenShareSession §4). No button: a way back in would need the
 * token, and the point of the act is that the session no longer has one.
 */
export function SessionEnded() {
  return (
    <main className="pp-center pp-gap-2 pp-center-t">
      <div className="pp-illus pp-card pp-illus-box">
        <LogOut className="pp-ico pp-ico-24" aria-hidden="true" />
      </div>
      <h1 className="pp-share-h404">{t('session.ended.title')}</h1>
      <p className="pp-muted pp-m0 pp-maxch">{t('session.ended.body')}</p>
    </main>
  );
}
