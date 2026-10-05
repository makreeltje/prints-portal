/**
 * Prints what the parsers read from print files, one JSON object per file.
 *
 *   npm run inspect -- <file or folder> [...]                 (development)
 *   node backend/dist/cli/inspect.js <file or folder> [...]   (in the image)
 *
 * Folders are walked recursively with the indexer's ignore rules.
 */
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { parseGcodeFileName, parseVideoFileName } from '../core/file-names.js';
import { classifyAsset, isIgnoredPath } from '../core/files.js';
import { bestThumbnail, readGcodeFile } from '../core/gcode.js';
import { DEFAULT_PRINTER_PROFILES, matchPrinter, matchVideoPrefix } from '../core/printers.js';
import { hasSliceData, readThreeMf } from '../core/threemf.js';

async function inspectFile(filePath: string): Promise<Record<string, unknown>> {
  const fileName = path.basename(filePath);
  const type = classifyAsset(fileName);
  const base: Record<string, unknown> = { file: filePath, type };

  try {
    base.sizeBytes = (await stat(filePath)).size;
    if (type === 'gcode') {
      const meta = await readGcodeFile(filePath);
      const thumbnail = bestThumbnail(meta.thumbnails);
      return {
        ...base,
        fromName: parseGcodeFileName(fileName),
        slicer: meta.slicer,
        totalGrams: meta.totalGrams,
        printTimeSeconds: meta.printTimeSeconds,
        printerModel: meta.printerModel,
        printerProfile: matchPrinter(meta.printerModel, DEFAULT_PRINTER_PROFILES)?.key ?? null,
        slots: meta.slots,
        thumbnail: thumbnail && {
          format: thumbnail.format,
          width: thumbnail.width,
          height: thumbnail.height,
          bytes: thumbnail.data.length,
        },
      };
    }
    if (type === '3mf' || fileName.toLowerCase().endsWith('.cxprj')) {
      const meta = await readThreeMf(filePath);
      return {
        ...base,
        application: meta.application,
        sliced: hasSliceData(meta),
        plates: meta.plates.map(({ thumbnail, ...plate }) => ({
          ...plate,
          printerProfile: matchPrinter(plate.printerModel, DEFAULT_PRINTER_PROFILES)?.key ?? null,
          thumbnailBytes: thumbnail?.length ?? null,
        })),
        thumbnailBytes: meta.thumbnail?.length ?? null,
      };
    }
    if (type === 'video') {
      const meta = parseVideoFileName(fileName);
      return {
        ...base,
        fromName: meta && {
          ...meta,
          recordedAt: meta.recordedAt.toISOString(),
          printerProfile:
            matchVideoPrefix(meta.printerPrefix, DEFAULT_PRINTER_PROFILES)?.key ?? null,
        },
      };
    }
    return base;
  } catch (error) {
    return { ...base, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Yields files; an unreadable path is yielded as-is so it is reported, not fatal. */
async function* walk(target: string, root: string): AsyncGenerator<string> {
  let entries;
  try {
    if (!(await stat(target)).isDirectory()) {
      yield target;
      return;
    }
    entries = await readdir(target, { withFileTypes: true });
  } catch {
    yield target;
    return;
  }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(target, entry.name);
    if (isIgnoredPath(path.relative(root, full))) continue;
    if (entry.isDirectory()) yield* walk(full, root);
    else if (entry.isFile()) yield full;
  }
}

async function main(args: string[]): Promise<number> {
  if (args.length === 0) {
    console.error('usage: inspect <file or folder> [...]');
    return 2;
  }
  for (const arg of args) {
    const target = path.resolve(arg);
    for await (const file of walk(target, target)) {
      console.log(JSON.stringify(await inspectFile(file)));
    }
  }
  return 0;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);
