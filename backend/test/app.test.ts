import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config/config.js';
import { createDatabase } from '../src/db/connection.js';
import { TEST_SESSION_SECRET } from './helpers/app.js';

let tempDir: string;
let app: FastifyInstance | undefined;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), 'prints-portal-test-'));
});

afterEach(async () => {
  await app?.close();
  app = undefined;
  await rm(tempDir, { recursive: true, force: true });
});

async function start(env: Record<string, string>): Promise<FastifyInstance> {
  const config = loadConfig({
    NODE_ENV: 'test',
    DATA_DIR: tempDir,
    SESSION_SECRET: TEST_SESSION_SECRET,
    ...env,
  });
  const db = await createDatabase(config.database);
  app = await buildApp({ config, db });
  return app;
}

describe('GET /healthz', () => {
  it('reports ok when the database and prints root are reachable', async () => {
    const server = await start({ PRINTS_ROOT: tempDir });
    const response = await server.inject({ method: 'GET', url: '/healthz' });
    expect(response.statusCode).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.json()).toEqual({
      status: 'ok',
      checks: { database: { status: 'up' }, printsRoot: { status: 'up' } },
    });
  });

  it('reports degraded but stays 200 when the prints root is missing', async () => {
    const server = await start({ PRINTS_ROOT: path.join(tempDir, 'does-not-exist') });
    const response = await server.inject({ method: 'GET', url: '/healthz' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'degraded',
      checks: { printsRoot: { status: 'down' } },
    });
  });

  it('returns 503 when the database is unreachable', async () => {
    // Port 1 on localhost refuses connections immediately.
    const server = await start({
      PRINTS_ROOT: tempDir,
      DATABASE_URL: 'postgres://portal:portal@127.0.0.1:1/portal',
    });
    const response = await server.inject({ method: 'GET', url: '/healthz' });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({
      status: 'error',
      checks: { database: { status: 'down' } },
    });
  });

  it('does not leak error details', async () => {
    const server = await start({ PRINTS_ROOT: path.join(tempDir, 'secret-folder') });
    const response = await server.inject({ method: 'GET', url: '/healthz' });
    expect(response.body).not.toContain('secret-folder');
  });
});

describe('SPA hosting', () => {
  it('serves index.html for client-side routes and keeps API paths JSON', async () => {
    const staticDir = path.join(tempDir, 'dist');
    await mkdir(staticDir);
    await writeFile(path.join(staticDir, 'index.html'), '<!doctype html><title>test</title>');
    const server = await start({ PRINTS_ROOT: tempDir, STATIC_DIR: staticDir });

    const page = await server.inject({
      method: 'GET',
      url: '/openstaand',
      headers: { accept: 'text/html' },
    });
    expect(page.statusCode).toBe(200);
    expect(page.headers['content-type']).toContain('text/html');
    expect(page.body).toContain('<title>test</title>');

    // Anonymous callers cannot probe which API paths exist.
    const api = await server.inject({ method: 'GET', url: '/api/unknown' });
    expect(api.statusCode).toBe(401);
    expect(api.json()).toEqual({ error: 'unauthorized' });

    const asset = await server.inject({
      method: 'GET',
      url: '/missing.js',
      headers: { accept: 'text/html' },
    });
    expect(asset.statusCode).toBe(404);
  });

  it('serves only the API when no frontend build exists', async () => {
    const server = await start({ PRINTS_ROOT: tempDir, STATIC_DIR: path.join(tempDir, 'none') });
    const response = await server.inject({
      method: 'GET',
      url: '/',
      headers: { accept: 'text/html' },
    });
    expect(response.statusCode).toBe(404);
  });
});
