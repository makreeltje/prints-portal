import {
  BookOpen,
  Clock,
  LayoutDashboard,
  Link,
  Receipt,
  Shield,
  SlidersHorizontal,
  Tag,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '../auth/types';
import type { MessageKey } from '../i18n/nl';

export type NavGroup = 'main' | 'manage' | 'footer';

export interface NavItem {
  path: string;
  label: MessageKey;
  icon: LucideIcon;
  group: NavGroup;
  /** Roles that see the item; everyone when omitted. */
  roles?: readonly Role[];
}

const ADMIN: readonly Role[] = ['Admin'];

/**
 * Order, icons and visibility from design-system/components/AppShell:
 * Facturen and Tags for Admin and Editor, the Beheer group for Admins, the rest for everyone.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/', label: 'nav.dashboard', icon: LayoutDashboard, group: 'main' },
  { path: '/openstaand', label: 'nav.outstanding', icon: Clock, group: 'main' },
  {
    path: '/facturen',
    label: 'nav.invoices',
    icon: Receipt,
    group: 'main',
    roles: ['Admin', 'Editor'],
  },
  { path: '/tags', label: 'nav.tags', icon: Tag, group: 'main', roles: ['Admin', 'Editor'] },
  { path: '/deel-links', label: 'nav.shareLinks', icon: Link, group: 'manage', roles: ADMIN },
  { path: '/toegang', label: 'nav.access', icon: Shield, group: 'manage', roles: ADMIN },
  { path: '/gebruikers', label: 'nav.users', icon: Users, group: 'manage', roles: ADMIN },
  {
    path: '/instellingen',
    label: 'nav.settings',
    icon: SlidersHorizontal,
    group: 'manage',
    roles: ADMIN,
  },
  { path: '/api-docs', label: 'nav.apiDocs', icon: BookOpen, group: 'footer' },
];

export function canSee(item: NavItem, role: Role): boolean {
  return item.roles === undefined || item.roles.includes(role);
}

export function navItemsFor(role: Role): readonly NavItem[] {
  return NAV_ITEMS.filter((item) => canSee(item, role));
}
