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
const money = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const twoDecimals = decimals(2, 2);
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

/** € 1.234,56 · € -11,89 (MoneyDisplay) */
export function formatMoney(amount: number): string {
  return money.format(amount);
}

/** 1.234,56 without the € (for copy that has its own € sign). */
export function formatAmount(amount: number): string {
  return twoDecimals.format(amount);
}

/** 11,89 for an input field (no symbol; the € sits in the affix). */
export function formatAmountInput(amount: number): string {
  return twoDecimals.format(amount).replace(/\./g, '');
}

/**
 * Reads what someone typed as an amount: "11,89", "11.89", "1.234,56" or
 * "€ 5". Null when it is not a number.
 */
export function parseAmount(text: string): number | null {
  let value = text.replace(/[€\s]/g, '');
  if (value === '') return null;
  if (value.includes(',')) value = value.replace(/\./g, '').replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(value)) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
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
