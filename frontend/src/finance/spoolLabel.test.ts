import { describe, expect, it } from 'vitest';
import { splitSpoolName } from './spoolLabel';

describe('where a spool name is cut (GAP-163)', () => {
  it('keeps the last word as the tail that never shrinks', () => {
    expect(splitSpoolName('Creality Rainbow Wild Blossom Hyper')).toEqual({
      head: 'Creality Rainbow Wild Blossom ',
      tail: 'Hyper',
    });
  });

  it('keeps the separating space on the head, so the whole name still reads', () => {
    const { head, tail } = splitSpoolName('Bambu PLA Basic Zwart');
    expect(`${head}${tail}`).toBe('Bambu PLA Basic Zwart');
  });

  it('leaves a one-word name alone: there is no second end to keep', () => {
    expect(splitSpoolName('PETG')).toEqual({ head: 'PETG', tail: '' });
  });

  it('ignores a trailing space rather than making the tail empty', () => {
    expect(splitSpoolName('Creality Hyper ')).toEqual({ head: 'Creality ', tail: 'Hyper ' });
  });
});
