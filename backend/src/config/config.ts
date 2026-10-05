import { randomBytes } from 'node:crypto';
import { isIP } from 'node:net';
import path from 'node:path';
import { checkSessionSecret } from '../core/secrets.js';
import { DatabaseUrlError, parseDatabaseUrl, type DatabaseTarget } from '../db/database-url.js';

export type AppEnvironment = 'development' | 'test' | 'production';

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export interface AppConfig {
  environment: AppEnvironment;
  host: string;
  port: number;
  dataDir: string;
  printsRoot: string;
  database: DatabaseTarget;
  logLevel: LogLevel;
  /** Directory with the built SPA; null when the frontend is not served by this process. */
  staticDir: string | null;
  indexing: {
    /** Full scan when the app starts. */
    onStartup: boolean;
    watch: boolean;
    /** Quiet period per print before it is re-indexed after a change. */
    debounceMs: number;
    /** Poll instead of file-system events (for mounts that do not report changes). */
    polling: boolean;
    pollIntervalMs: number;
  };
  auth: AuthConfig;
  http: {
    /** Proxies whose X-Forwarded-* headers are trusted (IPs, CIDRs or proxy-addr keywords). */
    trustedProxies: readonly string[];
    /** Extra origins allowed to call the API with credentials; empty disables CORS. */
    corsOrigins: readonly string[];
  };
  /** Non-fatal configuration problems to log at startup (development only). */
  warnings: readonly string[];
}

export interface OidcConfig {
  issuer: URL;
  clientId: string;
  clientSecret: string;
  /** Members of this group (from the "groups" claim) are Admin. */
  adminGroup: string;
}

export interface AuthConfig {
  /** Keys session ids and signs the short-lived OIDC cookie. */
  sessionSecret: string;
  /** Origin users open in the browser (no path or trailing slash); needed for OIDC. */
  publicUrl: string | null;
  /** First Admin, created when no Admin exists yet (local login only). */
  bootstrapAdmin: { email: string | null; password: string | null };
  /** When set, local login is disabled. */
  oidc: OidcConfig | null;
  /** Login attempts per minute per client address. */
  loginRateLimit: number;
}

export class ConfigError extends Error {
  override name = 'ConfigError';

