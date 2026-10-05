import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { bestThumbnail, readGcodeFile } from '../core/gcode.js';
import { resolveExistingWithinRoot } from '../core/paths.js';
import { readThreeMf } from '../core/threemf.js';
import type { AppDatabase } from '../db/connection.js';
import type { AssetType } from '../core/files.js';
import { parseStl, renderStl } from './stl.js';

/**
 * Preview image per print, in this order (plan, "Thumbnail order"):
 *   1. an image embedded in a G-code file (newest first),
 *   2. a 3MF plate or project image,
 *   3. an STL rendered on the server, in the colour of the print's first slot,
 *   4. the image inside a Creality .cxprj project.
 * Embedded slicer images are served as they are: the slicer already drew them
 * in the filament colours. Results are cached on disk per print, keyed by the
 * source file (size and date) and the colour, so a changed file or colour
 * makes a new image. When the files are gone (archived print) the last
 * cached image is still served.
 */
export interface Thumbnail {
  data: Buffer;
  contentType: 'image/png' | 'image/jpeg';
  /** Strong validator for HTTP caching. */
  etag: string;
}

export interface ThumbnailLogger {
  warn(obj: object, msg: string): void;
}

/** Bump when the renderer changes, so cached STL renders are made again. */
const RENDER_VERSION = 1;
const STL_SIZE = { width: 480, height: 360 };
/** STL files above this are not rendered (memory). */
const MAX_STL_BYTES = 256 * 1024 * 1024;

interface Candidate {
  assetId: string;
  relativePath: string;
  fileName: string;
  type: AssetType;
  sizeBytes: number;
  lastWriteUtc: string;
  kind: 'gcode' | '3mf' | 'stl' | 'cxprj';
}

const ORDER: Candidate['kind'][] = ['gcode', '3mf', 'stl', 'cxprj'];

export class ThumbnailService {
  private readonly inFlight = new Map<string, Promise<Thumbnail | null>>();

  constructor(
    private readonly options: {
      db: AppDatabase;
      printsRoot: string;
      cacheDir: string;
      logger?: ThumbnailLogger;
    },
  ) {}

  /** The preview for a print, or null when there is none. */
  async get(recordId: string): Promise<Thumbnail | null> {
    const [candidates, colour] = await Promise.all([
      this.candidates(recordId),
      this.firstSlotColour(recordId),
    ]);
    for (const candidate of candidates) {
      const key = cacheKey(candidate, candidate.kind === 'stl' ? colour : null);
      const cached = await this.readCache(recordId, key);
      if (cached !== null) return cached;
      const made = await this.once(`${recordId}/${key}`, () =>
        this.make(recordId, key, candidate, colour),
      );
      if (made !== null) return made;
    }
    // No usable source (e.g. archived: the files are gone): last image made for this print.
    return this.latestCached(recordId);
  }

