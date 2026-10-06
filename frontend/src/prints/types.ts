/** Mirrors backend/src/prints/types.ts (the API's JSON). */
export type RecordStatus = 'indexed' | 'archived' | 'deleted';
export type AssetType = 'gcode' | '3mf' | 'stl' | 'video' | 'f3d' | 'pdf' | 'url' | 'other';

export interface Tag {
  id: string;
  name: string;
  /** Palette key (`data-c`), a free #rrggbb from before design system v1.3, or null. */
  colour: string | null;
  /** Chip text colour chosen by the server for a free colour; null otherwise. */
  ink: string | null;
}

export interface TagWithCount extends Tag {
  printCount: number;
}

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
  tags: Tag[];
  hasThumbnail: boolean;
  colour: string | null;
  version: string;
}

export interface Slot {
  slot: number;
  grams: number;
  colour: string | null;
  material: string | null;
}

export interface Line {
  id: string;
  plateIndex: number;
  grams: number | null;
  printSeconds: number | null;
  material: string | null;
  printerModel: string | null;
  excluded: boolean;
  autoExclusionReason: string | null;
  timesPrinted: number;
  possibleDuplicate: boolean;
  duplicateOf: string | null;
  slots: Slot[];
}

export interface Asset {
  id: string;
  fileName: string;
  subPath: string;
  type: AssetType;
  sizeBytes: number;
  lastWriteUtc: string;
  recordedAt: string | null;
  parseError: string | null;
  lines: Line[];
}

export interface PrintDetail extends PrintSummary {
  printerModel: string | null;
  archivedAt: string | null;
  hasModel: boolean;
  assets: Asset[] | null;
}

export interface Customer {
  folder: string;
  printCount: number;
  deleted: boolean;
}

export interface PrintFilter {
  customer: string | null;
  tagIds: string[];
  search: string;
  archived: boolean;
  deleted: boolean;
}

export const EMPTY_FILTER: PrintFilter = {
  customer: null,
  tagIds: [],
  search: '',
  archived: false,
  deleted: false,
};
