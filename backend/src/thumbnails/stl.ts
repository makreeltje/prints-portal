import { PNG } from 'pngjs';

/**
 * A small software rasteriser for STL previews: orthographic three-quarter
 * view from above, flat shading with two-sided lighting, z-buffer and 2×
 * supersampling. Output is a PNG with a transparent background, so the UI's
 * own surface shows behind the model.
 */
export interface StlMesh {
  /** 9 floats per triangle: x1 y1 z1 x2 y2 z2 x3 y3 z3. */
  vertices: Float32Array;
  triangleCount: number;
}

export class StlError extends Error {
  override name = 'StlError';
}

/** Above this the mesh is sampled (every n-th triangle) to bound render time. */
export const MAX_RENDER_TRIANGLES = 1_500_000;

export function parseStl(data: Buffer): StlMesh {
  if (data.length >= 84) {
    const count = data.readUInt32LE(80);
    if (84 + count * 50 === data.length) return parseBinary(data, count);
  }
  const head = data.subarray(0, Math.min(data.length, 512)).toString('latin1').trimStart();
  if (head.startsWith('solid')) return parseAscii(data.toString('latin1'));
  throw new StlError('not an STL file');
}

function parseBinary(data: Buffer, count: number): StlMesh {
  const stride = Math.max(1, Math.ceil(count / MAX_RENDER_TRIANGLES));
  const kept = Math.ceil(count / stride);
  const vertices = new Float32Array(kept * 9);
  let out = 0;
  for (let i = 0; i < count; i += stride) {
    const base = 84 + i * 50 + 12; // skip the stored normal; it is often wrong
    for (let k = 0; k < 9; k++) vertices[out++] = data.readFloatLE(base + k * 4);
  }
  return { vertices: vertices.subarray(0, out), triangleCount: out / 9 };
}

function parseAscii(text: string): StlMesh {
  const values: number[] = [];
  const vertex = /vertex\s+(\S+)\s+(\S+)\s+(\S+)/g;
  for (let match = vertex.exec(text); match !== null; match = vertex.exec(text)) {
    values.push(Number(match[1]), Number(match[2]), Number(match[3]));
  }
  const usable = values.length - (values.length % 9);
  if (usable === 0) throw new StlError('STL has no triangles');
  const triangles = usable / 9;
  const stride = Math.max(1, Math.ceil(triangles / MAX_RENDER_TRIANGLES));
  const vertices = new Float32Array(Math.ceil(triangles / stride) * 9);
  let out = 0;
  for (let t = 0; t < triangles; t += stride) {
    for (let k = 0; k < 9; k++) vertices[out++] = values[t * 9 + k] ?? 0;
  }
  return { vertices: vertices.subarray(0, out), triangleCount: out / 9 };
}

export interface RenderOptions {
  width: number;
  height: number;
  /** Model colour as #rrggbb; null renders a neutral grey. */
  colour: string | null;
}

/** Neutral model colour when the slicer reported none. */
const NEUTRAL: [number, number, number] = [176, 180, 192];
const SUPERSAMPLE = 2;
/** View: turned 45° around the vertical axis, camera 35° above the horizon. */
const YAW = (-45 * Math.PI) / 180;
const ELEVATION = (35 * Math.PI) / 180;
/** Light from the upper left front, in view space. */
const LIGHT = normalize([-0.4, 0.6, 0.7]);
const AMBIENT = 0.32;

