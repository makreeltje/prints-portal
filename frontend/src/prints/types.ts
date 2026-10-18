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

/** A Spoolman spool as it was when assigned (or as listed by /api/spools). */
export interface Spool {
  id: number;
  name: string;
  vendor: string | null;
  material: string | null;
  colour: string | null;
  colours: string[];
  multiColourDirection: 'coaxial' | 'longitudinal' | null;
  pricePerKg: number | null;
  remainingWeight?: number | null;
  /** Archived in Spoolman: used up or retired. Absent on an older snapshot. */
  archived?: boolean;
  takenAt?: string;
}

export type OrderStatus =
  'open' | 'partial' | 'paid' | 'writtenOff' | 'noPrice' | 'notBilled' | 'declined';

/** Where a request stands; null means "as before" (2.8). */
export type RequestState = 'undecided' | 'inProgress' | 'declined';
export type PriceSource = 'spoolman' | 'manual' | 'estimated';
export type MissingInput = 'grams' | 'price' | 'printTime' | 'printerProfile' | 'tariff';

/** Price and status summed over a print's orders; cost is null for Users. */
export interface PrintMoney {
  status: OrderStatus;
  price: number | null;
  priceSuggested: boolean;
  paid: number;
  writtenOff: number;
  remaining: number | null;
  orderCount: number;
  cost: number | null;
}

export interface CostSlot {
  slot: number;
  grams: number;
  pricePerKg: number | null;
  source: PriceSource | null;
  cost: number | null;
}

export interface CostLine {
  lineId: string;
  fileName: string;
  plateIndex: number;
  counted: boolean;
  timesPrinted: number;
  grams: number | null;
  materialCost: number | null;
  slots: CostSlot[];
}

export interface Cost {
  materialCost: number | null;
  electricityCost: number | null;
  totalCost: number | null;
  grams: number | null;
  gramsSource: 'files' | 'manual' | 'metadata' | null;
  printPricePerKg: number | null;
  printPriceSource: PriceSource | null;
  printSeconds: number | null;
  timeSource: 'files' | 'manual' | null;
  energyKwh: number | null;
  tariffEurPerKwh: number | null;
  missing: MissingInput[];
  lines: CostLine[];
  excludedCount: number;
}

export interface Payment {
  id: string;
  amount: number;
  paidAt: string;
  by: string | null;
  undoneAt: string | null;
  undoneBy: string | null;
}

/** An order of a print; Users get id, number, createdAt, status and price only. */
export interface Order {
  id: string;
  number: number;
  createdAt: string;
  /** Newest counted G-code in the order, else its creation time. */
  date: string;
  status: OrderStatus;
  /** Where the request stands; null means "as before" (2.8). */
  requestState: RequestState | null;
  price: number | null;
  salePrice?: number | null;
  priceSuggested?: boolean;
  suggestion?: { salePrice: number | null; reason: 'noMarkup' | 'noCost' | null };
  paid?: number;
  remaining?: number | null;
  writtenOff?: { amount: number; at: string; by: string | null; reason: string | null } | null;
  payments?: Payment[];
  overrides?: { pricePerKg: number | null; grams: number | null; printSeconds: number | null };
  cost?: Cost;
  items?: { lineId: string | null; timesPrinted: number }[];
  /** "Op factuur {nummer}" (M7). */
  invoice?: { id: string; number: string } | null;
}

export interface TagWithCount extends Tag {
  printCount: number;
}

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
  tags: Tag[];
  hasThumbnail: boolean;
  colour: string | null;
  money: PrintMoney | null;
  /** Which of G-code, 3MF and STL this print has none of, in that order. */
  lacks: MissingFileType[];
  version: string;
}

export interface Slot {
  slot: number;
  grams: number;
  colour: string | null;
  material: string | null;
  spool: Spool | null;
  manualPricePerKg: number | null;
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
  inOrder: boolean;
  spool: Spool | null;
  manualPricePerKg: number | null;
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
  /** Every viewable model, file order (ModelPicker 1.9). */
  models: { id: string; fileName: string; hasPicture: boolean }[];
  assets: Asset[] | null;
  noBilling: boolean;
  markupPercent: number | null;
  spool: Spool | null;
  /** "Bron": the typed link, and the ones found in the folder (PrintSource). */
  sources: PrintSource[];
  /** "Notitie": internal. Null for role User, who never sees it (PrintNote). */
  note: string | null;
  orders: Order[];
}

/** One bron: where a model came from (PrintSource, GAP-152). */
export interface PrintSource {
  url: string;
  /** Host and path without the scheme: what the link shows. */
  label: string;
  /**
   * The `.url` file this came out of, or null when the operator typed it.
   * Only a found one carries the chip, and only a typed one can be edited.
   */
  fileName: string | null;
}

export interface Customer {
  folder: string;
  printCount: number;
  deleted: boolean;
  noBilling: boolean;
  /** Openstaand, euros; null for Users and niet-factureren klanten. */
  openAmount: number | null;
  /** The klant's optional payment link (GAP-103); null for anyone but an Admin. */
  payLink: string | null;
  /** When that link was set, so one pasted months ago is visibly old. */
  payLinkAddedAt: string | null;
}

export const PRINT_SORTS = ['newest', 'oldest', 'priceDesc', 'priceAsc', 'customer'] as const;
export type PrintSort = (typeof PRINT_SORTS)[number];

export const PRINT_STATUS_FILTERS = [
  'noPrice',
  'open',
  'paid',
  'writtenOff',
  'incompleteCost',
] as const;
export type PrintStatusFilter = (typeof PRINT_STATUS_FILTERS)[number];

export interface PrintFilter {
  customer: string | null;
  tagIds: string[];
  search: string;
  archived: boolean;
  deleted: boolean;
  /** FilterBar 1.9 (GAP-066); sorting is not a filter. */
  sort: PrintSort;
  /** null: "Alle statussen". */
  status: PrintStatusFilter | null;
}

export const EMPTY_FILTER: PrintFilter = {
  customer: null,
  tagIds: [],
  search: '',
  sort: 'newest',
  status: null,
  archived: false,
  deleted: false,
};
