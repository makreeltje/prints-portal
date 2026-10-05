import path from 'node:path';
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
  };
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
