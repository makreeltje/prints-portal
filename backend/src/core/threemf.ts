import type { Readable } from 'node:stream';
import yauzl, { type Entry, type ZipFile } from 'yauzl';
import { DEFAULT_WINDOW_BYTES, parseGcodeText, type GcodeSlot } from './gcode.js';
import { normalizeHexColor } from './tags.js';

/**
 * Reads what a 3MF project tells about printing. Verified against
 * BambuStudio/OrcaSlicer project files (usually unsliced), a MakerWorld
 * download sliced in Bambu Studio (plates in Metadata/slice_info.config) and
 * Creality Print 5.1 projects (G-code per plate in Metadata/plate_N.gcode,
 * with an empty and malformed slice_info.config).
 *
 * The archive is streamed: embedded G-code is never held in memory beyond
 * its head and tail windows.
 */
export interface ThreeMfPlate {
  /** Plate number as the slicer shows it (1-based). */
  index: number;
  /** Where the numbers came from: embedded G-code wins over slice_info. */
  source: 'gcode' | 'slice_info';
  totalGrams: number | null;
  printTimeSeconds: number | null;
  slots: GcodeSlot[];
  /** Printer model from the embedded G-code; slice_info only has internal IDs. */
  printerModel: string | null;
  /** Metadata/plate_N.png, when present. */
  thumbnail: Buffer | null;
}

export interface ThreeMfMetadata {
  /** E.g. "BambuStudio-2.3.1" or "Creality_Print V5.1.4.10249 Release". */
  application: string | null;
  /** Sliced plates only, by index. Empty for an unsliced project. */
  plates: ThreeMfPlate[];
  /** Project image: first plate image, else the Bambu/MakerWorld thumbnail. */
  thumbnail: Buffer | null;
}

export class ThreeMfError extends Error {
  override name = 'ThreeMfError';
}

const MAX_TEXT_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MODEL_HEAD_BYTES = 64 * 1024;
/** Tail kept from embedded G-code: generous, since the whole entry is streamed anyway. */
const EMBEDDED_TAIL_BYTES = 256 * 1024;

const PLATE_GCODE = /^Metadata\/plate_(\d+)\.gcode$/i;
const PLATE_IMAGE = /^Metadata\/plate_(\d+)\.png$/i;
const PROJECT_IMAGES = ['Auxiliaries/.thumbnails/thumbnail_3mf.png', 'Metadata/thumbnail.png'];

export function hasSliceData(meta: ThreeMfMetadata): boolean {
  return meta.plates.some((plate) => plate.totalGrams !== null && plate.totalGrams > 0);
}

export async function readThreeMf(filePath: string): Promise<ThreeMfMetadata> {
  let zip: ZipFile;
  try {
    zip = await yauzl.openPromise(filePath, { lazyEntries: true, autoClose: false });
  } catch (error) {
    throw new ThreeMfError(`not a readable 3MF archive: ${describe(error)}`);
  }

  try {
    let sliceInfo: string | null = null;
    let modelHead: string | null = null;
    const gcodePlates = new Map<number, Omit<ThreeMfPlate, 'thumbnail'>>();
    const plateImages = new Map<number, Buffer>();
    const projectImages = new Map<string, Buffer>();

    for await (const entry of zip.eachEntry()) {
      const name = entry.fileName;
      if (name.endsWith('/')) continue;

      if (name.toLowerCase() === 'metadata/slice_info.config') {
        sliceInfo = (await readEntry(zip, entry, MAX_TEXT_BYTES)).toString('utf8');
      } else if (name.toLowerCase() === '3d/3dmodel.model') {
        modelHead = (await readEntry(zip, entry, MODEL_HEAD_BYTES, true)).toString('utf8');
      } else if (PLATE_GCODE.test(name)) {
        const index = Number(PLATE_GCODE.exec(name)?.[1]);
        gcodePlates.set(index, await readEmbeddedGcode(zip, entry, index));
      } else if (PLATE_IMAGE.test(name)) {
        plateImages.set(
          Number(PLATE_IMAGE.exec(name)?.[1]),
          await readEntry(zip, entry, MAX_IMAGE_BYTES),
        );
      } else if (PROJECT_IMAGES.includes(name)) {
        projectImages.set(name, await readEntry(zip, entry, MAX_IMAGE_BYTES));
      }
    }

    const slicePlates = sliceInfo === null ? [] : parseSliceInfo(sliceInfo);
    const byIndex = new Map<number, Omit<ThreeMfPlate, 'thumbnail'>>();
    for (const plate of slicePlates) byIndex.set(plate.index, plate);
    for (const [index, plate] of gcodePlates) byIndex.set(index, plate);

    const plates = [...byIndex.values()]
      .filter((plate) => plate.totalGrams !== null || plate.printTimeSeconds !== null)
      .sort((a, b) => a.index - b.index)
      .map((plate) => ({ ...plate, thumbnail: plateImages.get(plate.index) ?? null }));

    const firstPlateImage = [...plateImages.entries()].sort(([a], [b]) => a - b)[0]?.[1];
    return {
      application: parseApplication(modelHead, sliceInfo),
      plates,
      thumbnail:
        firstPlateImage ??
        PROJECT_IMAGES.map((name) => projectImages.get(name)).find(
          (image) => image !== undefined,
        ) ??
        null,
    };
  } catch (error) {
    if (error instanceof ThreeMfError) throw error;
    throw new ThreeMfError(`could not read 3MF contents: ${describe(error)}`);
  } finally {
    zip.close();
  }
}

/**
 * Bambu-style plate list. The parser is deliberately tolerant: Creality
 * Print writes attributes like `key = "x"/ >`, which is not valid XML.
 */
