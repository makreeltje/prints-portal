import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ConfigError, loadConfig } from '../src/config/config.js';
import { parseDatabaseUrl } from '../src/db/database-url.js';

describe('loadConfig', () => {
  it('uses defaults when nothing is set', () => {
    const config = loadConfig({});
    expect(config).toEqual({
      environment: 'production',
      host: '0.0.0.0',
      port: 8080,
      dataDir: '/data',
      printsRoot: '/prints',
      database: { dialect: 'sqlite', filename: '/data/prints-portal.db' },
      logLevel: 'info',
      staticDir: null,
      indexing: {
        onStartup: true,
        watch: true,
        debounceMs: 2000,
        polling: false,
        pollIntervalMs: 5000,
      },
    });
  });

  it('reads the indexing settings', () => {
    expect(
      loadConfig({
        INDEX_ON_STARTUP: 'false',
        WATCH_ENABLED: 'no',
        WATCH_DEBOUNCE_MS: '500',
        WATCH_POLLING: 'TRUE',
        WATCH_POLL_INTERVAL_MS: '10000',
      }).indexing,
    ).toEqual({
      onStartup: false,
      watch: false,
      debounceMs: 500,
      polling: true,
      pollIntervalMs: 10_000,
    });
  });

  it.each([
    ['WATCH_ENABLED', 'maybe'],
    ['WATCH_DEBOUNCE_MS', '10'],
    ['WATCH_POLL_INTERVAL_MS', '1.5'],
  ])('rejects %s=%s', (key, value) => {
    expect(() => loadConfig({ [key]: value })).toThrow(ConfigError);
  });

  it('places the default SQLite file in DATA_DIR', () => {
    const config = loadConfig({ DATA_DIR: '/srv/portal' });
    expect(config.database).toEqual({
      dialect: 'sqlite',
      filename: path.join('/srv/portal', 'prints-portal.db'),
    });
  });

  it('reads every supported variable', () => {
    const config = loadConfig({
      NODE_ENV: 'development',
      HOST: '127.0.0.1',
      PORT: '3000',
      PRINTS_ROOT: '/mnt/prints',
      DATABASE_URL: 'postgres://portal:secret@db:5432/portal',
      LOG_LEVEL: 'DEBUG',
      STATIC_DIR: '/app/frontend/dist',
    });
    expect(config.environment).toBe('development');
    expect(config.host).toBe('127.0.0.1');
    expect(config.port).toBe(3000);
    expect(config.printsRoot).toBe('/mnt/prints');
    expect(config.database).toEqual({
      dialect: 'postgres',
      connectionString: 'postgres://portal:secret@db:5432/portal',
    });
    expect(config.logLevel).toBe('debug');
    expect(config.staticDir).toBe('/app/frontend/dist');
  });

  it('treats empty values as unset', () => {
    expect(loadConfig({ PORT: '', DATABASE_URL: '  ' }).port).toBe(8080);
  });

  it('treats an unknown NODE_ENV as production', () => {
    expect(loadConfig({ NODE_ENV: 'staging' }).environment).toBe('production');
  });

  it('reports every problem at once', () => {
    let caught: unknown;
    try {
      loadConfig({ PORT: 'eighty', DATABASE_URL: 'mongodb://db/portal', LOG_LEVEL: 'loud' });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(ConfigError);
    expect((caught as ConfigError).problems).toHaveLength(3);
  });

  it.each(['0', '65536', '80.5', '-1'])('rejects PORT=%s', (port) => {
    expect(() => loadConfig({ PORT: port })).toThrow(ConfigError);
  });
});

describe('parseDatabaseUrl', () => {
  it.each([
    ['sqlite:///data/prints-portal.db', { dialect: 'sqlite', filename: '/data/prints-portal.db' }],
    ['sqlite://data/dev.db', { dialect: 'sqlite', filename: 'data/dev.db' }],
    ['sqlite::memory:', { dialect: 'sqlite', filename: ':memory:' }],
    ['sqlite:///my%20prints/db.sqlite', { dialect: 'sqlite', filename: '/my prints/db.sqlite' }],
    [
      'postgresql://u:p@localhost/portal',
      { dialect: 'postgres', connectionString: 'postgresql://u:p@localhost/portal' },
    ],
    ['mysql://u:p@db:3306/portal', { dialect: 'mysql', uri: 'mysql://u:p@db:3306/portal' }],
    ['mariadb://u:p@db:3306/portal', { dialect: 'mysql', uri: 'mysql://u:p@db:3306/portal' }],
  ])('parses %s', (url, expected) => {
    expect(parseDatabaseUrl(url)).toEqual(expected);
  });

  it.each([
    'mongodb://db/portal',
    'sqlite://',
    'sqlite:/data/x.db',
    'postgres:///portal',
    'portal.db',
  ])('rejects %s', (url) => {
    expect(() => parseDatabaseUrl(url)).toThrow();
  });
});
