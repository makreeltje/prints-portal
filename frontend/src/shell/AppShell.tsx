import { Menu, Moon } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router';
import { t, type MessageKey } from '../i18n/nl';
import type { ThemePreference } from '../theme/theme';
import { useTheme } from '../theme/useTheme';
import { NAV_ITEMS, type NavItem } from './navigation';

const MAIN_ID = 'inhoud';

const THEME_LABELS: Record<ThemePreference, MessageKey> = {
  system: 'settings.theme.system',
  light: 'settings.theme.light',
  dark: 'settings.theme.dark',
};

/** Phone bottom bar: the first three main items, then "Meer" (AppShell spec). */
const BOTTOM_ITEMS = NAV_ITEMS.filter((item) => item.group === 'main').slice(0, 3);

/**
 * Operator frame from design-system/components/AppShell. Desktop shows the
 * sidebar; the tablet rail, phone bars and drawer are a temporary placeholder
 * for GAP-015 (the responsive rules live in styles/app.css). The user badge,
 * Uitloggen and LiveIndicator arrive with auth (M4) and real-time (M5).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="app-frame">
      <a className="app-skip pp-btn pp-btn-secondary" href={`#${MAIN_ID}`}>
        {t('system.skipToContent')}
      </a>
      <div className="pp-app">
        <aside className="pp-side">
          <div className="pp-brand">{t('app.name')}</div>
          <NavList withTooltips />
          <div className="foot">
            <div className="pp-row">
              <ThemeButton theme={theme.theme} onClick={theme.cycleTheme} small />
            </div>
          </div>
        </aside>

        <header className="pp-phone-top app-phone-top">
          <button
            type="button"
            className="pp-btn pp-btn-ghost pp-btn-icon"
            aria-label={t('system.menu')}
            aria-haspopup="dialog"
            aria-expanded={drawerOpen}
            onClick={() => {
              setDrawerOpen(true);
            }}
          >
            <Menu className="pp-ico pp-ico-20" aria-hidden="true" />
          </button>
          <b>{t('app.name')}</b>
          {/* Keeps the name centred; the live dot goes here with real-time (M5). */}
          <span />
        </header>

        <main id={MAIN_ID} className="pp-main app-main" tabIndex={-1}>
          {children}
        </main>

        <nav className="pp-bottomnav app-bottomnav" aria-label={t('nav.main')}>
          {BOTTOM_ITEMS.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.path === '/'}>
              <item.icon className="pp-ico pp-ico-20" aria-hidden="true" />
              {t(item.label)}
            </NavLink>
          ))}
          {/* An anchor so .pp-bottomnav styles it like the other items. */}
          <a
            href="#menu"
            role="button"
            aria-haspopup="dialog"
            aria-expanded={drawerOpen}
            onClick={(event) => {
              event.preventDefault();
              setDrawerOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === ' ') {
                event.preventDefault();
                setDrawerOpen(true);
              }
            }}
          >
            <Menu className="pp-ico pp-ico-20" aria-hidden="true" />
            {t('system.more')}
          </a>
        </nav>
      </div>

      <NavDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
        }}
      >
        <div className="pp-brand">{t('app.name')}</div>
        <NavList />
        <div className="app-drawer-foot">
          <ThemeButton theme={theme.theme} onClick={theme.cycleTheme} />
        </div>
      </NavDrawer>
    </div>
  );
}

function NavList({ withTooltips = false }: { withTooltips?: boolean }) {
  const render = (item: NavItem) => (
    <NavLink key={item.path} to={item.path} end={item.path === '/'}>
      <item.icon className="pp-ico pp-ico-20" aria-hidden="true" />
      <span className="app-nav-label">{t(item.label)}</span>
      {withTooltips && (
        // Visual aid for the tablet icon rail only; the link name already says the same.
        <span className="pp-tip app-rail-tip" aria-hidden="true">
          {t(item.label)}
        </span>
      )}
    </NavLink>
  );

  return (
    <nav className="pp-nav" aria-label={t('nav.main')}>
      {NAV_ITEMS.filter((item) => item.group === 'main').map(render)}
      <div className="grp">{t('nav.manage')}</div>
      {NAV_ITEMS.filter((item) => item.group === 'manage').map(render)}
      {NAV_ITEMS.filter((item) => item.group === 'footer').map(render)}
    </nav>
  );
}

function ThemeButton({
  theme,
  onClick,
  small = false,
}: {
  theme: ThemePreference;
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      className={`pp-btn pp-btn-ghost${small ? ' pp-btn-sm' : ''} app-theme-button`}
      onClick={onClick}
    >
      <Moon className="pp-ico" aria-hidden="true" />
      <span className="app-nav-label">{t('settings.theme')}</span>
      <span className="app-visually-hidden">: {t(THEME_LABELS[theme])}</span>
    </button>
  );
}

/**
 * Phone drawer as a native modal dialog: the browser provides the focus trap,
 * inert background and Esc. Closes on backdrop click and after navigation.
 */
function NavDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const location = useLocation();
  const openedAt = useRef(location.key);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (open && !dialog.open) {
      openedAt.current = location.key;
      dialog.showModal();
    } else if (open && location.key !== openedAt.current) {
      onClose();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, location.key, onClose]);

  return (
    <dialog
      ref={dialogRef}
      className="app-drawer"
      aria-label={t('nav.main')}
      onClose={onClose}
      onClick={(event) => {
        // A click on the dialog element itself (not its content) is a click on the backdrop.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="app-drawer-panel">{children}</div>
    </dialog>
  );
}
