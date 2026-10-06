import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { parseStl, renderStl, StlError } from '../../src/thumbnails/stl.js';

function binaryStl(triangles: number[][]): Buffer {
  const data = Buffer.alloc(84 + triangles.length * 50);
  data.writeUInt32LE(triangles.length, 80);
  triangles.forEach((tri, i) => {
    tri.forEach((value, k) => data.writeFloatLE(value, 84 + i * 50 + 12 + k * 4));
  });
  return data;
}

const pyramid = [
  [0, 0, 0, 10, 0, 0, 5, 5, 10],
  [10, 0, 0, 10, 10, 0, 5, 5, 10],
  [10, 10, 0, 0, 10, 0, 5, 5, 10],
  [0, 10, 0, 0, 0, 0, 5, 5, 10],
];

describe('STL rasteriser', () => {
  it('parses binary and ASCII STL', () => {
    expect(parseStl(binaryStl(pyramid)).triangleCount).toBe(4);
    const ascii =
      'solid x\nfacet normal 0 0 1\nouter loop\nvertex 0 0 0\nvertex 1 0 0\nvertex 0 1 0\nendloop\nendfacet\nendsolid x\n';
    expect(parseStl(Buffer.from(ascii)).triangleCount).toBe(1);
    expect(() => parseStl(Buffer.from('hello'))).toThrow(StlError);
  });

  it('renders a PNG of the requested size in the model colour on a transparent ground', () => {
    const png = PNG.sync.read(
      renderStl(parseStl(binaryStl(pyramid)), { width: 120, height: 90, colour: '#ff0000' }),
    );
    expect([png.width, png.height]).toEqual([120, 90]);
    expect(png.data[3]).toBe(0); // corner pixel is transparent
    let red = 0;
    for (let i = 0; i < png.data.length; i += 4) {
      const [r = 0, g = 0, b = 0, a = 0] = png.data.subarray(i, i + 4);
      if (a === 255 && r > 0 && g === 0 && b === 0) red++;
    }
    expect(red).toBeGreaterThan(500);
  });
});
