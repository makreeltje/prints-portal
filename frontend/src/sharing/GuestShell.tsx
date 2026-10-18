import { LayoutDashboard, List, LogOut } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { t } from '../i18n/nl';
import { shareLogoUrl } from './share-api';
import type { ShareSession } from './session';

const MAIN_ID = 'inhoud';

/**
 * AppShell's `guest` variant (AppShell 2.14, GAP-165): the same `main.pp-main`
 * and the same screens, with the operator's chrome replaced by one head bar.
 *
 * What is gone and why, in the design system's own words: no avatar and no
 * role name (there is no account), **no theme control** (a preference that
 * cannot survive the visitor's next tap on the same WhatsApp link — the page
 * follows the system setting, as the share page has since 1.0), no
 * "Uitloggen" (nothing to log out of), and no LiveIndicator or offline bar
 * (both exist so an operator knows whether what he is editing is current).
 * No sidebar, rail, drawer or bottom bar either: two destinations do not need
 * a drawer at any width.
 */
export function GuestShell({
  session,
  studio,
  hasLogo,
  onExit,
  children,
}: {
  session: ShareSession;
  /** The studio's name: the logo, else the company name, else the app's own. */
  studio: string;
  hasLogo: boolean;
  onExit: () => Promise<void>;
  children: ReactNode;
}) {
  const [confirming, setConfirming] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = hasLogo && !logoFailed;
  return (
    <>
      <a className="app-skip pp-btn pp-btn-secondary" href={`#${MAIN_ID}`}>
        {t('system.skipToContent')}
      </a>
      <div className="pp-app guest">
        <header className="pp-guesthead">
          {showLogo ? (
            <div className="pp-brand has-logo">
              <img
                className="logo pp-logo"
                src={shareLogoUrl(session.token)}
                alt={studio}
                onError={() => {
                  setLogoFailed(true);
                }}
              />
            </div>
          ) : (
            <div className="pp-brand">{studio}</div>
          )}
          {/*
            Two destinations and two refusals (ScreenShareSession §2):
            API-docs, which a klant has nothing to call, and Openstaand,
            whose one-klant version is the "Alleen openstaand" switch on the
            Overzicht. Prints keeps the dashboard's glyph on purpose: it is
            that screen.
          */}
          {/*
            A pill track since 2.15 (GAP-169, the owner's): `.pp-guestnav` draws
            the `border-strong` boundary around **both** items and the current
            one is a `primary-tint` pill inside it, because dressing only
            `aria-current` left the screen he had never seen with no ink at all.
            The look is borrowed from SegmentedControl and **the ARIA is not**:
            these two change the URL, so they stay `<a>` elements with
            `aria-current="page"` inside one `<nav aria-label>` — never
            `aria-pressed`, `role="group"` or `role="tablist"` (AppShell 2.15,
            ScreenShareSession 2.15, SegmentedControl 2.15, all three explicit).
          */}
          <nav className="pp-guestnav" aria-label={t('nav.main')}>
            {/* NavLink sets aria-current="page", which is what the CSS reads. */}
            <NavLink to={session.base} end>
              <List className="pp-ico pp-ico-20" aria-hidden="true" />
              {t('session.nav.overview')}
            </NavLink>
            <NavLink to={`${session.base}/prints`}>
              <LayoutDashboard className="pp-ico pp-ico-20" aria-hidden="true" />
              {t('session.nav.prints')}
            </NavLink>
          </nav>
          {/*
            The one way out. Deel-links are opened on borrowed phones and in
            family group chats, and without this the only way to end a session
            is to clear the browser. It asks first, because the only way back
            is the link itself and the portal will not show it again.
          */}
          <button
            type="button"
            className="pp-btn pp-btn-ghost pp-btn-sm"
            onClick={() => {
              setConfirming(true);
            }}
          >
            <LogOut className="pp-ico" aria-hidden="true" />
            {t('session.exit')}
          </button>
        </header>
        <main className="pp-main" id={MAIN_ID}>
          {children}
        </main>
      </div>
      <ConfirmDialog
        open={confirming}
        title={t('session.exit.confirm')}
        body={t('session.exit.confirmBody')}
        confirmLabel={t('session.exit.ok')}
        onConfirm={onExit}
        onClose={() => {
          setConfirming(false);
        }}
      />
    </>
  );
}
