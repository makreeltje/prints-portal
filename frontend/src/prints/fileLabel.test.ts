import { describe, expect, it } from 'vitest';
import { splitName, stemForRow } from './fileLabel';

/** What the row actually renders, with CSS's cut modelled by the window. */
const rendered = (name: string, stem: number) => {
  const { head, tail } = splitName(name, stem);
  if (tail === '') return head;
  const room = Math.max(2, 15 - 1 - tail.length);
  return `${head.slice(0, room)}…${tail}`;
};

describe('file labels in a row', () => {
  it('leaves a name that fits alone', () => {
    expect(splitName('cube.stl', 3)).toEqual({ head: 'cube.stl', tail: '' });
  });

  it('keeps the extension and three stem characters', () => {
    expect(splitName('Bloembak_deksel_links.stl', 3).tail).toBe('nks.stl');
  });

  it('separates an enumerated family through the tail', () => {
    const names = ['Onderdeel_01_links.stl', 'Onderdeel_06_links.stl'];
    const stem = stemForRow(names);
    const labels = names.map((n) => rendered(n, stem));
    expect(new Set(labels).size).toBe(2);
    // The difference is in the tail, so the tail is what grew.
    expect(stem).toBeGreaterThan(3);
  });

  it('separates a difference near the front by giving the tail back', () => {
    const names = ['obj_2_card divider.stl', 'obj_7_card divider.stl'];
    const stem = stemForRow(names);
    expect(new Set(names.map((n) => rendered(n, stem))).size).toBe(2);
  });

  it('gives up honestly where the difference is in the blind zone', () => {
    // The number sits at index 20 of 38: no tail reaches it and no head does.
    const names = [
      'Bloembak clip corner 20 inner width.stl',
      'Bloembak clip corner 21 inner width.stl',
    ];
    const stem = stemForRow(names);
    expect(stem).toBe(3); // the default, not a wild search
    expect(new Set(names.map((n) => rendered(n, stem))).size).toBe(1);
  });

  it('does not pretend two identical names differ', () => {
    const names = ['Bloembak clip corner 2.stl', 'Bloembak clip corner 2.stl'];
    expect(stemForRow(names)).toBe(3);
  });

  it('never cuts into the extension and never starves the head', () => {
    for (const stem of [0, 3, 8, 12]) {
      const { head, tail } = splitName('Bloembak clip corner 20 inner width.stl', stem);
      expect(tail.endsWith('.stl')).toBe(true);
      expect(head.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('leaves a row of distinct short names at the default', () => {
    expect(stemForRow(['Basic.stl', 'Layers.stl', 'Lines.stl'])).toBe(3);
  });
});