  private async candidates(recordId: string): Promise<Candidate[]> {
    const rows = await this.options.db
      .selectFrom('print_assets')
      .select([
        'id',
        'relative_path',
        'file_name',
        'type',
        'size_bytes',
        'last_write_utc',
        'has_thumbnail',
      ])
      .where('print_record_id', '=', recordId)
      .execute();
    const candidates: Candidate[] = [];
    for (const row of rows) {
      const isCxprj = row.file_name.toLowerCase().endsWith('.cxprj');
      const kind: Candidate['kind'] | null =
        row.type === 'gcode' && row.has_thumbnail === 1
          ? 'gcode'
          : row.type === '3mf' && row.has_thumbnail === 1
            ? '3mf'
            : row.type === 'stl'
              ? 'stl'
              : isCxprj && row.has_thumbnail === 1
                ? 'cxprj'
                : null;
      if (kind === null) continue;
      candidates.push({
        assetId: row.id,
        relativePath: row.relative_path,
        fileName: row.file_name,
        type: row.type,
        sizeBytes: row.size_bytes,
        lastWriteUtc: row.last_write_utc,
        kind,
      });
    }
    return candidates.sort(
      (a, b) =>
        ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind) ||
        b.lastWriteUtc.localeCompare(a.lastWriteUtc) ||
        a.fileName.localeCompare(b.fileName),
    );
  }

  /** Slicer colour of the first used slot of the newest counted line (tint rule, SpoolSwatch). */
  private async firstSlotColour(recordId: string): Promise<string | null> {
    const row = await this.options.db
      .selectFrom('line_slots as s')
      .innerJoin('print_lines as l', 'l.id', 's.line_id')
      .innerJoin('print_assets as a', 'a.id', 'l.asset_id')
      .select('s.colour')
      .where('a.print_record_id', '=', recordId)
      .where('s.colour', 'is not', null)
      .where((eb) =>
        eb.or([
          eb('l.user_excluded', '=', 0),
          eb.and([eb('l.user_excluded', 'is', null), eb('l.auto_excluded', '=', 0)]),
        ]),
      )
      .orderBy('a.last_write_utc', 'desc')
      .orderBy('l.plate_index')
      .orderBy('s.slot')
      .executeTakeFirst();
    return row?.colour ?? null;
  }

  private async make(
    recordId: string,
    key: string,
    candidate: Candidate,
    colour: string | null,
  ): Promise<Thumbnail | null> {
    let absolute: string;
    try {
      absolute = await resolveExistingWithinRoot(this.options.printsRoot, candidate.relativePath);
    } catch {
      return null; // gone, or outside the root
    }
    try {
      let image: { data: Buffer; contentType: Thumbnail['contentType'] } | null = null;
      if (candidate.kind === 'gcode') {
        const best = bestThumbnail((await readGcodeFile(absolute)).thumbnails);
        if (best !== null) {
          image = {
            data: best.data,
            contentType: best.format === 'jpg' ? 'image/jpeg' : 'image/png',
          };
        }
      } else if (candidate.kind === '3mf' || candidate.kind === 'cxprj') {
        const meta = await readThreeMf(absolute);
        const data = meta.thumbnail;
        if (data !== null) image = { data, contentType: 'image/png' };
      } else {
        const info = await stat(absolute);
        if (info.size <= MAX_STL_BYTES) {
          const mesh = parseStl(await readFile(absolute));
          image = { data: renderStl(mesh, { ...STL_SIZE, colour }), contentType: 'image/png' };
        }
      }
      if (image === null) return null;
      await this.writeCache(recordId, key, image);
      return { ...image, etag: `"${key}"` };
    } catch (error) {
      this.options.logger?.warn(
        { err: error, file: candidate.relativePath },
        'could not make a thumbnail',
      );
      return null;
    }
  }

  private recordDir(recordId: string): string {
    // Record ids are UUIDs made by the app; never user input in a path.
    if (!/^[0-9a-f-]{36}$/i.test(recordId)) throw new Error('invalid record id');
    return path.join(this.options.cacheDir, recordId);
  }

  private async readCache(recordId: string, key: string): Promise<Thumbnail | null> {
    for (const [extension, contentType] of EXTENSIONS) {
      try {
        const data = await readFile(path.join(this.recordDir(recordId), `${key}.${extension}`));
        return { data, contentType, etag: `"${key}"` };
      } catch {
        // not cached in this format
      }
    }
    return null;
  }

  private async latestCached(recordId: string): Promise<Thumbnail | null> {
    let names: string[];
    try {
      names = await readdir(this.recordDir(recordId));
    } catch {
      return null;
    }
    const files = await Promise.all(
      names
        .filter((name) => /\.(png|jpg)$/.test(name))
        .map(async (name) => ({
          name,
          mtime: (await stat(path.join(this.recordDir(recordId), name))).mtimeMs,
        })),
    );
    const newest = files.sort((a, b) => b.mtime - a.mtime)[0];
    if (newest === undefined) return null;
    const [key = '', extension] = newest.name.split('.');
    return {
      data: await readFile(path.join(this.recordDir(recordId), newest.name)),
      contentType: extension === 'jpg' ? 'image/jpeg' : 'image/png',
      etag: `"${key}"`,
    };
  }

  private async writeCache(
    recordId: string,
    key: string,
    image: { data: Buffer; contentType: Thumbnail['contentType'] },
  ): Promise<void> {
    const dir = this.recordDir(recordId);
    await mkdir(dir, { recursive: true });
    const extension = image.contentType === 'image/jpeg' ? 'jpg' : 'png';
    const target = path.join(dir, `${key}.${extension}`);
    // Write then rename, so a reader never sees half a file.
    const temporary = `${target}.${String(process.pid)}.tmp`;
    await writeFile(temporary, image.data);
    await rename(temporary, target);
    // Older images of this print are no longer needed.
    for (const name of await readdir(dir)) {
      if (!name.startsWith(key)) await rm(path.join(dir, name), { force: true });
    }
  }

  /** One build per key at a time; concurrent requests share it. */
  private once(key: string, build: () => Promise<Thumbnail | null>): Promise<Thumbnail | null> {
    const running = this.inFlight.get(key);
    if (running !== undefined) return running;
    const promise = build().finally(() => {
      this.inFlight.delete(key);
    });
    this.inFlight.set(key, promise);
    return promise;
  }
}

const EXTENSIONS: [string, Thumbnail['contentType']][] = [
  ['png', 'image/png'],
  ['jpg', 'image/jpeg'],
];

function cacheKey(candidate: Candidate, colour: string | null): string {
  return createHash('sha256')
    .update(
      [
        RENDER_VERSION,
        candidate.assetId,
        candidate.sizeBytes,
        candidate.lastWriteUtc,
        colour ?? '',
      ].join('|'),
    )
    .digest('hex')
    .slice(0, 32);
}
