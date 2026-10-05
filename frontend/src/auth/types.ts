export type Role = 'User' | 'Editor' | 'Admin';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  origin: 'local' | 'oidc';
  lastLoginAt: string | null;
}

export interface SessionResponse {
  user: User;
  csrfToken: string;
  expiresAt: string;
}

export interface AuthMethods {
  local: boolean;
  oidc: boolean;
}

export const ROLES: readonly Role[] = ['Admin', 'Editor', 'User'];
