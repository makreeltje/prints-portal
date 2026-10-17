import { LogOut, Menu, Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router';
import { useAuth, useCurrentUser } from '../auth/context';
import { Avatar } from '../components/Avatar';
import { t, type MessageKey } from '../i18n/nl';
import { nextTheme, type ThemePreference } from '../theme/theme';
import { useTheme } from '../theme/useTheme';
import { OfflineBanner } from '../pages/OfflineBanner';
import { LiveIndicator } from '../prints/LiveIndicator';
import { useLogo } from './logo';
import { navItemsFor, type NavItem } from './navigation';

const MAIN_ID = 'inhoud';
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const THEME_LABELS: Record<ThemePreference, MessageKey> = {
  system: 'shell.theme.system',
  light: 'shell.theme.light',
  dark: 'shell.theme.dark',
};

/** The icon shows the stand the control is in now (AppShell 1.9, GAP-065). */
const THEME_ICONS: Record<ThemePreference, typeof Monitor> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

/**
 * Operator frame from design-system/components/AppShell (v1.2): one DOM for
 * every size; bundle.css switches between sidebar, 56px icon rail and the
 * phone bars with drawer. Navigation follows the signed-in user's role; the
 * LiveIndicator sits in the footer and in the phone top bar.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const user = useCurrentUser();
  const logo = useLogo();
  const { logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const items = navItemsFor(user.role);
  /*
    Phone bottom bar: Dashboard, Wachtrij, Openstaand, then "Meer" (AppShell
    2.10). It stays at four — five at 360px is 72px apiece — so Wachtrij takes
    Facturen's slot and Facturen moves into the drawer. The choice is about
    frequency, not importance: the queue is a daily page, an invoice is
    periodic. Facturen keeps its place on every other width.
  */
  const bottomItems = items
    .filter((item) => item.group === 'main' && item.path !== '/facturen')
    .slice(0, 3);
  const onLogout = () => void logout();
  const openDrawer = () => {
    setDrawerOpen(true);
  };
  const themeLabel = t('shell.theme.label', {
    stand: t(THEME_LABELS[theme.theme]),
    volgende: t(THEME_LABELS[nextTheme(theme.theme)]),
  });
  const ThemeIcon = THEME_ICONS[theme.theme];

  return (
    <>
      <a className="app-skip pp-btn pp-btn-secondary" href={`#${MAIN_ID}`}>
        {t('system.skipToContent')}
      </a>
      <div className="pp-app">
        {/* While the drawer is open the rest of the shell is inert (modal drawer). */}
        <aside className="pp-side" inert={drawerOpen}>
          <div className={logo === null ? 'pp-brand' : 'pp-brand has-logo'}>
            <span className="ini" aria-hidden="true">
              {t('app.name').charAt(0)}
            </span>
            <span className="full">{t('app.name')}</span>
            {logo !== null && <img className="logo pp-logo" src={logo} alt={t('app.name')} />}
          </div>
          <nav className="pp-nav" aria-label={t('nav.main')}>
            <NavItems items={items} />
          </nav>
          <div className="foot">
            <Avatar name={user.displayName} role={user.role} />
            <div className="pp-row">
              <button
                type="button"
                className="pp-btn pp-btn-ghost pp-btn-sm"
                aria-label={themeLabel}
                onClick={theme.cycleTheme}
              >
                <ThemeIcon className="pp-ico" aria-hidden="true" />
                <span className="lbl">{t('settings.theme')}</span>
              </button>
              <button
                type="button"
                className="pp-btn pp-btn-ghost pp-btn-sm"
                aria-label={t('auth.logout')}
                onClick={onLogout}
              >
                <LogOut className="pp-ico" aria-hidden="true" />
                <span className="lbl">{t('auth.logout')}</span>
              </button>
            </div>
            <LiveIndicator />
          </div>
        </aside>

        <header className="pp-phone-top" inert={drawerOpen}>
          <button
            type="button"
            className="pp-btn pp-btn-ghost pp-btn-icon"
            aria-label={t('system.menu')}
            aria-haspopup="dialog"
            aria-expanded={drawerOpen}
            onClick={openDrawer}
          >
            <Menu className="pp-ico pp-ico-20" aria-hidden="true" />
          </button>
          {logo === null ? (
            <b>{t('app.name')}</b>
          ) : (
            <img className="pp-logo" src={logo} alt={t('app.name')} />
          )}
          <LiveIndicator dotOnly />
        </header>

        <main id={MAIN_ID} className="pp-main app-main" tabIndex={-1} inert={drawerOpen}>
          <OfflineBanner />
          {children}
        </main>

        <nav className="pp-bottomnav" aria-label={t('nav.main')} inert={drawerOpen}>
          {bottomItems.map((item) => (
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
              openDrawer();
            }}
            onKeyDown={(event) => {
              if (event.key === ' ') {
                event.preventDefault();
                openDrawer();
              }
            }}
          >
            <Menu className="pp-ico pp-ico-20" aria-hidden="true" />
            {t('system.more')}
          </a>
        </nav>

        <NavDrawer
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
          }}
        >
          {logo === null ? (
            <div className="pp-brand">{t('app.name')}</div>
          ) : (
            <div className="pp-brand has-logo">
              <img className="logo pp-logo" src={logo} alt={t('app.name')} />
            </div>
          )}
          <nav className="app-drawer-nav" aria-label={t('nav.main')}>
            <NavItems items={items} />
          </nav>
          <div className="foot">
            <Avatar name={user.displayName} role={user.role} />
            <button
              type="button"
              className="pp-btn pp-btn-ghost"
              aria-label={themeLabel}
              onClick={theme.cycleTheme}
            >
              <ThemeIcon className="pp-ico" aria-hidden="true" />
              {t('settings.theme')}
            </button>
            <button type="button" className="pp-btn pp-btn-ghost" onClick={onLogout}>
              <LogOut className="pp-ico" aria-hidden="true" />
              {t('auth.logout')}
            </button>
          </div>
        </NavDrawer>
      </div>
    </>
  );
}

