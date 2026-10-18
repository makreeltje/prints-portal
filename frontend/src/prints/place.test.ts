import { describe, expect, it } from 'vitest';
import { placeOf, squashName } from './filter';

/**
 * GAP-072: the line under a print's name says where it lives, and drops the
 * project when the project only repeats the name the heading already shows.
 */
describe('placeOf', () => {
  const print = (projectFolder: string | null, name: string) => ({
    customerFolder: 'Koen',
    projectFolder,
    name,
  });

  it('names the klant alone when the project repeats the print name', () => {
    expect(placeOf(print('Bloembak clips', 'Bloembak clips'))).toBe('Koen');
  });

  it('ignores case, spaces and punctuation when comparing', () => {
    expect(placeOf(print('bloembak-clips', 'Bloembak clips'))).toBe('Koen');
    expect(placeOf(print('Bloembak_Clips ', 'bloembak clips'))).toBe('Koen');
  });

  it('keeps a project that says something the name does not', () => {
    expect(placeOf(print('Kerstversiering 2026', 'Bloembak clips'))).toBe(
      'Koen / Kerstversiering 2026',
    );
  });

  it('names the klant alone for a print directly under the customer', () => {
    expect(placeOf(print(null, 'Bloembak clips'))).toBe('Koen');
  });

  it('treats an empty project as no project', () => {
    expect(placeOf(print('', 'Bloembak clips'))).toBe('Koen');
  });

  it('does not collapse two different names to the same squash', () => {
    expect(squashName('Wiel')).not.toBe(squashName('Wiel 2'));
  });
});
