import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ConfigError, loadConfig, parseTrustedProxies } from '../src/config/config.js';
import { parseDatabaseUrl } from '../src/db/database-url.js';

/** A session secret that passes the weak-secret rules; required outside development. */
const SECRET = 'q7Vb2mXc9LkP4tRw8ZyN3sHd6FgJ1aUe';

/** loadConfig with the minimum a production start needs, plus overrides. */
const load = (env: Record<string, string> = {}) => loadConfig({ SESSION_SECRET: SECRET, ...env });

describe('loadConfig', () => {
  it('uses defaults when nothing else is set', () => {
    const config = load();
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
      auth: {
        sessionSecret: SECRET,
        publicUrl: null,
        bootstrapAdmin: { email: null, password: null },
        oidc: null,
        loginRateLimit: 5,
        shareRateLimit: 60,
      },
      http: { trustedProxies: [], corsOrigins: [] },
      spoolman: { url: null, timeoutMs: 3000, cacheMs: 60_000 },
      seedTariffEurPerKwh: null,
      warnings: [],
    });
  });

  it('reads the indexing settings', () => {
    expect(
      load({
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
    expect(() => load({ [key]: value })).toThrow(ConfigError);
  });

  it('places the default SQLite file in DATA_DIR', () => {
    const config = load({ DATA_DIR: '/srv/portal' });
    expect(config.database).toEqual({
      dialect: 'sqlite',
      filename: path.join('/srv/portal', 'prints-portal.db'),
    });
  });

  it('reads every supported variable', () => {
    const config = load({
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
    expect(load({ PORT: '', DATABASE_URL: '  ' }).port).toBe(8080);
  });

  it('treats an unknown NODE_ENV as production', () => {
    expect(load({ NODE_ENV: 'staging' }).environment).toBe('production');
  });

  it('reports every problem at once', () => {
    let caught: unknown;
    try {
      load({ PORT: 'eighty', DATABASE_URL: 'mongodb://db/portal', LOG_LEVEL: 'loud' });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(ConfigError);
    expect((caught as ConfigError).problems).toHaveLength(3);
  });

  it.each(['0', '65536', '80.5', '-1'])('rejects PORT=%s', (port) => {
    expect(() => load({ PORT: port })).toThrow(ConfigError);
  });
});

describe('loadConfig: auth', () => {
  const problemsOf = (env: Record<string, string>): readonly string[] => {
    try {
      loadConfig(env);
    } catch (error) {
      if (error instanceof ConfigError) return error.problems;
      throw error;
    }
    return [];
  };

  it.each([
    ['missing', {}],
    ['short', { SESSION_SECRET: 'tooShort' }],
    ['placeholder', { SESSION_SECRET: 'CHANGE-ME-to-a-long-random-string-of-48-chars' }],
  ])('refuses a %s SESSION_SECRET outside development', (_label, env) => {
    expect(problemsOf(env).join('\n')).toMatch(/SESSION_SECRET/);
    expect(problemsOf({ ...env, NODE_ENV: 'test' }).join('\n')).toMatch(/SESSION_SECRET/);
  });

  it('generates a session secret in development and warns', () => {
    const config = loadConfig({ NODE_ENV: 'development' });
    expect(config.auth.sessionSecret.length).toBeGreaterThanOrEqual(32);
    expect(config.warnings.join('\n')).toMatch(/SESSION_SECRET is not set/);
  });

  it('reads the bootstrap admin and normalises the e-mail address', () => {
    const config = load({ ADMIN_EMAIL: ' Admin@Example.org ', ADMIN_PASSWORD: 'x' });
    expect(config.auth.bootstrapAdmin).toEqual({ email: 'admin@example.org', password: 'x' });
    expect(problemsOf({ SESSION_SECRET: SECRET, ADMIN_EMAIL: 'admin' })).toHaveLength(1);
  });

  const oidcEnv = {
    OIDC_ISSUER: 'https://auth.example.org/application/o/prints/',
    OIDC_CLIENT_ID: 'prints',
    OIDC_CLIENT_SECRET: 'client-secret',
    OIDC_ADMIN_GROUP: 'prints-admins',
    PUBLIC_URL: 'https://prints.example.org/',
  };

  it('enables OIDC when every OIDC variable and PUBLIC_URL are set', () => {
    const { auth } = load(oidcEnv);
    expect(auth.publicUrl).toBe('https://prints.example.org');
    expect(auth.oidc).toEqual({
      issuer: new URL(oidcEnv.OIDC_ISSUER),
      clientId: 'prints',
      clientSecret: 'client-secret',
      adminGroup: 'prints-admins',
    });
  });

  it.each([
    ['OIDC_CLIENT_SECRET', /missing: OIDC_CLIENT_SECRET/],
    ['OIDC_ADMIN_GROUP', /missing: OIDC_ADMIN_GROUP/],
    ['PUBLIC_URL', /PUBLIC_URL is required with OIDC/],
  ])('refuses OIDC without %s', (key, message) => {
    const env: Record<string, string> = { ...oidcEnv, SESSION_SECRET: SECRET };
    env[key] = '';
    expect(problemsOf(env).join('\n')).toMatch(message);
  });

  it.each(['prints.example.org', 'https://example.org/prints', 'https://example.org/?a=1'])(
    'rejects PUBLIC_URL=%s',
    (value) => {
      expect(problemsOf({ SESSION_SECRET: SECRET, PUBLIC_URL: value })).toHaveLength(1);
    },
  );

  it('rejects an issuer that is not an http(s) address', () => {
    expect(problemsOf({ ...oidcEnv, SESSION_SECRET: SECRET, OIDC_ISSUER: 'auth' })).toHaveLength(1);
  });

  it.each(['0', '1001', 'many'])('rejects RATE_LIMIT_LOGIN=%s', (value) => {
    expect(() => load({ RATE_LIMIT_LOGIN: value })).toThrow(ConfigError);
  });

  it.each(['0', '1001', 'many'])('rejects RATE_LIMIT_SHARE=%s', (value) => {
    expect(() => load({ RATE_LIMIT_SHARE: value })).toThrow(ConfigError);
  });

  it('reads RATE_LIMIT_SHARE', () => {
    expect(load({ RATE_LIMIT_SHARE: '20' }).auth.shareRateLimit).toBe(20);
  });

  it('reads trusted proxies and CORS origins', () => {
    const config = load({
      TRUSTED_PROXIES: '10.0.0.1, 172.16.0.0/12, ::1, fd00::/8, loopback',
      CORS_ORIGINS: 'https://a.example.org, http://localhost:5173/',
    });
    expect(config.http).toEqual({
      trustedProxies: ['10.0.0.1', '172.16.0.0/12', '::1', 'fd00::/8', 'loopback'],
      corsOrigins: ['https://a.example.org', 'http://localhost:5173'],
    });
  });

  it.each(['10.0.0.0/33', 'proxy.local', '10.0.0.1/8/2', '::1/129', '*'])(
    'rejects the trusted proxy %s',
    (proxy) => {
      const problems: string[] = [];
      parseTrustedProxies(proxy, problems);
      expect(problems).toHaveLength(1);
    },
  );

  it('rejects a CORS origin with a path', () => {
    expect(() => load({ CORS_ORIGINS: 'https://a.example.org/app' })).toThrow(ConfigError);
  });

  it('reads Spoolman and the seed tariff', () => {
    const config = load({
      SPOOLMAN_URL: 'http://spoolman.lan:7912/',
      SPOOLMAN_TIMEOUT_MS: '1500',
      ELECTRICITY_TARIFF_EUR_PER_KWH: '0,25',
    });
    expect(config.spoolman).toEqual({
      url: 'http://spoolman.lan:7912',
      timeoutMs: 1500,
      cacheMs: 60_000,
    });
    expect(config.seedTariffEurPerKwh).toBe(0.25);
  });

  it.each([
    { SPOOLMAN_URL: 'ftp://spoolman' },
    { SPOOLMAN_URL: 'not a url' },
    { ELECTRICITY_TARIFF_EUR_PER_KWH: 'cheap' },
    { ELECTRICITY_TARIFF_EUR_PER_KWH: '-1' },
  ] as Record<string, string>[])('rejects %o', (env) => {
    expect(() => load(env)).toThrow(ConfigError);
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
