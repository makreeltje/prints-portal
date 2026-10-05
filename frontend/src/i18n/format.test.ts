import { describe, expect, it } from 'vitest';
import { formatDate, formatDuration, formatFileSize, formatGrams } from './format';

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
});
