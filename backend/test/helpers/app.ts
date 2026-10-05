import type { FastifyInstance, InjectOptions, LightMyRequestResponse } from 'fastify';
import { buildApp } from '../../src/app.js';
import { hashPassword } from '../../src/auth/passwords.js';
import { createUser } from '../../src/auth/users.js';
import { loadConfig, type AppConfig } from '../../src/config/config.js';
import type { AppDatabase } from '../../src/db/connection.js';
import type { Role } from '../../src/db/schema.js';
import { openTestDatabase } from './databases.js';

export const TEST_SESSION_SECRET = 'q7Vb2mXc9LkP4tRw8ZyN3sHd6FgJ1aUe';
export const TEST_PASSWORD = 'correct horse battery';

/** A movable clock, so tests can let sessions expire. */
export class TestClock {
  constructor(private current = new Date('2026-10-05T10:00:00.000Z')) {}
  now = (): Date => new Date(this.current);
  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

export interface Session {
  cookie: string;
  csrfToken: string;
}

export interface TestApp {
  app: FastifyInstance;
  db: AppDatabase;
  config: AppConfig;
  clock: TestClock;
  /** Inserts a local user with TEST_PASSWORD. */
  addUser(login: string, role: Role, options?: { mustChangePassword?: boolean }): Promise<string>;
  login(login: string, password?: string): Promise<Session>;
  /** Injects with the session cookie and, for changing methods, the CSRF header. */
  as(session: Session | null, options: InjectOptions): Promise<LightMyRequestResponse>;
  close(): Promise<void>;
}

let passwordHash: Promise<string> | undefined;

export async function startTestApp(
  databaseUrl: string,
  env: Record<string, string> = {},
): Promise<TestApp> {
  const config = loadConfig({
    NODE_ENV: 'test',
    SESSION_SECRET: TEST_SESSION_SECRET,
    PRINTS_ROOT: '/nonexistent',
    ...env,
  });
  const db = await openTestDatabase(databaseUrl);
  const clock = new TestClock();
  const app = await buildApp({ config, db, now: clock.now });
  passwordHash ??= hashPassword(TEST_PASSWORD);

  const testApp: TestApp = {
    app,
    db,
    config,
    clock,
    async addUser(login, role, options = {}) {
      const user = await createUser(
        db,
        { login, role, passwordHash: await passwordHash, ...options },
        clock.now(),
      );
      return user.id;
    },
    async login(login, password = TEST_PASSWORD) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { login, password },
      });
      if (response.statusCode !== 200) {
        throw new Error(`login failed: ${String(response.statusCode)} ${response.body}`);
      }
      const cookie = response.cookies.find((c) => c.name === 'pp_session');
      if (cookie === undefined) throw new Error('no session cookie');
      return {
        cookie: `pp_session=${cookie.value}`,
        csrfToken: response.json<{ csrfToken: string }>().csrfToken,
      };
    },
    as(session, options) {
      const method = (options.method ?? 'GET').toUpperCase();
      const headers: Record<string, string> = {};
      if (session !== null) {
        headers.cookie = session.cookie;
        if (!['GET', 'HEAD', 'OPTIONS'].includes(method))
          headers['x-csrf-token'] = session.csrfToken;
      }
      return app.inject({ ...options, headers: { ...headers, ...(options.headers ?? {}) } });
    },
    async close() {
      await app.close();
    },
  };
  return testApp;
}
