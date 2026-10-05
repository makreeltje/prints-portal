import { Moon } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
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

/**
 * Operator frame from design-system/components/AppShell (desktop sidebar).
 * The tablet rail, phone bars and drawer wait for GAP-015; the user badge,
 * Uitloggen and LiveIndicator arrive with auth (M4) and real-time (M5).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { theme, cycleTheme } = useTheme();

  return (
    <div className="app-frame">
      <a className="app-skip pp-btn pp-btn-secondary" href={`#${MAIN_ID}`}>
        {t('system.skipToContent')}
      </a>
      <div className="pp-app">
        <aside className="pp-side">
          <div className="pp-brand">{t('app.name')}</div>
          <nav className="pp-nav" aria-label={t('nav.main')}>
            {NAV_ITEMS.filter((item) => item.group === 'main').map(renderNavLink)}
            <div className="grp">{t('nav.manage')}</div>
            {NAV_ITEMS.filter((item) => item.group === 'manage').map(renderNavLink)}
            {NAV_ITEMS.filter((item) => item.group === 'footer').map(renderNavLink)}
          </nav>
          <div className="foot">
            <div className="pp-row">
              <button type="button" className="pp-btn pp-btn-ghost pp-btn-sm" onClick={cycleTheme}>
                <Moon className="pp-ico" aria-hidden="true" />
                {t('settings.theme')}
                <span className="app-visually-hidden">: {t(THEME_LABELS[theme])}</span>
              </button>
            </div>
          </div>
        </aside>
        <main id={MAIN_ID} className="pp-main app-main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

function renderNavLink(item: NavItem) {
  const Icon = item.icon;
  return (
    <NavLink key={item.path} to={item.path} end={item.path === '/'}>
      <Icon className="pp-ico pp-ico-20" aria-hidden="true" />
      {t(item.label)}
    </NavLink>
  );
}
