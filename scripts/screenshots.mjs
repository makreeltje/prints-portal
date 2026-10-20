#!/usr/bin/env node
/*
 * Screenshots of the main screens: light and dark, phone and desktop.
 *
 *   npm run screenshots
 *
 * Writes <screen>-<theme>-<device>.png (20 files) to SCREENSHOTS_DIR. The
 * screenshots show real customer names when PRINTS_ROOT is a real folder, so
 * the output folder is git-ignored and must never be committed or uploaded.
 * See DEVELOPMENT.md for the environment variables.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const env = process.env;

const outDir = resolve(env.SCREENSHOTS_DIR ?? join(root, '.local/screenshots'));
const executablePath = env.CHROMIUM_PATH ?? '/usr/bin/chromium';
const adminLogin = env.ADMIN_EMAIL ?? 'admin@localhost';
const adminPassword = env.ADMIN_PASSWORD ?? 'development-only';
const backendPort = env.SCREENSHOTS_BACKEND_PORT ?? '18080';
const frontendPort = env.SCREENSHOTS_FRONTEND_PORT ?? '15173';
const externalUrl = env.BASE_URL?.replace(/\/+$/, '');

const SCREENS = [
  { name: 'dashboard', path: () => '/' },
  { name: 'printdetail', path: (printId) => `/prints/${printId}` },
  { name: 'wachtrij', path: () => '/wachtrij' },
  { name: 'facturen', path: () => '/facturen' },
  { name: 'instellingen', path: () => '/instellingen' },
];
const THEMES = ['light', 'dark'];
const DEVICES = [
  { name: 'phone', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  { name: 'desktop', viewport: { width: 1440, height: 900 } },
];

const children = [];
let dataDir;

function start(command, args, extraEnv, cwd = root) {
  const child = spawn(command, args, {
    cwd,
    env: { ...env, ...extraEnv },
    stdio: ['ignore', 'ignore', 'inherit'],
    detached: true, // own process group, so npx and its children can be stopped together
  });
  children.push(child);
  return child;
}

async function waitFor(url, what) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // Not up yet.
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`${what} did not answer on ${url} within 120 s`);
}

function stopAll() {
  for (const child of children) {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      // Already gone.
    }
  }
  if (dataDir && !env.DATA_DIR) rmSync(dataDir, { recursive: true, force: true });
}

async function main() {
  let baseUrl = externalUrl;
  if (!baseUrl) {
    dataDir = env.DATA_DIR ?? mkdtempSync(join(tmpdir(), 'prints-portal-screenshots-'));
    mkdirSync(dataDir, { recursive: true });
    start('npx', ['tsx', 'backend/src/server.ts'], {
      NODE_ENV: 'development',
      PORT: backendPort,
      HOST: '127.0.0.1',
      DATA_DIR: dataDir,
      PRINTS_ROOT: env.PRINTS_ROOT ?? join(root, '.local/prints'),
    });
    await waitFor(`http://127.0.0.1:${backendPort}/healthz`, 'The backend');
    start(
      'npx',
      ['vite', '--port', frontendPort, '--strictPort', '--host', '127.0.0.1'],
      {
        BACKEND_URL: `http://127.0.0.1:${backendPort}`,
      },
      join(root, 'frontend'),
    );
    baseUrl = `http://127.0.0.1:${frontendPort}`;
    await waitFor(baseUrl, 'The frontend');
  }

  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ executablePath });
  let count = 0;
  try {
    for (const device of DEVICES) {
      for (const theme of THEMES) {
        const context = await browser.newContext({
          baseURL: baseUrl,
          viewport: device.viewport,
          isMobile: device.isMobile,
          hasTouch: device.hasTouch,
          colorScheme: theme,
          locale: 'nl-NL',
          timezoneId: 'Europe/Amsterdam',
        });
        // theme.ts reads this key; an explicit choice also sets data-theme.
        await context.addInitScript((value) => {
          window.localStorage.setItem('prints-portal.theme', value);
        }, theme);

        const login = await context.request.post('/api/auth/login', {
          data: { login: adminLogin, password: adminPassword },
        });
        if (!login.ok()) throw new Error(`Sign-in failed (${login.status()}) for ${adminLogin}`);

        const list = await context.request.get('/api/prints?limit=1');
        const printId = (await list.json()).prints?.[0]?.id;
        if (!printId) throw new Error('/api/prints returned no print; is PRINTS_ROOT indexed?');

        const page = await context.newPage();
        for (const screen of SCREENS) {
          await page.goto(screen.path(printId));
          await page.waitForLoadState('networkidle');
          await page.screenshot({
            path: join(outDir, `${screen.name}-${theme}-${device.name}.png`),
          });
          count += 1;
        }
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  console.log(`${count} screenshots in ${outDir}`);
}

process.on('SIGINT', () => {
  stopAll();
  process.exit(130);
});
main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(stopAll);
