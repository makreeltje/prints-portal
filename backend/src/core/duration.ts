/**
 * Durations as whole seconds. Two notations occur in print files:
 *   compact, in file names:        1h20m, 37m0s, 2h, 1d2h
 *   spaced, in slicer comments:    1d 2h 3m 4s, 37m 0s
 */
const UNIT_SECONDS = { d: 86_400, h: 3_600, m: 60, s: 1 } as const;

const COMPACT = /^(?=\d)(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i;
const SPACED = /^(?=\d)(?:(\d+)d\s*)?(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s)?$/i;

/** Parses "1h20m" (no spaces). Returns null for anything else, including "". */
export function parseCompactDuration(text: string): number | null {
  return fromMatch(COMPACT.exec(text.trim()));
}

/** Parses slicer notation "1d 2h 3m 4s" (spaces optional). */
export function parseSpacedDuration(text: string): number | null {
  return fromMatch(SPACED.exec(text.trim()));
}

function fromMatch(match: RegExpExecArray | null): number | null {
  if (match === null) return null;
  const [, d, h, m, s] = match;
  return (
    toInt(d) * UNIT_SECONDS.d +
    toInt(h) * UNIT_SECONDS.h +
    toInt(m) * UNIT_SECONDS.m +
    toInt(s) * UNIT_SECONDS.s
  );
}

function toInt(part: string | undefined): number {
  return part === undefined ? 0 : Number.parseInt(part, 10);
}
