import { createContext, useContext } from 'react';
import type { AuthMethods, User } from './types';

export type AuthState =
  | { status: 'loading' }
  | { status: 'error' }
  /** `expired`: the session ended while in use, so the login card says so. */
  | { status: 'signed-out'; methods: AuthMethods; expired: boolean }
  /** `mustChangePassword`: signed in with a temporary password; only "Nieuw wachtwoord kiezen" is shown. */
  | { status: 'signed-in'; user: User; methods: AuthMethods; mustChangePassword: boolean };

export interface AuthContextValue {
  state: AuthState;
  /** Resolves on success; rejects with ApiError (401 wrong credentials, 429 too many attempts). */
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Replaces a temporary password; rejects with ApiError (400 password_too_short …). */
  changePassword: (newPassword: string) => Promise<void>;
  retry: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (value === null) throw new Error('useAuth outside AuthProvider');
  return value;
}

/** The signed-in user; only for components rendered inside the signed-in app. */
export function useCurrentUser(): User {
  const { state } = useAuth();
  if (state.status !== 'signed-in') throw new Error('no signed-in user');
  return state.user;
}
