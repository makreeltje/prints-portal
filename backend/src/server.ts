import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildApp } from './app.js';
import { BootstrapError, ensureBootstrapAdmin } from './auth/bootstrap.js';
import { ConfigError, loadConfig, type AppConfig } from './config/config.js';
import { checkDataDir } from './config/data-dir.js';
import { createDatabase } from './db/connection.js';
import { migrateToLatest } from './db/migrate.js';
import { PrintsWatcher } from './indexing/watcher.js';

/** The built SPA sits next to the backend in the repo and in the image: <root>/frontend/dist. */
const defaultStaticDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../frontend/dist',
);

async function main(): Promise<void> {
  let config: AppConfig;
  try {
    config = loadConfig(process.env, { staticDir: defaultStaticDir });
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error(error.message);
      process.exit(1);
    }
    throw error;
  }

  const dataDirProblem = await checkDataDir(config.dataDir);

  // Migrations run before anything listens; a failure stops the app loudly.
  const db = await createDatabase(config.database);
  const app = await buildApp({ config, db, logger: { level: config.logLevel } });
  for (const warning of config.warnings) app.log.warn(warning);
  if (dataDirProblem !== null) app.log.warn(dataDirProblem);
  const applied = await migrateToLatest(db);
  if (applied.length > 0) app.log.info({ migrations: applied }, 'database migrated');
  try {
    await ensureBootstrapAdmin(db, config, app.log);
  } catch (error) {
    if (error instanceof BootstrapError) {
      app.log.fatal(error.message);
      await app.close();
      process.exit(1);
    }
    throw error;
  }

  const { indexer } = app.services;
  const watcher = config.indexing.watch
    ? new PrintsWatcher({
        root: config.printsRoot,
        indexer,
        debounceMs: config.indexing.debounceMs,
        usePolling: config.indexing.polling,
        pollIntervalMs: config.indexing.pollIntervalMs,
        logger: app.log,
      })
    : null;

  const shutdown = (signal: string): void => {
    app.log.info({ signal }, 'shutting down');
    (async () => {
      await watcher?.close();
      await indexer.idle();
      await app.close();
    })().then(
      () => process.exit(0),
      (error: unknown) => {
        app.log.error({ err: error }, 'error during shutdown');
        process.exit(1);
      },
    );
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);

  await app.listen({ host: config.host, port: config.port });
  app.log.info(
    {
      environment: config.environment,
      dialect: config.database.dialect,
      printsRoot: config.printsRoot,
    },
    'prints portal started',
  );

  // The watcher starts first so nothing changed during the initial scan is missed;
  // both go through the indexer's queue.
  try {
    await watcher?.start();
    if (watcher !== null)
      app.log.info({ polling: config.indexing.polling }, 'watching prints folder');
  } catch (error) {
    app.log.warn(
      { err: error },
      'could not watch the prints folder; changes are picked up at the next start',
    );
  }
  if (config.indexing.onStartup) {
    indexer.indexAll().catch((error: unknown) => {
      app.log.error({ err: error }, 'initial index failed');
    });
  }
}

main().catch((error: unknown) => {
  console.error('Startup failed:', error);
  process.exit(1);
});
