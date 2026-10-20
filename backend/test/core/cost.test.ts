import { describe, expect, it } from 'vitest';
import {
  calculateCost,
  type CostLineInput,
  type CostPrintInput,
  type CostSettings,
} from '../../src/core/cost.js';
import { duplicateFingerprint, findDuplicateGroups } from '../../src/core/duplicates.js';
import {
  DEFAULT_PRINTER_PROFILES,
  matchPrinter,
  matchVideoPrefix,
  normalizePrinterName,
  type PrinterProfile,
} from '../../src/core/printers.js';
import { customerPrice, suggestSalePrice } from '../../src/core/pricing.js';

const printers: PrinterProfile[] = DEFAULT_PRINTER_PROFILES.map((p) =>
  p.key === 'k1max' ? { ...p, watts: 350 } : p.key === 'k1' ? { ...p, watts: 300 } : { ...p },
);

const settings: CostSettings = {
  materialPricesPerKg: { PLA: 20, petg: 25 },
  tariffEurPerKwh: 0.32,
  printers,
};

function line(overrides: Partial<CostLineInput> = {}): CostLineInput {
  return {
    id: 'a',
    excluded: false,
    timesPrinted: 1,
    printTimeSeconds: null,
    printerModel: 'Creality K1 Max',
    totalGrams: null,
    material: 'PLA',
    manualPricePerKg: null,
    slots: [],
    ...overrides,
  };
}

function print(lines: CostLineInput[], overrides: Partial<CostPrintInput> = {}): CostPrintInput {
  return {
    lines,
    spoolPricePerKg: null,
    manualPricePerKg: null,
    manualGrams: null,
    manualPrintTimeSeconds: null,
    material: 'PLA',
    printerModel: null,
    metadataGrams: null,
    ...overrides,
  };
}

const slot = (n: number, grams: number, extra: Partial<CostLineInput['slots'][number]> = {}) => ({
  slot: n,
  grams,
  material: 'PLA',
  spoolPricePerKg: null,
  manualPricePerKg: null,
  ...extra,
});

describe('printer registry', () => {
  it.each([
    ['Creality K1 Max', 'k1max'],
    ['K1 Max', 'k1max'], // Creality Print 5
    ['Creality K1 Max (0.4 nozzle)', 'k1max'],
    ['Creality K1 Max (0.4 nozzle) - Device', 'k1max'],
    ['k1m', 'k1max'],
    ['K1-MAX', 'k1max'],
    ['Creality K1', 'k1'],
    ['K1', 'k1'],
    ['Creality K2 Plus', 'k2plus'],
    ['Creality K2', 'k2'],
  ])('matches %j to %s', (model, key) => {
    expect(matchPrinter(model, DEFAULT_PRINTER_PROFILES)?.key).toBe(key);
  });

  it.each(['Bambu Lab X1 Carbon', '', '   ', null])('does not match %j', (model) => {
    expect(matchPrinter(model, DEFAULT_PRINTER_PROFILES)).toBeNull();
  });

  it('is extensible with new profiles', () => {
    const custom: PrinterProfile = {
      key: 'x1c',
      displayName: 'Bambu Lab X1 Carbon',
      aliases: [],
      videoPrefixes: ['x1c'],
      watts: 110,
    };
    expect(matchPrinter('Bambu Lab X1 Carbon', [...printers, custom])?.watts).toBe(110);
  });

  it('matches video prefixes for display', () => {
    expect(matchVideoPrefix('K1', DEFAULT_PRINTER_PROFILES)?.key).toBe('k1');
    expect(matchVideoPrefix('k1m', DEFAULT_PRINTER_PROFILES)?.key).toBe('k1max');
    expect(matchVideoPrefix('ender', DEFAULT_PRINTER_PROFILES)).toBeNull();
  });

  it('normalises names', () => {
    expect(normalizePrinterName(' Creality  K1-Max_x ')).toBe('crealityk1maxx');
  });
});

