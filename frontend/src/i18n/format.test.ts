import { describe, expect, it } from 'vitest';
import {
  formatAmountInput,
  formatDate,
  formatDuration,
  formatFileSize,
  formatGrams,
  formatMoney,
  parseAmount,
} from './format';

describe('nl-NL formats', () => {
  it.each([
    [45, '45 s'],
    [60, '1 min'],
    [2220, '37 min'],
    [4800, '1 u 20 min'],
    [7200, '2 u'],
  ])('duration %s s → %s', (seconds, text) => {
    expect(formatDuration(seconds)).toBe(text);
  });

  it('formats grams, dates in Amsterdam and file sizes', () => {
    expect(formatGrams(87)).toBe('87 g');
    expect(formatGrams(3.031)).toBe('3,03 g');
    expect(formatDate('2026-10-04T23:30:00.000Z')).toBe('5 okt 2026');
    expect(formatFileSize(812)).toBe('812 B');
    expect(formatFileSize(2_400_000)).toBe('2,4 MB');
    expect(formatFileSize(4_600)).toBe('4,6 kB');
  });

  it('formats and reads money the Dutch way', () => {
    expect(formatMoney(1234.56).replace(/\s/g, ' ')).toBe('€ 1.234,56');
    expect(formatMoney(-11.89).replace(/\s/g, ' ')).toBe('€ -11,89');
    expect(formatAmountInput(1234.5)).toBe('1234,50');
    expect(parseAmount('11,89')).toBe(11.89);
    expect(parseAmount('€ 1.234,56')).toBe(1234.56);
    expect(parseAmount('11.89')).toBe(11.89);
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('')).toBeNull();
  });
});
