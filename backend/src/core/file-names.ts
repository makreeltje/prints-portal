import { parseCompactDuration } from './duration.js';
import { isValidLocalDateTime, zonedTimeToUtc } from './time.js';

/**
 * File-name conventions (brief §2.3 plus what the owner's library contains):
 *
 *   G-code     <partName>_<material>_<time>[copy suffix].gcode
 *   Timelapse  <printerPrefix>_<partName>_<material>_<time>.gcode_<dd-MM-yyyy>_<HH>h<mm>[ (n)].mp4|mkv
 *   Timelapse  <unix seconds>[ (n)].mp4|mkv   (older camera recordings)
 *
 * A name that does not match is not an error; it just yields no metadata.
 */
export interface NameMetadata {
  partName: string;
  /** As written in the name, e.g. "PLA", "PLA-CF". */
  material: string;
  printTimeSeconds: number;
}

export interface VideoNameMetadata {
  printerPrefix: string | null;
  /** Null when only the recording time could be read. */
  print: NameMetadata | null;
  recordedAt: Date;
}

// Time is XhYmZs with each part optional but at least one present; it must end in a unit.
const TIME = String.raw`(?=\d)(?:\d+d)?(?:\d+h)?(?:\d+m)?(?:\d+s)?(?<=[dhms])`;
// What people (or the OS) append when copying a file: _2, -2, " 2", " - 2", 2, (1), " copy 2", " - Copy".
const COPY_SUFFIX = String.raw`(?:_\d+|-\d+| \d+| - \d+|\d+| ?\(\d+\)| copy(?: \d+)?| - copy(?: \d+)?)?`;
const PRINT_STEM = new RegExp(
  String.raw`^(?<part>.+)_(?<material>[A-Za-z][A-Za-z0-9-]*)_(?<time>${TIME})${COPY_SUFFIX}$`,
  'i',
);
const TIMELAPSE = new RegExp(
  String.raw`^(?<prefix>[A-Za-z0-9]+)_(?<stem>.+)\.gcode_(?<day>\d{2})-(?<month>\d{2})-(?<year>\d{4})_(?<hour>\d{2})h(?<minute>\d{2})(?: \(\d+\))?\.(?:mp4|mkv)$`,
  'i',
);
const UNIX_TIMESTAMP_VIDEO = /^(?<seconds>\d{10})(?: \(\d+\))?\.(?:mp4|mkv)$/i;

/** Plausible range for camera timestamps, so random 10-digit names are not read as dates. */
const EARLIEST_RECORDING = Date.UTC(2015, 0, 1);
const LATEST_RECORDING = Date.UTC(2100, 0, 1);

export function parseGcodeFileName(fileName: string): NameMetadata | null {
  const stem = /^(.*)\.gcode$/i.exec(fileName)?.[1];
  return stem === undefined ? null : parsePrintStem(stem);
}

/** Parses `<partName>_<material>_<time>` with an optional copy suffix. */
export function parsePrintStem(stem: string): NameMetadata | null {
  const groups = PRINT_STEM.exec(stem)?.groups;
  if (groups === undefined) return null;
  const { part, material, time } = groups;
  if (part === undefined || material === undefined || time === undefined) return null;
  const printTimeSeconds = parseCompactDuration(time);
  if (printTimeSeconds === null) return null;
  return { partName: part.trim(), material, printTimeSeconds };
}

export function parseVideoFileName(fileName: string): VideoNameMetadata | null {
  const timelapse = TIMELAPSE.exec(fileName)?.groups;
  if (timelapse !== undefined) {
    const { prefix, stem, day, month, year, hour, minute } = timelapse;
    const local = {
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: Number(hour),
      minute: Number(minute),
    };
    if (prefix !== undefined && stem !== undefined && isValidLocalDateTime(local)) {
      return {
        printerPrefix: prefix,
        print: parsePrintStem(stem),
        recordedAt: zonedTimeToUtc(local),
      };
    }
  }

  const seconds = UNIX_TIMESTAMP_VIDEO.exec(fileName)?.groups?.seconds;
  if (seconds !== undefined) {
    const ms = Number(seconds) * 1000;
    if (ms >= EARLIEST_RECORDING && ms < LATEST_RECORDING) {
      return { printerPrefix: null, print: null, recordedAt: new Date(ms) };
    }
  }
  return null;
}