export function parseSliceInfo(text: string): Omit<ThreeMfPlate, 'thumbnail'>[] {
  const plates: Omit<ThreeMfPlate, 'thumbnail'>[] = [];
  for (const block of text.match(/<plate\b[\s\S]*?<\/plate>/gi) ?? []) {
    const meta = new Map<string, string>();
    for (const tag of block.match(/<metadata\b[^>]*>/gi) ?? []) {
      const attrs = parseAttributes(tag);
      const key = attrs.get('key');
      if (key !== undefined) meta.set(key, attrs.get('value') ?? '');
    }
    const index = Number(meta.get('index'));
    if (!Number.isInteger(index) || index < 1) continue;

    const slots: GcodeSlot[] = [];
    for (const tag of block.match(/<filament\b[^>]*>/gi) ?? []) {
      const attrs = parseAttributes(tag);
      const grams = Number(attrs.get('used_g'));
      const slot = Number(attrs.get('id'));
      if (!Number.isFinite(grams) || grams <= 0 || !Number.isInteger(slot)) continue;
      slots.push({
        slot,
        grams,
        colour: normalizeHexColor(attrs.get('color')),
        material: attrs.get('type') ?? null,
      });
    }

    const weight = Number(meta.get('weight'));
    const prediction = Number(meta.get('prediction'));
    plates.push({
      index,
      source: 'slice_info',
      totalGrams: Number.isFinite(weight) && weight > 0 ? weight : null,
      printTimeSeconds:
        Number.isFinite(prediction) && prediction > 0 ? Math.round(prediction) : null,
      slots,
      printerModel: null,
    });
  }
  return plates;
}

function parseAttributes(tag: string): Map<string, string> {
  const attrs = new Map<string, string>();
  for (const match of tag.matchAll(/([A-Za-z_][\w-]*)\s*=\s*"([^"]*)"/g)) {
    if (match[1] !== undefined) attrs.set(match[1], decodeXmlEntities(match[2] ?? ''));
  }
  return attrs;
}

function parseApplication(modelHead: string | null, sliceInfo: string | null): string | null {
  // OrcaSlicer writes Application="BambuStudio-…" plus its own version tag; prefer the latter.
  const orcaModel = modelHead?.match(/<metadata\s+name\s*=\s*"OrcaSlicer"\s*>([^<]*)</i)?.[1];
  if (orcaModel !== undefined && orcaModel.trim() !== '') return `OrcaSlicer ${orcaModel.trim()}`;
  const fromModel = modelHead?.match(/<metadata\s+name\s*=\s*"Application"\s*>([^<]*)</i)?.[1];
  if (fromModel !== undefined && fromModel.trim() !== '')
    return decodeXmlEntities(fromModel.trim());
  const header = sliceInfo === null ? new Map<string, string>() : headerItems(sliceInfo);
  const creality = header.get('X-CX-Client-Version');
  if (creality !== undefined && creality !== '') return `Creality_Print ${creality}`;
  const orca = header.get('OrcaSlicer-Version');
  if (orca !== undefined && orca !== '') return `OrcaSlicer ${orca}`;
  return null;
}

function headerItems(sliceInfo: string): Map<string, string> {
  const items = new Map<string, string>();
  for (const tag of sliceInfo.match(/<header_item\b[^>]*>/gi) ?? []) {
    const attrs = parseAttributes(tag);
    const key = attrs.get('key');
    if (key !== undefined) items.set(key, attrs.get('value') ?? '');
  }
  return items;
}

async function readEmbeddedGcode(
  zip: ZipFile,
  entry: Entry,
  index: number,
): Promise<Omit<ThreeMfPlate, 'thumbnail'>> {
  const stream = await zip.openReadStreamPromise(entry);
  let head = Buffer.alloc(0);
  let tail = Buffer.alloc(0);
  let total = 0;
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    total += chunk.length;
    if (head.length < DEFAULT_WINDOW_BYTES) {
      head = Buffer.concat([head, chunk.subarray(0, DEFAULT_WINDOW_BYTES - head.length)]);
    }
    tail = Buffer.concat([tail, chunk]);
    if (tail.length > EMBEDDED_TAIL_BYTES) tail = tail.subarray(tail.length - EMBEDDED_TAIL_BYTES);
  }

  const whole = total <= DEFAULT_WINDOW_BYTES + EMBEDDED_TAIL_BYTES;
  const meta = whole
    ? parseGcodeText({ head: tail.toString('utf8'), tail: '' })
    : parseGcodeText({
        head: head.toString('utf8').replace(/\n[^\n]*$/, ''),
        tail: tail.toString('utf8').replace(/^[^\n]*\n/, ''),
      });
  return {
    index,
    source: 'gcode',
    totalGrams: meta.totalGrams,
    printTimeSeconds: meta.printTimeSeconds,
    slots: meta.slots,
    printerModel: meta.printerModel,
  };
}

/** Reads an entry up to `limit` bytes; beyond that it fails, or truncates when `truncate` is set. */
async function readEntry(
  zip: ZipFile,
  entry: Entry,
  limit: number,
  truncate = false,
): Promise<Buffer> {
  if (!truncate && entry.uncompressedSize > limit) {
    throw new ThreeMfError(`${entry.fileName} is larger than ${limit} bytes`);
  }
  const stream: Readable = await zip.openReadStreamPromise(entry);
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    chunks.push(chunk);
    size += chunk.length;
    if (size >= limit) {
      stream.destroy();
      break;
    }
  }
  return Buffer.concat(chunks).subarray(0, limit);
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
