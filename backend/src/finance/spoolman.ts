import { normalizeHexColor } from '../core/tags.js';
import type { SpoolSnapshot } from './spools.js';

/**
 * Read-only Spoolman client, written against Spoolman v0.27.0
 * (`spoolman/api/v1/models.py`): GET /api/v1/spool lists spools with their
 * filament and vendor. Field use:
 *   - spool.price / spool.initial_weight (net grams) → price per kg;
 *     otherwise filament.price / filament.weight;
 *   - filament.color_hex ("FF0000", optional alpha) or
 *     filament.multi_color_hexes ("FF0000,00FF00") with multi_color_direction;
 *   - vendor.name and filament.name (or material) for the display name.
 * Spoolman being slow or down never breaks a page: callers get
 * SpoolmanUnavailableError and the UI falls back to manual prices.
 */
export interface SpoolOption extends Omit<SpoolSnapshot, 'takenAt'> {
  remainingWeight: number | null;
}

export interface SpoolmanStatus {
  configured: boolean;
  url: string | null;
  reachable: boolean;
  spoolCount: number | null;
  lastSync: string | null;
}

export class SpoolmanUnavailableError extends Error {
  override name = 'SpoolmanUnavailableError';
}

interface RawVendor {
  name?: string | null;
}
interface RawFilament {
  name?: string | null;
  material?: string | null;
  price?: number | null;
  weight?: number | null;
  color_hex?: string | null;
  multi_color_hexes?: string | null;
  multi_color_direction?: string | null;
  vendor?: RawVendor | null;
}
export interface RawSpool {
  id: number;
  price?: number | null;
  initial_weight?: number | null;
  remaining_weight?: number | null;
  archived?: boolean;
  filament: RawFilament;
}

export interface SpoolmanClientOptions {
  url: string | null;
  timeoutMs: number;
  cacheMs: number;
  fetch?: typeof fetch;
  now?: () => Date;
}

export class SpoolmanClient {
  private cache: { at: number; spools: SpoolOption[] } | null = null;
  private lastSync: string | null = null;
  private lastOk = false;

  constructor(private readonly options: SpoolmanClientOptions) {}

  get configured(): boolean {
    return this.options.url !== null;
  }

  /** Active spools, cached for `cacheMs`; throws when Spoolman cannot be reached. */
  async listSpools(): Promise<SpoolOption[]> {
    const now = this.now().getTime();
    if (this.cache !== null && now - this.cache.at < this.options.cacheMs) {
      return this.cache.spools;
    }
    const raw = await this.get<RawSpool[]>('/api/v1/spool?allow_archived=false');
    if (!Array.isArray(raw)) throw new SpoolmanUnavailableError('unexpected answer from Spoolman');
    const spools = raw.map(toOption);
    this.cache = { at: now, spools };
    this.lastSync = this.now().toISOString();
    return spools;
  }

  /** One spool, fresh from Spoolman (its price is snapshotted at assignment). */
  async getSpool(id: number): Promise<SpoolOption | null> {
    try {
      return toOption(await this.get<RawSpool>(`/api/v1/spool/${String(id)}`));
    } catch (error) {
      if (error instanceof SpoolNotFoundError) return null;
      throw error;
    }
  }

  async status(): Promise<SpoolmanStatus> {
    if (!this.configured) {
      return { configured: false, url: null, reachable: false, spoolCount: null, lastSync: null };
    }
    try {
      const spools = await this.listSpools();
      return {
        configured: true,
        url: this.options.url,
        reachable: true,
        spoolCount: spools.length,
        lastSync: this.lastSync,
      };
    } catch {
      return {
        configured: true,
        url: this.options.url,
        reachable: false,
        spoolCount: null,
        lastSync: this.lastSync,
      };
    }
  }

  /** Forget the cached list (used by "Opnieuw proberen"). */
  refresh(): void {
    this.cache = null;
  }

  snapshot(spool: SpoolOption): SpoolSnapshot {
    return {
      id: spool.id,
      name: spool.name,
      vendor: spool.vendor,
      material: spool.material,
      colour: spool.colour,
      colours: spool.colours,
      multiColourDirection: spool.multiColourDirection,
      pricePerKg: spool.pricePerKg,
      takenAt: this.now().toISOString(),
    };
  }

  private async get<T>(path: string): Promise<T> {
    const { url } = this.options;
    if (url === null) throw new SpoolmanUnavailableError('Spoolman is not configured');
    const doFetch = this.options.fetch ?? fetch;
    let response: Response;
    try {
      response = await doFetch(`${url}${path}`, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(this.options.timeoutMs),
      });
    } catch (error) {
      this.lastOk = false;
      throw new SpoolmanUnavailableError(
        error instanceof Error ? error.message : 'Spoolman did not answer',
      );
    }
    if (response.status === 404) throw new SpoolNotFoundError(path);
    if (!response.ok) {
      this.lastOk = false;
      throw new SpoolmanUnavailableError(`Spoolman answered ${String(response.status)}`);
    }
    this.lastOk = true;
    return (await response.json()) as T;
  }

  /** Whether the last request reached Spoolman. */
  get reachable(): boolean {
    return this.lastOk;
  }

  private now(): Date {
    return this.options.now?.() ?? new Date();
  }
}

class SpoolNotFoundError extends Error {
  override name = 'SpoolNotFoundError';
}

export function toOption(spool: RawSpool): SpoolOption {
  const filament = spool.filament;
  const vendor = filament.vendor?.name?.trim() ?? null;
  const filamentName = filament.name?.trim() ?? filament.material?.trim() ?? `#${String(spool.id)}`;
  const colours = (filament.multi_color_hexes ?? '')
    .split(',')
    .map((hex) => normalizeHexColor(hex.trim().slice(0, 6)))
    .filter((hex): hex is string => hex !== null);
  const single =
    filament.color_hex === null || filament.color_hex === undefined
      ? null
      : normalizeHexColor(filament.color_hex.slice(0, 6));
  const direction = filament.multi_color_direction;
  return {
    id: spool.id,
    name: vendor === null || vendor === '' ? filamentName : `${vendor} ${filamentName}`,
    vendor: vendor === '' ? null : vendor,
    material: filament.material?.trim() ?? null,
    colour: colours[0] ?? single,
    colours,
    multiColourDirection:
      colours.length > 1 && (direction === 'coaxial' || direction === 'longitudinal')
        ? direction
        : null,
    pricePerKg: pricePerKg(spool),
    remainingWeight: spool.remaining_weight ?? null,
  };
}

/** Spool price over its net weight; otherwise the filament's price over its weight. */
export function pricePerKg(spool: RawSpool): number | null {
  const fromSpool = perKg(spool.price, spool.initial_weight);
  if (fromSpool !== null) return fromSpool;
  return perKg(spool.filament.price, spool.filament.weight);
}

function perKg(price: number | null | undefined, grams: number | null | undefined): number | null {
  if (price === null || price === undefined || grams === null || grams === undefined) return null;
  if (!(grams > 0) || price < 0) return null;
  return Math.round((price / grams) * 1000 * 100) / 100;
}