  constructor(readonly problems: readonly string[]) {
    super(`Invalid configuration:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  }
}

export interface ConfigDefaults {
  /** Fallback for STATIC_DIR, resolved by the caller (depends on the install layout). */
  staticDir: string | null;
}

/**
 * Builds the configuration from environment variables. Collects every problem
 * before failing, so a misconfigured container reports all of them at once.
 */
export function loadConfig(
  env: Record<string, string | undefined>,
  defaults: ConfigDefaults = { staticDir: null },
): AppConfig {
  const problems: string[] = [];
  const read = (key: string): string | undefined => {
    const value = env[key]?.trim();
    return value === undefined || value === '' ? undefined : value;
  };

  const environment = parseEnvironment(read('NODE_ENV'));

  const portText = read('PORT') ?? '8080';
  const port = Number(portText);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    problems.push(`PORT must be a whole number between 1 and 65535 (got "${portText}")`);
  }

  const dataDir = path.resolve(read('DATA_DIR') ?? '/data');
  const printsRoot = path.resolve(read('PRINTS_ROOT') ?? '/prints');

  let database: DatabaseTarget = {
    dialect: 'sqlite',
    filename: path.join(dataDir, 'prints-portal.db'),
  };
  const databaseUrl = read('DATABASE_URL');
  if (databaseUrl !== undefined) {
    try {
      database = parseDatabaseUrl(databaseUrl);
    } catch (error) {
      if (!(error instanceof DatabaseUrlError)) throw error;
      problems.push(error.message);
    }
  }

  const logLevelText = (read('LOG_LEVEL') ?? 'info').toLowerCase();
  const logLevel = LOG_LEVELS.find((level) => level === logLevelText);
  if (logLevel === undefined) {
    problems.push(`LOG_LEVEL must be one of ${LOG_LEVELS.join(', ')} (got "${logLevelText}")`);
  }

  const indexOnStartup = parseBoolean(read('INDEX_ON_STARTUP'), true, 'INDEX_ON_STARTUP', problems);
  const watchEnabled = parseBoolean(read('WATCH_ENABLED'), true, 'WATCH_ENABLED', problems);
  const watchPolling = parseBoolean(read('WATCH_POLLING'), false, 'WATCH_POLLING', problems);
  const debounceMs = parseMilliseconds(
    read('WATCH_DEBOUNCE_MS'),
    2000,
    'WATCH_DEBOUNCE_MS',
    problems,
  );
  const pollIntervalMs = parseMilliseconds(
    read('WATCH_POLL_INTERVAL_MS'),
    5000,
    'WATCH_POLL_INTERVAL_MS',
    problems,
  );

  const warnings: string[] = [];
  const auth = parseAuth(read, environment, problems, warnings);
  const trustedProxies = parseTrustedProxies(read('TRUSTED_PROXIES'), problems);
  const corsOrigins = parseOrigins(read('CORS_ORIGINS'), problems);

  const staticDirText = read('STATIC_DIR');
  const staticDir = staticDirText === undefined ? defaults.staticDir : path.resolve(staticDirText);

  if (problems.length > 0) throw new ConfigError(problems);

  return {
    environment,
    host: read('HOST') ?? '0.0.0.0',
    port,
    dataDir,
    printsRoot,
    database,
    logLevel: logLevel ?? 'info',
    staticDir,
    indexing: {
      onStartup: indexOnStartup,
      watch: watchEnabled,
      debounceMs,
      polling: watchPolling,
      pollIntervalMs,
    },
    auth,
    http: { trustedProxies, corsOrigins },
    warnings,
  };
}

const PROXY_KEYWORDS = new Set(['loopback', 'linklocal', 'uniquelocal']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;

function parseAuth(
  read: (key: string) => string | undefined,
  environment: AppEnvironment,
  problems: string[],
  warnings: string[],
): AuthConfig {
  let sessionSecret = read('SESSION_SECRET');
  const secretCheck = checkSessionSecret(sessionSecret, environment);
  if (!secretCheck.ok) problems.push(secretCheck.problem);
  else warnings.push(...secretCheck.warnings);
  if (sessionSecret === undefined) {
    // Development only (checked above): sessions end when the process restarts.
    sessionSecret = randomBytes(48).toString('base64url');
  }

  const publicUrlText = read('PUBLIC_URL');
  let publicUrl: string | null = null;
  if (publicUrlText !== undefined) {
    const url = parseHttpUrl(publicUrlText);
    if (url === null || url.pathname !== '/' || url.search !== '' || url.hash !== '') {
      problems.push(
        `PUBLIC_URL must be an http(s) address without a path, like https://prints.example.org (got "${publicUrlText}")`,
      );
    } else {
      publicUrl = url.origin;
    }
  }

  const adminEmail = read('ADMIN_EMAIL')?.toLowerCase() ?? null;
  if (adminEmail !== null && !EMAIL_PATTERN.test(adminEmail)) {
    problems.push(`ADMIN_EMAIL must be an e-mail address (got "${adminEmail}")`);
  }

  const oidcValues = {
    OIDC_ISSUER: read('OIDC_ISSUER'),
    OIDC_CLIENT_ID: read('OIDC_CLIENT_ID'),
    OIDC_CLIENT_SECRET: read('OIDC_CLIENT_SECRET'),
    OIDC_ADMIN_GROUP: read('OIDC_ADMIN_GROUP'),
  };
  let oidc: OidcConfig | null = null;
  const missing = Object.entries(oidcValues).filter(([, value]) => value === undefined);
  if (missing.length < Object.keys(oidcValues).length) {
    const issuer =
      oidcValues.OIDC_ISSUER === undefined ? null : parseHttpUrl(oidcValues.OIDC_ISSUER);
    if (missing.length > 0) {
      problems.push(
        `OIDC needs OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET and OIDC_ADMIN_GROUP; missing: ${missing.map(([key]) => key).join(', ')}`,
      );
    } else if (issuer === null) {
      problems.push(
        `OIDC_ISSUER must be an http(s) address (got "${oidcValues.OIDC_ISSUER ?? ''}")`,
      );
    } else if (publicUrlText === undefined) {
      problems.push('PUBLIC_URL is required with OIDC (it forms the redirect address)');
    } else {
      oidc = {
        issuer,
        clientId: oidcValues.OIDC_CLIENT_ID ?? '',
        clientSecret: oidcValues.OIDC_CLIENT_SECRET ?? '',
        adminGroup: oidcValues.OIDC_ADMIN_GROUP ?? '',
      };
    }
  }

  const rateText = read('RATE_LIMIT_LOGIN') ?? '5';
  const loginRateLimit = Number(rateText);
  if (!Number.isInteger(loginRateLimit) || loginRateLimit < 1 || loginRateLimit > 1000) {
    problems.push(`RATE_LIMIT_LOGIN must be a whole number between 1 and 1000 (got "${rateText}")`);
  }

  return {
    sessionSecret,
    publicUrl,
    bootstrapAdmin: { email: adminEmail, password: read('ADMIN_PASSWORD') ?? null },
    oidc,
    loginRateLimit,
  };
}

