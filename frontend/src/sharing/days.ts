const localDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Amsterdam',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Whole calendar days (Europe/Amsterdam) from `from` to `to`; negative when `to` is earlier. */
export function calendarDays(from: Date, to: Date | string): number {
  const start = Date.parse(`${localDay.format(from)}T00:00:00Z`);
  const end = Date.parse(`${localDay.format(new Date(to))}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}
