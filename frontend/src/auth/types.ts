export type Role = 'User' | 'Editor' | 'Admin';

export interface User {
  id: string;
  /** Sign-in name: an e-mail address or a plain name. */
  login: string;
  displayName: string;
  role: Role;
  origin: 'local' | 'oidc';
  lastLoginAt: string | null;
}

export interface SessionResponse {
  user: User;
  csrfToken: string;
  expiresAt: string;
  /** Set after an Admin gave a temporary password; the screen for it waits for GAP-019. */
  mustChangePassword: boolean;
}

export interface AuthMethods {
  local: boolean;
  oidc: boolean;
}

export const ROLES: readonly Role[] = ['Admin', 'Editor', 'User'];
