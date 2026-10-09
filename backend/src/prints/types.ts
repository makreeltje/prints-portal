import type { AssetType } from '../core/files.js';
import type { RecordStatus } from '../db/schema.js';
import type { OrderDto } from '../finance/dto.js';
import type { PrintMoneyDto } from '../finance/read.js';
import type { SpoolSnapshot } from '../finance/spools.js';

/** What every role may see of a tag. */
export interface TagDto {
  id: string;
  name: string;
  /**
   * Palette key (`rose` … `grey`, rendered via `data-c`), a legacy #rrggbb
   * from before design system v1.3, or null (chip without colour).
   */
  colour: string | null;
  /** Chip text colour for a legacy #rrggbb `colour` (higher contrast); null otherwise. */
  ink: string | null;
}

/** One print in a list (dashboard card or row). */
/** The file types a card reports as missing, in the order it shows them. */
export type MissingFileType = 'gcode' | '3mf' | 'stl';

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
   * Tint for the thumbnail and 3D model (SpoolSwatch tint rule): the first
   * assigned spool's colour, else the slicer colour of the first used slot of
   * the newest counted file. Null: no tint.
   */
  colour: string | null;
  /** Price, payment status and (Admin/Editor) cost, summed over the print's orders. */
  money: PrintMoneyDto | null;
  /**
   * Which of G-code, 3MF and STL the print has none of, in that fixed order
   * (GAP-090). Empty for about 70% of prints, which then show no chip at all.
   */
  lacks: MissingFileType[];
  /** Changes whenever the print changes; part of thumbnail URLs for cache busting. */
  version: string;
}

export interface SlotDto {
  slot: number;
  grams: number;
  colour: string | null;
  material: string | null;
  /** Spool assigned to this slot (snapshot), and a manual €/kg. */
  spool: SpoolSnapshot | null;
  manualPricePerKg: number | null;
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
  /** Over all orders; 0 when the file is in no order yet (new after an order was priced). */
  timesPrinted: number;
  inOrder: boolean;
  spool: SpoolSnapshot | null;
  manualPricePerKg: number | null;
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
  /** Every viewable model, file order; the viewer's picker uses it. */
  models: { id: string; fileName: string; hasPicture: boolean }[];
  /** Null for Users. */
  assets: AssetDto[] | null;
  /** "Niet factureren" klant: cost only, no price or payment. */
  noBilling: boolean;
  /** Standaardmarge (Admin/Editor); null for Users or when not set. */
  markupPercent: number | null;
  /** "Spoel voor de hele print" (Admin/Editor). */
  spool: SpoolSnapshot | null;
  /** Order 1 first; Users get number, status and price only. */
  orders: OrderDto[];
}

export interface CustomerSummary {
  folder: string;
  /** Prints the caller can see in the current view (deleted ones only for Admins who ask). */
  printCount: number;
  /** True when every print of the customer is deleted (shown only with "Toon verwijderde"). */
  deleted: boolean;
  noBilling: boolean;
  /** Openstaand over the visible prints, euros; null for Users or niet factureren. */
  openAmount: number | null;
}
