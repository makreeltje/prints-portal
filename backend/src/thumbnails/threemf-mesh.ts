import yauzl, { type Entry, type ZipFile } from 'yauzl';
import type { Readable } from 'node:stream';
import { MAX_RENDER_TRIANGLES, type StlMesh } from './stl.js';

/**
 * The mesh inside a 3MF, so a model file that carries no slicer plate image
 * can still show a picture of itself.
 *
 * 95 of this library's 376 model files are 3MF, and only those the slicer gave
 * a plate image had anything to show; the rest fell back to a type glyph while
 * every STL beside them had a render (GAP-094). The geometry is in the archive
 * either way — this reads it and hands the same triangle list the STL renderer
 * already takes.
 *
 * It is a focused scanner, not an XML parser: `<vertex>` and `<triangle>` are
 * attribute-only tags and a mesh can hold millions of them, so a general
 * parser would cost far more than the render. Anything it does not understand
 * makes it give up and return null, and the caller falls back to the glyph.
 */

export class ThreeMfMeshError extends Error {
  override name = 'ThreeMfMeshError';
}

/** The model XML of a large assembly; beyond this we do not try. */
const MAX_MODEL_BYTES = 192 * 1024 * 1024;
/** 3MF splits a model over several parts; this bounds how many we read. */
const MAX_MODEL_PARTS = 64;

interface RawObject {
  /** 3 floats per vertex. */
  vertices: number[];
  /** 3 indices per triangle. */
  indices: number[];
  /** Nested objects: [objectid, 12-value transform or null]. */
  components: [string, Float64Array | null][];
}

/**
 * Read every mesh the archive's build places, as one triangle list.
 *
 * Returns null when the archive holds no geometry we can read — an unsliced
 * project with only a reference to something else, or a part we do not parse.
 */
export async function readThreeMfMesh(filePath: string): Promise<StlMesh | null> {
  let zip: ZipFile;
  try {
    zip = await yauzl.openPromise(filePath, { lazyEntries: true, autoClose: false });
  } catch (error) {
    throw new ThreeMfMeshError(`not a readable 3MF archive: ${describe(error)}`);
  }
  try {
    const parts: string[] = [];
    for await (const entry of zip.eachEntry()) {
      const name = entry.fileName;
      if (name.endsWith('/')) continue;
      const lower = name.toLowerCase();
      // The root model, plus the per-object parts Bambu and Orca split out.
      if (lower === '3d/3dmodel.model' || (lower.startsWith('3d/') && lower.endsWith('.model'))) {
        if (parts.length >= MAX_MODEL_PARTS) break;
        parts.push((await readEntry(zip, entry, MAX_MODEL_BYTES)).toString('utf8'));
      }
    }
    if (parts.length === 0) return null;

    const objects = new Map<string, RawObject>();
    const build: [string, Float64Array | null][] = [];
    for (const xml of parts) {
      collect(xml, objects, build);
    }
    // No build section (a bare parts file): place every object once.
    const items = build.length > 0 ? build : [...objects.keys()].map((id) => [id, null] as const);

    const out: number[] = [];
    for (const [id, transform] of items) {
      emit(objects, id, transform, out, new Set());
      if (out.length / 9 > MAX_RENDER_TRIANGLES) break;
    }
    if (out.length === 0) return null;
    return { vertices: Float32Array.from(out), triangleCount: out.length / 9 };
  } finally {
    zip.close();
  }
}

