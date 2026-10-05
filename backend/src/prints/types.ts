import type { AssetType } from '../core/files.js';
import type { RecordStatus } from '../db/schema.js';

/** What every role may see of a tag. */
export interface TagDto {
  id: string;
  name: string;
  /** #rrggbb or null (chip without colour). */
  colour: string | null;
  /** Chip text colour for `colour` (TagChip: whichever has the higher contrast); null without colour. */
  ink: string | null;
}

/** One print in a list (dashboard card or row). */
export interface PrintSummary {
  id: string;
  name: string;
  customerFolder: string;
  projectFolder: string | null;
  material: string | null;
  printSeconds: number | null;
  grams: number | null;
  printDate: string | null;
  discoveredAt: string;
  status: RecordStatus;
  deletedAt: string | null;
  tags: TagDto[];
  /** False when no file can give a preview image. */
  hasThumbnail: boolean;
  /**
   * Tint for the thumbnail and 3D model (SpoolSwatch tint rule): the slicer
   * colour of the first used slot of the newest counted file; spools (M6) will
   * come first. Null: no tint.
   */
  colour: string | null;
  /** Changes whenever the print changes; part of thumbnail URLs for cache busting. */
  version: string;
}

export interface SlotDto {
  slot: number;
  grams: number;
  colour: string | null;
  material: string | null;
}

/** A counted unit: a G-code file, or one plate of a sliced 3MF. */
export interface LineDto {
  id: string;
  plateIndex: number;
  grams: number | null;
  printSeconds: number | null;
  material: string | null;
  printerModel: string | null;
  /** Effective: the user's choice, else the automatic rule. */
  excluded: boolean;
  /** "folder:<name>" or "gcode-present" when the exclusion is automatic and not overridden. */
  autoExclusionReason: string | null;
  timesPrinted: number;
  possibleDuplicate: boolean;
  /** Another file in this print with the same fingerprint. */
  duplicateOf: string | null;
  slots: SlotDto[];
}

export interface AssetDto {
  id: string;
  fileName: string;
  /** Folders between the project and the file ("" at the top). */
  subPath: string;
  type: AssetType;
  sizeBytes: number;
  lastWriteUtc: string;
  recordedAt: string | null;
  parseError: string | null;
  lines: LineDto[];
}

/**
 * One print in full. Users (customer logins) get the summary plus `hasModel`
 * only: no files, downloads or counting details (owner decision for M5).
 */
export interface PrintDetail extends PrintSummary {
  printerModel: string | null;
  archivedAt: string | null;
  /** A model file exists for the 3D viewer (STL, else 3MF). */
  hasModel: boolean;
  /** Null for Users. */
  assets: AssetDto[] | null;
}

export interface CustomerSummary {
  folder: string;
  /** Prints the caller can see in the current view (deleted ones only for Admins who ask). */
  printCount: number;
  /** True when every print of the customer is deleted (shown only with "Toon verwijderde"). */
  deleted: boolean;
}
