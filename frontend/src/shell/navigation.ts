import {
  BookOpen,
  Clock,
  LayoutDashboard,
  Link,
  Receipt,
  Shield,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { MessageKey } from '../i18n/nl';

export type NavGroup = 'main' | 'manage' | 'footer';

export interface NavItem {
  path: string;
  label: MessageKey;
  icon: LucideIcon;
  group: NavGroup;
}

/**
 * Order and icons from design-system/components/AppShell. Role filtering
 * (Facturen for Admin and Editor, Beheer for Admins) arrives with auth in M4.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/', label: 'nav.dashboard', icon: LayoutDashboard, group: 'main' },
  { path: '/openstaand', label: 'nav.outstanding', icon: Clock, group: 'main' },
  { path: '/facturen', label: 'nav.invoices', icon: Receipt, group: 'main' },
  { path: '/deel-links', label: 'nav.shareLinks', icon: Link, group: 'manage' },
  { path: '/toegang', label: 'nav.access', icon: Shield, group: 'manage' },
  { path: '/gebruikers', label: 'nav.users', icon: Users, group: 'manage' },
  { path: '/instellingen', label: 'nav.settings', icon: SlidersHorizontal, group: 'manage' },
  { path: '/api-docs', label: 'nav.apiDocs', icon: BookOpen, group: 'footer' },
];
