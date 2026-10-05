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
  };
}

function parseEnvironment(value: string | undefined): AppEnvironment {
  if (value === 'development' || value === 'test') return value;
  return 'production';
}
