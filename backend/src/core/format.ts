import { APP_TIME_ZONE } from './time.js';

/**
 * nl-NL display formats from design-system/README.md (Content fundamentals):
 *   money € 1.234,56 · dates 5 okt 2026 · durations 1 u 20 min · 87 g · 0,42 kWh
 * Month abbreviations are spelled out here because locale data differs
 * between runtimes (some write "okt.").
 */
const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

const money = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const decimals = (min: number, max: number) =>
  new Intl.NumberFormat('nl-NL', { minimumFractionDigits: min, maximumFractionDigits: max });
const grams = decimals(0, 2);
const kwh = decimals(0, 3);

const dateParts = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

/** € 1.234,56 (negative: € -56,67). */
export function formatMoney(amount: number): string {
  return money.format(amount);
}

/** 5 okt 2026, in the app time zone. */
export function formatDate(date: Date): string {
  const parts = Object.fromEntries(
    dateParts.formatToParts(date).map((part) => [part.type, part.value]),
  );
  const month = MONTHS[Number(parts.month) - 1] ?? '';
  return `${parts.day ?? ''} ${month} ${parts.year ?? ''}`;
}

/** 1 u 20 min · 37 min · 2 u · 45 s (rounded to whole minutes from one minute up). */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds < 60) return `${seconds} s`;
  const minutesTotal = Math.round(seconds / 60);
  const hours = Math.floor(minutesTotal / 60);
  const minutes = minutesTotal % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} u` : `${hours} u ${minutes} min`;
}

/** 87 g · 1,37 g */
export function formatGrams(value: number): string {
  return `${grams.format(value)} g`;
}

/** 0,42 kWh */
export function formatEnergy(value: number): string {
  return `${kwh.format(value)} kWh`;
}