export function renderStl(mesh: StlMesh, options: RenderOptions): Buffer {
  if (mesh.triangleCount === 0) throw new StlError('STL has no triangles');
  const w = options.width * SUPERSAMPLE;
  const h = options.height * SUPERSAMPLE;
  const base = parseColour(options.colour) ?? NEUTRAL;

  // Rotate into view space (z towards the viewer).
  const cy = Math.cos(YAW);
  const sy = Math.sin(YAW);
  const ce = Math.cos(ELEVATION);
  const se = Math.sin(ELEVATION);
  const v = mesh.vertices;
  const view = new Float32Array(v.length);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < v.length; i += 3) {
    const x = v[i] ?? 0;
    const y = v[i + 1] ?? 0;
    const z = v[i + 2] ?? 0;
    // Yaw around Z (STL is Z-up); the camera looks along +y1 from above.
    const x1 = x * cy - y * sy;
    const y1 = x * sy + y * cy;
    const vx = x1;
    // Screen up: height, plus distance (farther points sit higher on screen).
    const vz = z * ce + y1 * se;
    // Depth towards the viewer: nearer (smaller y1) and higher points are closer.
    const depthTowardsViewer = -y1 * ce + z * se;
    view[i] = vx;
    view[i + 1] = vz;
    view[i + 2] = depthTowardsViewer;
    minX = Math.min(minX, vx);
    maxX = Math.max(maxX, vx);
    minY = Math.min(minY, vz);
    maxY = Math.max(maxY, vz);
  }
  const margin = 0.08;
  const scale = Math.min(
    (w * (1 - 2 * margin)) / Math.max(maxX - minX, 1e-6),
    (h * (1 - 2 * margin)) / Math.max(maxY - minY, 1e-6),
  );
  const offsetX = w / 2 - ((minX + maxX) / 2) * scale;
  const offsetY = h / 2 + ((minY + maxY) / 2) * scale;

  const depth = new Float32Array(w * h).fill(-Infinity);
  const shade = new Float32Array(w * h).fill(-1);

  for (let t = 0; t < view.length; t += 9) {
    const ax = (view[t] ?? 0) * scale + offsetX;
    const ay = offsetY - (view[t + 1] ?? 0) * scale;
    const az = view[t + 2] ?? 0;
    const bx = (view[t + 3] ?? 0) * scale + offsetX;
    const by = offsetY - (view[t + 4] ?? 0) * scale;
    const bz = view[t + 5] ?? 0;
    const qx = (view[t + 6] ?? 0) * scale + offsetX;
    const qy = offsetY - (view[t + 7] ?? 0) * scale;
    const qz = view[t + 8] ?? 0;

    // Face normal in view space (y up), for lighting.
    const ux = (view[t + 3] ?? 0) - (view[t] ?? 0);
    const uy = (view[t + 4] ?? 0) - (view[t + 1] ?? 0);
    const uz = bz - az;
    const wx = (view[t + 6] ?? 0) - (view[t] ?? 0);
    const wy = (view[t + 7] ?? 0) - (view[t + 1] ?? 0);
    const wz = qz - az;
    const n = normalize([uy * wz - uz * wy, uz * wx - ux * wz, ux * wy - uy * wx]);
    const light =
      AMBIENT + (1 - AMBIENT) * Math.abs(n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);

    const area = (bx - ax) * (qy - ay) - (by - ay) * (qx - ax);
    if (Math.abs(area) < 1e-9) continue;
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx, qx)));
    const x1 = Math.min(w - 1, Math.ceil(Math.max(ax, bx, qx)));
    const y0 = Math.max(0, Math.floor(Math.min(ay, by, qy)));
    const y1 = Math.min(h - 1, Math.ceil(Math.max(ay, by, qy)));
    for (let py = y0; py <= y1; py++) {
      const sy2 = py + 0.5;
      for (let px = x0; px <= x1; px++) {
        const sx = px + 0.5;
        const e0 = ((bx - sx) * (qy - sy2) - (by - sy2) * (qx - sx)) / area;
        const e1 = ((qx - sx) * (ay - sy2) - (qy - sy2) * (ax - sx)) / area;
        const e2 = 1 - e0 - e1;
        if (e0 < 0 || e1 < 0 || e2 < 0) continue;
        const z = e0 * az + e1 * bz + e2 * qz;
        const index = py * w + px;
        if (z <= (depth[index] ?? -Infinity)) continue;
        depth[index] = z;
        shade[index] = light;
      }
    }
  }

  // Downsample the supersampled buffer into the PNG.
  const png = new PNG({ width: options.width, height: options.height });
  const samples = SUPERSAMPLE * SUPERSAMPLE;
  for (let y = 0; y < options.height; y++) {
    for (let x = 0; x < options.width; x++) {
      let covered = 0;
      let light = 0;
      for (let dy = 0; dy < SUPERSAMPLE; dy++) {
        for (let dx = 0; dx < SUPERSAMPLE; dx++) {
          const s = shade[(y * SUPERSAMPLE + dy) * w + x * SUPERSAMPLE + dx] ?? -1;
          if (s >= 0) {
            covered++;
            light += s;
          }
        }
      }
      const o = (y * options.width + x) * 4;
      if (covered === 0) {
        png.data[o + 3] = 0;
        continue;
      }
      const l = light / covered;
      png.data[o] = Math.min(255, Math.round(base[0] * l));
      png.data[o + 1] = Math.min(255, Math.round(base[1] * l));
      png.data[o + 2] = Math.min(255, Math.round(base[2] * l));
      png.data[o + 3] = Math.round((covered / samples) * 255);
    }
  }
  return PNG.sync.write(png);
}

function parseColour(hex: string | null): [number, number, number] | null {
  if (hex === null) return null;
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (match?.[1] === undefined) return null;
  const n = parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function normalize(v: [number, number, number]): [number, number, number] {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}
