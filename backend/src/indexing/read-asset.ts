import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { duplicateFingerprint } from '../core/duplicates.js';
import { parseGcodeFileName, parseVideoFileName } from '../core/file-names.js';
import { readUrlShortcut } from '../core/url-file.js';
import { classifyAsset, type AssetType } from '../core/files.js';

/** A shortcut is a few hundred bytes; nothing stops someone naming a huge file `.url`. */
const MAX_URL_FILE_BYTES = 64 * 1024;
import { bestThumbnail, readGcodeFile, type GcodeSlot } from '../core/gcode.js';
import { readThreeMf } from '../core/threemf.js';
import type { ScannedFile } from './scanner.js';

/** What the indexer stores for one file, before user decisions are applied. */
export interface AssetReading {
  type: AssetType;
  namePart: string | null;
  nameMaterial: string | null;
  namePrintSeconds: number | null;
  recordedAt: string | null;
  printerPrefix: string | null;
  slicer: string | null;
  hasThumbnail: boolean;
  parseError: string | null;
  /** For a `.url` shortcut: the link inside it (PrintSource, GAP-152). */
  urlTarget: string | null;
  lines: LineReading[];
}

export interface LineReading {
  /** 0 for a G-code file, the plate number for a 3MF plate. */
  plateIndex: number;
  totalGrams: number | null;
  printSeconds: number | null;
  printerModel: string | null;
  material: string | null;
  duplicateFingerprint: string | null;
  slots: GcodeSlot[];
}

export async function readAsset(root: string, file: ScannedFile): Promise<AssetReading> {
  const type = classifyAsset(file.fileName);
  const absolute = path.join(root, file.relativePath);
  const fromName = type === 'gcode' ? parseGcodeFileName(file.fileName) : null;
  const video = type === 'video' ? parseVideoFileName(file.fileName) : null;
  const print = fromName ?? video?.print ?? null;

  const reading: AssetReading = {
    type,
    namePart: print?.partName ?? null,
    nameMaterial: print?.material ?? null,
    namePrintSeconds: print?.printTimeSeconds ?? null,
    recordedAt: video?.recordedAt.toISOString() ?? null,
    printerPrefix: video?.printerPrefix ?? null,
    slicer: null,
    hasThumbnail: false,
    parseError: null,
    urlTarget: null,
    lines: [],
  };

  try {
    if (type === 'url') {
      /*
        A shortcut is a few hundred bytes of INI, so it is read whole. The cap
        is there because nothing stops someone naming a gigabyte `.url`.
      */
      if (file.sizeBytes <= MAX_URL_FILE_BYTES) {
        reading.urlTarget = readUrlShortcut(await readFile(absolute, 'utf8'));
      }
    } else if (type === 'gcode') {
      const meta = await readGcodeFile(absolute);
      reading.slicer = meta.slicer === null ? null : `${meta.slicer.name} ${meta.slicer.version}`;
      reading.hasThumbnail = bestThumbnail(meta.thumbnails) !== null;
      reading.lines = [
        {
          plateIndex: 0,
          totalGrams: meta.totalGrams,
          printSeconds: meta.printTimeSeconds ?? fromName?.printTimeSeconds ?? null,
          printerModel: meta.printerModel,
          material: meta.slots[0]?.material ?? fromName?.material ?? null,
          duplicateFingerprint: duplicateFingerprint({
            sizeBytes: file.sizeBytes,
            totalGrams: meta.totalGrams,
            printTimeSeconds: meta.printTimeSeconds,
            slots: meta.slots,
          }),
          slots: meta.slots,
        },
      ];
    } else if (type === '3mf' || isCrealityProject(file.fileName)) {
      const meta = await readThreeMf(absolute);
      reading.slicer = meta.application;
      reading.hasThumbnail = meta.thumbnail !== null;
      // A .cxprj is listed as Other and never counts; only its image is used.
      if (type === '3mf') {
        reading.lines = meta.plates.map((plate) => ({
          plateIndex: plate.index,
          totalGrams: plate.totalGrams,
          printSeconds: plate.printTimeSeconds,
          printerModel: plate.printerModel,
          material: plate.slots[0]?.material ?? null,
          duplicateFingerprint: null,
          slots: plate.slots,
        }));
      }
    }
  } catch (error) {
    reading.parseError = (error instanceof Error ? error.message : String(error)).slice(0, 1000);
    reading.lines = [];
  }
  return reading;
}

function isCrealityProject(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.cxprj');
}