describe('calculateCost', () => {
  it('one PLA file with a default price and a known printer', () => {
    const result = calculateCost(
      print([line({ slots: [slot(1, 173.49)], printTimeSeconds: 12_294 })]),
      settings,
    );
    // 173.49 g × €20/kg = 3.4698; 12294 s × 350 W = 1.19525 kWh × €0.32 = 0.38248
    expect(result).toMatchObject({
      grams: 173.49,
      gramsSource: 'files',
      printTimeSeconds: 12_294,
      timeSource: 'files',
      energyKwh: 1.195,
      tariffEurPerKwh: 0.32,
      materialCost: 3.47,
      electricityCost: 0.38,
      totalCost: 3.85,
      missing: [],
    });
    expect(result.lines[0]?.slots[0]).toEqual({
      slot: 1,
      grams: 173.49,
      material: 'PLA',
      pricePerKg: 20,
      source: 'estimated',
      cost: 3.47,
    });
    expect(result.lines[0]).toMatchObject({ printerKey: 'k1max', watts: 350, energyKwh: 1.195 });
  });

  it('prices each slot of a multi-colour file separately', () => {
    const result = calculateCost(
      print([
        line({
          slots: [slot(2, 1.65, { spoolPricePerKg: 30 }), slot(4, 1.38)],
          printTimeSeconds: 660,
        }),
      ]),
      settings,
    );
    // 1.65 × 30 / 1000 = 0.0495 (Spoolman) + 1.38 × 20 / 1000 = 0.0276 (Geschat) = 0.0771
    expect(result.lines[0]?.slots.map((s) => [s.source, s.cost])).toEqual([
      ['spoolman', 0.05],
      ['estimated', 0.03],
    ]);
    expect(result.materialCost).toBe(0.08);
    expect(result.grams).toBe(3.03);
  });

  it('follows the price order: slot spool, print spool, manual (slot, line, print), default', () => {
    const cost = (lineOverrides: Partial<CostLineInput>, printOverrides: Partial<CostPrintInput>) =>
      calculateCost(print([line(lineOverrides)], printOverrides), settings).lines[0]?.slots[0];

    const s = (extra: Partial<CostLineInput['slots'][number]>) => [slot(1, 100, extra)];
    expect(
      cost({ slots: s({ spoolPricePerKg: 30, manualPricePerKg: 50 }) }, { spoolPricePerKg: 40 }),
    ).toMatchObject({ pricePerKg: 30, source: 'spoolman' });
    expect(cost({ slots: s({ manualPricePerKg: 50 }) }, { spoolPricePerKg: 40 })).toMatchObject({
      pricePerKg: 40,
      source: 'spoolman',
    });
    expect(
      cost({ slots: s({ manualPricePerKg: 50 }), manualPricePerKg: 60 }, { manualPricePerKg: 70 }),
    ).toMatchObject({ pricePerKg: 50, source: 'manual' });
    expect(cost({ slots: s({}), manualPricePerKg: 60 }, { manualPricePerKg: 70 })).toMatchObject({
      pricePerKg: 60,
      source: 'manual',
    });
    expect(cost({ slots: s({}) }, { manualPricePerKg: 70 })).toMatchObject({
      pricePerKg: 70,
      source: 'manual',
    });
    expect(cost({ slots: s({ material: 'PETG' }) }, {})).toMatchObject({
      pricePerKg: 25,
      source: 'estimated',
    });
  });

  it('skips excluded lines and multiplies by times printed', () => {
    const result = calculateCost(
      print([
        line({ id: 'counted', slots: [slot(1, 50)], printTimeSeconds: 3600, timesPrinted: 2 }),
        line({ id: 'test print', slots: [slot(1, 999)], printTimeSeconds: 99_999, excluded: true }),
      ]),
      settings,
    );
    // 2 × 50 g × €20/kg = 2.00; 2 h × 350 W = 0.7 kWh × €0.32 = 0.224
    expect(result).toMatchObject({
      grams: 100,
      printTimeSeconds: 7200,
      energyKwh: 0.7,
      materialCost: 2,
      electricityCost: 0.22,
      totalCost: 2.22,
    });
    expect(result.lines.map((l) => [l.id, l.counted])).toEqual([
      ['counted', true],
      ['test print', false],
    ]);
  });

  it('uses the line total as one slot when the slicer gave no slots', () => {
    const result = calculateCost(print([line({ totalGrams: 40, material: 'PETG' })]), settings);
    expect(result.materialCost).toBe(1);
    expect(result.lines[0]?.slots).toHaveLength(1);
  });

  it("uses the wattage of each line's own printer", () => {
    const result = calculateCost(
      print([
        line({
          id: 'k1',
          printerModel: 'Creality K1',
          slots: [slot(1, 1)],
          printTimeSeconds: 3600,
        }),
        line({ id: 'max', printerModel: 'K1 Max', slots: [slot(1, 1)], printTimeSeconds: 3600 }),
      ]),
      settings,
    );
    // 1 h × 300 W + 1 h × 350 W = 0.65 kWh
    expect(result.energyKwh).toBe(0.65);
    expect(result.electricityCost).toBe(0.21);
  });

  it('leaves material null (not partial) when a slot has no price', () => {
    const result = calculateCost(
      print([
        line({ slots: [slot(1, 10), slot(2, 5, { material: 'TPU' })], printTimeSeconds: 3600 }),
      ]),
      settings,
    );
    expect(result.materialCost).toBeNull();
    expect(result.electricityCost).toBe(0.11);
    expect(result.totalCost).toBe(0.11);
    expect(result.missing).toEqual(['price']);
    expect(result.lines[0]?.materialCost).toBeNull();
  });

  it('has no electricity cost without a printer wattage, never a guess', () => {
    const result = calculateCost(
      print([line({ printerModel: 'Creality K2', slots: [slot(1, 100)], printTimeSeconds: 3600 })]),
      settings,
    );
    expect(result.electricityCost).toBeNull();
    expect(result.energyKwh).toBeNull();
    expect(result.totalCost).toBe(2);
    expect(result.missing).toEqual(['printerProfile']);
  });

  it('reports a missing tariff', () => {
    const result = calculateCost(print([line({ slots: [slot(1, 100)], printTimeSeconds: 3600 })]), {
      ...settings,
      tariffEurPerKwh: null,
    });
    expect(result.energyKwh).toBe(0.35);
    expect(result.electricityCost).toBeNull();
    expect(result.missing).toEqual(['tariff']);
  });

  it('total is null only when both parts are unknown', () => {
    const result = calculateCost(print([]), settings);
    expect(result).toMatchObject({ materialCost: null, electricityCost: null, totalCost: null });
    expect(result.missing).toEqual(['grams', 'printTime']);
  });

  it('manual grams and print time replace the files', () => {
    const result = calculateCost(
      print([line({ slots: [slot(1, 68)], printTimeSeconds: 4227 })], {
        manualGrams: 300,
        manualPrintTimeSeconds: 5 * 3600,
        printerModel: 'K1 Max',
      }),
      settings,
    );
    // 300 g × €20/kg = 6.00; 5 h × 350 W = 1.75 kWh × €0.32 = 0.56
    expect(result).toMatchObject({
      grams: 300,
      gramsSource: 'manual',
      printPricePerKg: 20,
      printPriceSource: 'estimated',
      printTimeSeconds: 18_000,
      timeSource: 'manual',
      energyKwh: 1.75,
      materialCost: 6,
      electricityCost: 0.56,
      totalCost: 6.56,
    });
  });

  it('falls back to print-level grams × print-level price when no file has grams', () => {
    const result = calculateCost(
      print([line({ excluded: true, slots: [slot(1, 10)] })], {
        metadataGrams: 50,
        manualPricePerKg: 30,
      }),
      settings,
    );
    expect(result).toMatchObject({
      grams: 50,
      gramsSource: 'metadata',
      printPriceSource: 'manual',
      materialCost: 1.5,
    });
  });

  it('rounds money half away from zero', () => {
    // 0.25 g × €20/kg = 0.005 → 0.01
    const result = calculateCost(print([line({ slots: [slot(1, 0.25)] })]), settings);
    expect(result.materialCost).toBe(0.01);
  });
});

