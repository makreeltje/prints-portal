import path from 'node:path';
import { watch, type FSWatcher } from 'chokidar';
import { isIgnoredPath } from '../core/files.js';
import type { Indexer, IndexerLogger } from './indexer.js';
import type { ProjectRef } from './scanner.js';

/**
 * Watches the prints folder and re-indexes only what changed, after a quiet
 * period per print (default 2 s), so a slicer writing a large file or a sync
 * client copying a folder triggers one run instead of hundreds.
 *
 *   <customer>/<project>/…   → that project
 *   <customer>/<file>        → the customer's print without project
 *   <customer> folder added/removed → every print of that customer
 */
export interface WatcherOptions {
  root: string;
  indexer: Indexer;
  debounceMs: number;
  /** Polling for file systems without change events (some network mounts). */
  usePolling?: boolean;
  pollIntervalMs?: number;
  ignorePatterns?: readonly string[];
  logger?: IndexerLogger;
}

type Target = { kind: 'project'; ref: ProjectRef } | { kind: 'customer'; customerFolder: string };

export class PrintsWatcher {
  private watcher: FSWatcher | null = null;
  private readonly timers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly options: WatcherOptions) {}

  async start(): Promise<void> {
    const { root, usePolling = false, pollIntervalMs = 5000 } = this.options;
    const watcher = watch(root, {
      ignoreInitial: true,
      persistent: true,
      usePolling,
      interval: pollIntervalMs,
      binaryInterval: pollIntervalMs,
      ignored: (absolute) => {
        const relative = path.relative(root, absolute);
        return relative !== '' && isIgnoredPath(relative, this.options.ignorePatterns);
      },
    });
    watcher.on('all', (event, absolute) => {
      this.handle(event, absolute);
    });
    watcher.on('error', (error) => {
      this.options.logger?.warn({ err: error }, 'file watcher error');
    });
    await new Promise<void>((resolve) => {
      watcher.once('ready', () => {
        resolve();
      });
    });
    this.watcher = watcher;
  }

  async close(): Promise<void> {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    await this.watcher?.close();
    this.watcher = null;
  }

  private handle(event: string, absolute: string): void {
    const target = targetFor(event, path.relative(this.options.root, absolute));
    if (target === null) return;
    const key =
      target.kind === 'customer'
        ? `customer:${target.customerFolder}`
        : `project:${target.ref.customerFolder}/${target.ref.projectFolder ?? ''}`;

    const pending = this.timers.get(key);
    if (pending !== undefined) clearTimeout(pending);
    this.timers.set(
      key,
      setTimeout(() => {
        this.timers.delete(key);
        this.run(target);
      }, this.options.debounceMs),
    );
  }

  private run(target: Target): void {
    const { indexer, logger } = this.options;
    const work =
      target.kind === 'customer'
        ? indexer.indexCustomer(target.customerFolder)
        : indexer.indexProject(target.ref);
    work.then(
      (summary) => {
        const { created, updated, archived } = summary;
        if (created + updated + archived > 0) {
          logger?.info({ target, created, updated, archived }, 'indexed after a file change');
        }
      },
      (error: unknown) => {
        logger?.warn({ err: error, target }, 'indexing after a file change failed');
      },
    );
  }
}

/** Maps a chokidar event on a path (relative to the root) to the print(s) to re-index. */
export function targetFor(event: string, relative: string): Target | null {
  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) return null;
  const segments = relative.split(path.sep).filter((s) => s !== '');
  const [customerFolder, second] = segments;
  if (customerFolder === undefined) return null;

  if (segments.length === 1) {
    // Files directly in the root belong to no customer.
    return event === 'addDir' || event === 'unlinkDir'
      ? { kind: 'customer', customerFolder }
      : null;
  }
  if (segments.length === 2 && second !== undefined) {
    const isDirectory = event === 'addDir' || event === 'unlinkDir';
    return {
      kind: 'project',
      ref: { customerFolder, projectFolder: isDirectory ? second : null },
    };
  }
  return { kind: 'project', ref: { customerFolder, projectFolder: second ?? null } };
}