/** Nav links in the AppShell markup: icon, `.lbl` label and `data-tip` for the rail tooltip. */
function NavItems({ items }: { items: readonly NavItem[] }) {
  const render = (item: NavItem) => (
    <NavLink key={item.path} to={item.path} end={item.path === '/'} data-tip={t(item.label)}>
      <item.icon className="pp-ico pp-ico-20" aria-hidden="true" />
      <span className="lbl">{t(item.label)}</span>
    </NavLink>
  );
  const manage = items.filter((item) => item.group === 'manage');
  return (
    <>
      {items.filter((item) => item.group === 'main').map(render)}
      {manage.length > 0 && <div className="grp">{t('nav.manage')}</div>}
      {manage.map(render)}
      {items.filter((item) => item.group === 'footer').map(render)}
    </>
  );
}

/**
 * Phone drawer: `.pp-drawer-backdrop[hidden] > .pp-drawer[role=dialog]`.
 * Focus moves in on open, Tab stays inside, Esc and a backdrop click close
 * it, focus returns to the trigger, and it closes after navigation.
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
  const drawerRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const location = useLocation();
  const openedAt = useRef(location.key);

  useEffect(() => {
    if (open) {
      openedAt.current = location.key;
      returnFocus.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      drawerRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    } else {
      returnFocus.current?.focus();
      returnFocus.current = null;
    }
    // Runs on open/close only; navigation is handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open && location.key !== openedAt.current) onClose();
  }, [open, location.key, onClose]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || drawerRef.current === null) return;
    const focusable = [...drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = focusable.at(0);
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  return (
    <div
      className="pp-drawer-backdrop"
      hidden={!open}
      onClick={(event) => {
        // A click on the backdrop itself (not the drawer) closes it.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={drawerRef}
        className="pp-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t('system.menu')}
        onKeyDown={onKeyDown}
      >
        {children}
      </div>
    </div>
  );
}
