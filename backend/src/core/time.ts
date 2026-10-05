/** Display and business time zone (decision: Europe/Amsterdam; UTC is stored). */
export const APP_TIME_ZONE = 'Europe/Amsterdam';

export interface LocalDateTime {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second?: number;
}

/** True when the parts form a real calendar date and time. */
export function isValidLocalDateTime(t: LocalDateTime): boolean {
  const probe = new Date(Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second ?? 0));
  return (
    probe.getUTCFullYear() === t.year &&
    probe.getUTCMonth() === t.month - 1 &&
    probe.getUTCDate() === t.day &&
    probe.getUTCHours() === t.hour &&
    probe.getUTCMinutes() === t.minute
  );
}

/**
 * Converts a wall-clock time in `timeZone` to a UTC Date, using the zone's
 * offset at that moment (handles daylight saving time). For the hour that
 * does not exist in spring, the result is shifted forward like most clocks.
 */
export function zonedTimeToUtc(t: LocalDateTime, timeZone: string = APP_TIME_ZONE): Date {
  const asUtc = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second ?? 0);
  let guess = asUtc - offsetMs(new Date(asUtc), timeZone);
  // A second pass settles cases where the offset changes between guess and target.
  guess = asUtc - offsetMs(new Date(guess), timeZone);
  return new Date(guess);
}

const formatters = new Map<string, Intl.DateTimeFormat>();

/** Offset of `timeZone` from UTC at `date`, in milliseconds. */
function offsetMs(date: Date, timeZone: string): number {
  let formatter = formatters.get(timeZone);
  if (formatter === undefined) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, formatter);
  }
  const parts: Record<string, number> = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value);
  }
  const wallClock = Date.UTC(
    parts.year ?? 0,
    (parts.month ?? 1) - 1,
    parts.day ?? 1,
    parts.hour ?? 0,
    parts.minute ?? 0,
    parts.second ?? 0,
  );
  return wallClock - (date.getTime() - date.getUTCMilliseconds());
}