function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

function splitList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');
}

export function parseTrustedProxies(value: string | undefined, problems: string[]): string[] {
  const proxies = splitList(value);
  for (const proxy of proxies) {
    if (PROXY_KEYWORDS.has(proxy)) continue;
    const [address = '', prefix, ...rest] = proxy.split('/');
    const family = isIP(address);
    const maxPrefix = family === 6 ? 128 : 32;
    const prefixOk =
      prefix === undefined ||
      (/^\d{1,3}$/.test(prefix) && Number(prefix) >= 0 && Number(prefix) <= maxPrefix);
    if (family === 0 || !prefixOk || rest.length > 0) {
      problems.push(
        `TRUSTED_PROXIES entries must be IP addresses, CIDR ranges or loopback/linklocal/uniquelocal (got "${proxy}")`,
      );
    }
  }
  return proxies;
}

function parseOrigins(value: string | undefined, problems: string[]): string[] {
  const origins: string[] = [];
  for (const item of splitList(value)) {
    const url = parseHttpUrl(item);
    if (url === null || url.origin !== item.replace(/\/+$/, '')) {
      problems.push(
        `CORS_ORIGINS entries must be origins like https://example.com (got "${item}")`,
      );
    } else {
      origins.push(url.origin);
    }
  }
  return origins;
}

const TRUE_WORDS = new Set(['true', '1', 'yes', 'on']);
const FALSE_WORDS = new Set(['false', '0', 'no', 'off']);

function parseBoolean(
  value: string | undefined,
  fallback: boolean,
  name: string,
  problems: string[],
): boolean {
  if (value === undefined) return fallback;
  const lower = value.toLowerCase();
  if (TRUE_WORDS.has(lower)) return true;
  if (FALSE_WORDS.has(lower)) return false;
  problems.push(`${name} must be true or false (got "${value}")`);
  return fallback;
}

function parseMilliseconds(
  value: string | undefined,
  fallback: number,
  name: string,
  problems: string[],
): number {
  if (value === undefined) return fallback;
  const ms = Number(value);
  if (!Number.isInteger(ms) || ms < 100 || ms > 600_000) {
    problems.push(
      `${name} must be a whole number of milliseconds between 100 and 600000 (got "${value}")`,
    );
    return fallback;
  }
  return ms;
}

function parseEnvironment(value: string | undefined): AppEnvironment {
  if (value === 'development' || value === 'test') return value;
  return 'production';
}
