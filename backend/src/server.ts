import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildApp } from './app.js';
import { ConfigError, loadConfig, type AppConfig } from './config/config.js';
import { createDatabase } from './db/connection.js';

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

  const db = await createDatabase(config.database);
  const app = await buildApp({ config, db, logger: { level: config.logLevel } });

  const shutdown = (signal: string): void => {
    app.log.info({ signal }, 'shutting down');
    app.close().then(
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
}

main().catch((error: unknown) => {
  console.error('Startup failed:', error);
  process.exit(1);
});
