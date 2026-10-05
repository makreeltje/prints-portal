import type { AppEnvironment } from '../config/config.js';

/**
 * Weak-secret rules (brief §10.7). Outside development the app refuses to
 * start with a missing, short or placeholder session secret, and does not
 * create the bootstrap admin with a placeholder or short password.
 * Development stays convenient: problems become warnings.
 */
export const MIN_SESSION_SECRET_LENGTH = 32;
export const MIN_ADMIN_PASSWORD_LENGTH = 12;

/** Values that appear in .env.example or are obviously not secret. */
const PLACEHOLDER_MARKERS = ['change-me', 'changeme', 'change_me', 'placeholder', 'example'];
const TRIVIAL_VALUES = new Set(['secret', 'password', 'admin', 'test', '123456']);

export type SecretCheck =
  { ok: true; warnings: readonly string[] } | { ok: false; problem: string };

export function isPlaceholder(value: string): boolean {
  const lower = value.trim().toLowerCase();
  return TRIVIAL_VALUES.has(lower) || PLACEHOLDER_MARKERS.some((marker) => lower.includes(marker));
}

export function checkSessionSecret(
  secret: string | undefined,
  environment: AppEnvironment,
): SecretCheck {
  const problem =
    secret === undefined || secret.trim() === ''
      ? 'SESSION_SECRET is not set'
      : isPlaceholder(secret)
        ? 'SESSION_SECRET still has a placeholder value'
        : secret.length < MIN_SESSION_SECRET_LENGTH
          ? `SESSION_SECRET must be at least ${MIN_SESSION_SECRET_LENGTH} characters`
          : null;
  return toCheck(problem, environment, 'generate one with: openssl rand -base64 48');
}

export function checkBootstrapPassword(
  password: string | undefined,
  environment: AppEnvironment,
): SecretCheck {
  const problem =
    password === undefined || password === ''
      ? 'ADMIN_PASSWORD is not set'
      : isPlaceholder(password)
        ? 'ADMIN_PASSWORD still has a placeholder value'
        : password.length < MIN_ADMIN_PASSWORD_LENGTH
          ? `ADMIN_PASSWORD must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters`
          : null;
  return toCheck(problem, environment, 'choose a long, unique password');
}

function toCheck(problem: string | null, environment: AppEnvironment, hint: string): SecretCheck {
  if (problem === null) return { ok: true, warnings: [] };
  if (environment === 'development') {
    return { ok: true, warnings: [`${problem} (allowed in development; ${hint})`] };
  }
  return { ok: false, problem: `${problem}; ${hint}` };
}
