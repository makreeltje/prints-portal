import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatDuration,
  formatEnergy,
  formatGrams,
  formatMoney,
} from '../../src/core/format.js';

// Intl uses a no-break space between € and the amount; compare with plain spaces.
const plain = (text: string) => text.replaceAll('\u00a0', ' ');

describe('nl-NL formats from the design system', () => {
  it.each([
    [1234.56, '€ 1.234,56'],
    [2.3, '€ 2,30'],
    [11.89, '€ 11,89'],
    [0, '€ 0,00'],
    [-56.67, '€ -56,67'],
  ])('money %s → %s', (amount, text) => {
    expect(plain(formatMoney(amount))).toBe(text);
  });

  it.each([
    ['2026-10-05T10:00:00Z', '5 okt 2026'],
    ['2026-03-01T00:30:00Z', '1 mrt 2026'],
    // 23:30 UTC on 31 December is already 1 January in Amsterdam.
    ['2025-12-31T23:30:00Z', '1 jan 2026'],
  ])('date %s → %s', (iso, text) => {
    expect(formatDate(new Date(iso))).toBe(text);
  });

  it.each([
    [4800, '1 u 20 min'],
    [2220, '37 min'],
    [7200, '2 u'],
    [45, '45 s'],
    [5731, '1 u 36 min'],
    [93_784, '26 u 3 min'],
  ])('duration %s s → %s', (seconds, text) => {
    expect(formatDuration(seconds)).toBe(text);
  });

  it('weights and energy', () => {
    expect(formatGrams(87)).toBe('87 g');
    expect(formatGrams(1.37)).toBe('1,37 g');
    expect(formatGrams(1234.5)).toBe('1.234,5 g');
    expect(formatEnergy(0.42)).toBe('0,42 kWh');
    expect(formatEnergy(1.195)).toBe('1,195 kWh');
  });
});