describe('customer price', () => {
  it('uses the sale price when set', () => {
    expect(customerPrice({ salePrice: 15, totalCost: 2.3, defaultMarkupPercent: 400 })).toBe(15);
    expect(customerPrice({ salePrice: 0, totalCost: 2.3, defaultMarkupPercent: 400 })).toBe(0);
  });

  it('otherwise adds the default markup to the cost', () => {
    // 2.30 × 5 = 11.50
    expect(customerPrice({ salePrice: null, totalCost: 2.3, defaultMarkupPercent: 400 })).toBe(
      11.5,
    );
    expect(customerPrice({ salePrice: null, totalCost: 2.38, defaultMarkupPercent: 400 })).toBe(
      11.9,
    );
  });

  it('is nothing when cost or markup is missing', () => {
    expect(
      customerPrice({ salePrice: null, totalCost: null, defaultMarkupPercent: 400 }),
    ).toBeNull();
    expect(
      customerPrice({ salePrice: null, totalCost: 2.3, defaultMarkupPercent: null }),
    ).toBeNull();
  });

  it('suggests a sale price from the markup, or says why not', () => {
    expect(suggestSalePrice(2.3, 400)).toEqual({ ok: true, salePrice: 11.5 });
    expect(suggestSalePrice(3.85, 0)).toEqual({ ok: true, salePrice: 3.85 });
    expect(suggestSalePrice(null, 400)).toEqual({ ok: false, reason: 'noCost' });
    expect(suggestSalePrice(2.3, null)).toEqual({ ok: false, reason: 'noMarkup' });
  });
});

describe('duplicates', () => {
  const meta = {
    sizeBytes: 3_578_308,
    totalGrams: 118.74,
    printTimeSeconds: 9455,
    slots: [{ slot: 1, grams: 118.74, colour: '#ffda90' }],
  };

  it('groups identical copies', () => {
    const items = [
      { id: 'bloembak_clips.gcode', fingerprint: duplicateFingerprint(meta) },
      { id: 'bloembak_clips copy.gcode', fingerprint: duplicateFingerprint(meta) },
      { id: 'bloembak_clips copy 2.gcode', fingerprint: duplicateFingerprint({ ...meta }) },
      { id: 'other.gcode', fingerprint: duplicateFingerprint({ ...meta, totalGrams: 52.7 }) },
    ];
    expect(findDuplicateGroups(items)).toEqual([
      ['bloembak_clips.gcode', 'bloembak_clips copy.gcode', 'bloembak_clips copy 2.gcode'],
    ]);
  });

  it('does not flag a reprint in another colour', () => {
    const other = { ...meta, slots: [{ slot: 1, grams: 118.74, colour: '#00f600' }] };
    expect(duplicateFingerprint(other)).not.toBe(duplicateFingerprint(meta));
  });

  it('never compares files without slicer metadata', () => {
    const bare = { sizeBytes: 100, totalGrams: null, printTimeSeconds: null, slots: [] };
    expect(duplicateFingerprint(bare)).toBeNull();
    expect(
      findDuplicateGroups([
        { id: 'a', fingerprint: null },
        { id: 'b', fingerprint: null },
      ]),
    ).toEqual([]);
  });
});
