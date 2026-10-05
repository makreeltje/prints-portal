/**
 * nl-NL display formats from design-system/README.md (Content fundamentals):
 *   € 1.234,56 · 5 okt 2026 · 1 u 20 min · 87 g · 2,4 MB
 * Same rules as backend/src/core/format.ts (documents and PDFs); both are
 * tested. Dates show in Europe/Amsterdam whatever the browser's zone.
 */
const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const TIME_ZONE = 'Europe/Amsterdam';

const decimals = (min: number, max: number) =>
  new Intl.NumberFormat('nl-NL', { minimumFractionDigits: min, maximumFractionDigits: max });
const grams = decimals(0, 2);
const oneDecimal = decimals(0, 1);
const dateParts = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

/** 5 okt 2026 */
export function formatDate(value: string | Date): string {
  const parts = Object.fromEntries(
    dateParts.formatToParts(new Date(value)).map((part) => [part.type, part.value]),
  );
  return `${parts.day ?? ''} ${MONTHS[Number(parts.month) - 1] ?? ''} ${parts.year ?? ''}`;
}

/** 1 u 20 min · 37 min · 2 u · 45 s */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds < 60) return `${String(seconds)} s`;
  const minutesTotal = Math.round(seconds / 60);
  const hours = Math.floor(minutesTotal / 60);
  const minutes = minutesTotal % 60;
  if (hours === 0) return `${String(minutes)} min`;
  return minutes === 0 ? `${String(hours)} u` : `${String(hours)} u ${String(minutes)} min`;
}

/** 87 g · 3,03 g */
export function formatGrams(value: number): string {
  return `${grams.format(value)} g`;
}

/** 812 B · 4,6 kB · 2,4 MB · 1,2 GB (decimal units, like the file managers people know). */
export function formatFileSize(bytes: number): string {
  if (bytes < 1000) return `${String(bytes)} B`;
  const units = ['kB', 'MB', 'GB', 'TB'];
  let value = bytes / 1000;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit++;
  }
  return `${oneDecimal.format(value)} ${units[unit] ?? ''}`;
}
