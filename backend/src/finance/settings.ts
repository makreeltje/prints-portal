import type { Kysely, Transaction } from 'kysely';
import { DEFAULT_PRINTER_PROFILES, type PrinterProfile } from '../core/printers.js';
import type { Database } from '../db/schema.js';

/**
 * Business settings live in `app_settings` as JSON (plan: env values only
 * seed the first start). Three keys:
 *   - pricing: Standaardmarge, electricity tariff, default €/kg per material;
 *   - printers: printer profiles (watts drive electricity cost);
 *   - company: Bedrijfsgegevens for documents (M7 adds the logo).
 */
export interface PricingSettings {
  /** "Standaardmarge" in percent: price = cost × (1 + markup / 100). */
  defaultMarkupPercent: number | null;
  tariffEurPerKwh: number | null;
  /** "Geschat" price per kg, keyed by material as typed ("PLA", "PETG"). */
  materialPricesPerKg: Record<string, number>;
}

export interface CompanySettings {
  name: string;
  iban: string;
  address: string;
  email: string | null;
  phone: string | null;
}

export interface Settings {
  pricing: PricingSettings;
  printers: PrinterProfile[];
  company: CompanySettings;
}

export type SettingsKey = keyof Settings;

const EMPTY_COMPANY: CompanySettings = {
  name: '',
  iban: '',
  address: '',
  email: null,
  phone: null,
};

type Db = Kysely<Database> | Transaction<Database>;

export async function readSettings(db: Db): Promise<Settings> {
  const rows = await db.selectFrom('app_settings').select(['key', 'value']).execute();
  const raw = new Map(rows.map((row) => [row.key, row.value]));
  return {
    pricing: {
      ...defaultPricing(null),
      ...(parse(raw.get('pricing')) as Partial<PricingSettings>),
    },
    printers: (parse(raw.get('printers')) as PrinterProfile[] | undefined) ?? [
      ...DEFAULT_PRINTER_PROFILES,
    ],
    company: { ...EMPTY_COMPANY, ...(parse(raw.get('company')) as Partial<CompanySettings>) },
  };
}

export async function writeSetting<K extends SettingsKey>(
  db: Db,
  key: K,
  value: Settings[K],
  userId: string | null,
  now: string,
): Promise<void> {
  const text = JSON.stringify(value);
  // Select first: MariaDB counts only changed rows as updated.
  const exists = await db
    .selectFrom('app_settings')
    .select('key')
    .where('key', '=', key)
    .executeTakeFirst();
  if (exists !== undefined) {
    await db
      .updateTable('app_settings')
      .set({ value: text, updated_at: now, updated_by: userId })
      .where('key', '=', key)
      .execute();
  } else {
    await db
      .insertInto('app_settings')
      .values({ key, value: text, updated_at: now, updated_by: userId })
      .execute();
  }
}

/** First start: K1 family profiles and the tariff from the environment. Never overwrites. */
export async function seedSettings(
  db: Db,
  seedTariffEurPerKwh: number | null,
  now: string,
): Promise<void> {
  const present = new Set(
    (await db.selectFrom('app_settings').select('key').execute()).map((row) => row.key),
  );
  if (!present.has('pricing')) {
    await writeSetting(db, 'pricing', defaultPricing(seedTariffEurPerKwh), null, now);
  }
  if (!present.has('printers')) {
    await writeSetting(db, 'printers', [...DEFAULT_PRINTER_PROFILES], null, now);
  }
}

function defaultPricing(tariff: number | null): PricingSettings {
  return { defaultMarkupPercent: null, tariffEurPerKwh: tariff, materialPricesPerKg: {} };
}

function parse(text: string | undefined): unknown {
  if (text === undefined) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
