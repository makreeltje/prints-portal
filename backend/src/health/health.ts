import { constants } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import { pingDatabase, type AppDatabase } from '../db/connection.js';

export type CheckStatus = 'up' | 'down';

export interface HealthReport {
  /** ok: everything up; degraded: optional parts down; error: the database is down. */
  status: 'ok' | 'degraded' | 'error';
  checks: {
    database: { status: CheckStatus };
    printsRoot: { status: CheckStatus };
  };
}

export interface HealthDependencies {
  db: AppDatabase;
  printsRoot: string;
  /** Receives failure details; the public response carries statuses only. */
  onProblem?: (check: string, error: unknown) => void;
}

export async function checkHealth(deps: HealthDependencies): Promise<HealthReport> {
  const [database, printsRoot] = await Promise.all([
    checkDatabase(deps),
    checkPrintsRoot(deps.printsRoot, deps.onProblem),
  ]);

  const status = database === 'down' ? 'error' : printsRoot === 'down' ? 'degraded' : 'ok';
  return { status, checks: { database: { status: database }, printsRoot: { status: printsRoot } } };
}

async function checkDatabase({ db, onProblem }: HealthDependencies): Promise<CheckStatus> {
  try {
    if (await pingDatabase(db)) return 'up';
    onProblem?.('database', new Error('database did not answer in time'));
  } catch (error) {
    onProblem?.('database', error);
  }
  return 'down';
}

async function checkPrintsRoot(
  printsRoot: string,
  onProblem: HealthDependencies['onProblem'],
): Promise<CheckStatus> {
  try {
    const info = await stat(printsRoot);
    if (!info.isDirectory()) throw new Error(`${printsRoot} is not a directory`);
    await access(printsRoot, constants.R_OK | constants.X_OK);
    return 'up';
  } catch (error) {
    onProblem?.('printsRoot', error);
    return 'down';
  }
}
