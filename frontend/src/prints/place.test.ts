import { describe, expect, it } from 'vitest';
import { placeOf, squashName } from './filter';

/**
 * GAP-072: the line under a print's name says where it lives, and drops the
 * project when the project only repeats the name the heading already shows.
 */
describe('placeOf', () => {
  const print = (projectFolder: string | null, name: string) => ({
    customerFolder: 'Joey',
    projectFolder,
    name,
  });

  it('names the klant alone when the project repeats the print name', () => {
    expect(placeOf(print('Babybox locks', 'Babybox locks'))).toBe('Joey');
  });

  it('ignores case, spaces and punctuation when comparing', () => {
    expect(placeOf(print('babybox-locks', 'Babybox locks'))).toBe('Joey');
    expect(placeOf(print('Babybox_Locks ', 'babybox locks'))).toBe('Joey');
  });

  it('keeps a project that says something the name does not', () => {
    expect(placeOf(print('Kerstversiering 2026', 'Babybox locks'))).toBe(
      'Joey / Kerstversiering 2026',
    );
  });

  it('names the klant alone for a print directly under the customer', () => {
    expect(placeOf(print(null, 'Babybox locks'))).toBe('Joey');
  });

  it('treats an empty project as no project', () => {
    expect(placeOf(print('', 'Babybox locks'))).toBe('Joey');
  });

  it('does not collapse two different names to the same squash', () => {
    expect(squashName('Azul')).not.toBe(squashName('Azul 2'));
  });
});