/** Objects and build items of one model part. */
function collect(
  xml: string,
  objects: Map<string, RawObject>,
  build: [string, Float64Array | null][],
): void {
  for (const match of xml.matchAll(/<object\b([^>]*)>([\s\S]*?)<\/object>/g)) {
    const id = attribute(match[1] ?? '', 'id');
    if (id === null) continue;
    const body = match[2] ?? '';
    objects.set(id, {
      vertices: numbers(body, /<vertex\b([^>]*)\/?>/g, ['x', 'y', 'z']),
      indices: numbers(body, /<triangle\b([^>]*)\/?>/g, ['v1', 'v2', 'v3']),
      components: [...body.matchAll(/<component\b([^>]*)\/?>/g)].flatMap((c) => {
        const ref = attribute(c[1] ?? '', 'objectid');
        return ref === null
          ? []
          : [[ref, matrix(attribute(c[1] ?? '', 'transform'))] as [string, Float64Array | null]];
      }),
    });
  }
  const section = /<build\b[^>]*>([\s\S]*?)<\/build>/.exec(xml)?.[1] ?? '';
  for (const item of section.matchAll(/<item\b([^>]*)\/?>/g)) {
    const ref = attribute(item[1] ?? '', 'objectid');
    if (ref !== null) build.push([ref, matrix(attribute(item[1] ?? '', 'transform'))]);
  }
}

/** One object's triangles, transformed into place, components included. */
function emit(
  objects: Map<string, RawObject>,
  id: string,
  transform: Float64Array | null,
  out: number[],
  seen: Set<string>,
): void {
  // A 3MF may not reference itself; a corrupt one might.
  if (seen.has(id)) return;
  const object = objects.get(id);
  if (object === undefined) return;
  seen.add(id);
  const { vertices, indices } = object;
  for (let i = 0; i + 2 < indices.length; i += 3) {
    for (let corner = 0; corner < 3; corner++) {
      const v = (indices[i + corner] ?? 0) * 3;
      const x = vertices[v] ?? 0;
      const y = vertices[v + 1] ?? 0;
      const z = vertices[v + 2] ?? 0;
      if (transform === null) {
        out.push(x, y, z);
      } else {
        out.push(
          x * (transform[0] ?? 0) +
            y * (transform[3] ?? 0) +
            z * (transform[6] ?? 0) +
            (transform[9] ?? 0),
          x * (transform[1] ?? 0) +
            y * (transform[4] ?? 0) +
            z * (transform[7] ?? 0) +
            (transform[10] ?? 0),
          x * (transform[2] ?? 0) +
            y * (transform[5] ?? 0) +
            z * (transform[8] ?? 0) +
            (transform[11] ?? 0),
        );
      }
    }
    if (out.length / 9 > MAX_RENDER_TRIANGLES) break;
  }
  for (const [ref, own] of object.components) {
    emit(objects, ref, compose(transform, own), out, seen);
  }
  seen.delete(id);
}

/** `a b c d e f g h i j k l`: a 3x3 basis followed by a translation. */
function matrix(value: string | null): Float64Array | null {
  if (value === null) return null;
  const parts = value.trim().split(/\s+/).map(Number);
  if (parts.length !== 12 || parts.some((n) => !Number.isFinite(n))) return null;
  return Float64Array.from(parts);
}

function compose(outer: Float64Array | null, inner: Float64Array | null): Float64Array | null {
  if (outer === null) return inner;
  if (inner === null) return outer;
  const m = new Float64Array(12);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      let sum = row === 3 ? (outer[9 + col] ?? 0) : 0;
      for (let k = 0; k < 3; k++) {
        sum += (inner[row * 3 + k] ?? 0) * (outer[k * 3 + col] ?? 0);
      }
      m[row * 3 + col] = sum;
    }
  }
  return m;
}

/** Every value of the named attributes, in document order. */
function numbers(body: string, tag: RegExp, names: readonly string[]): number[] {
  const out: number[] = [];
  for (const match of body.matchAll(tag)) {
    const attributes = match[1] ?? '';
    for (const name of names) out.push(Number(attribute(attributes, name) ?? 0));
  }
  return out;
}

function attribute(attributes: string, name: string): string | null {
  const match = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`).exec(attributes);
  return match?.[1] ?? null;
}

async function readEntry(zip: ZipFile, entry: Entry, limit: number): Promise<Buffer> {
  if (entry.uncompressedSize > limit) {
    throw new ThreeMfMeshError(`${entry.fileName} is larger than ${limit} bytes`);
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

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
