import { roundEnergy, roundMoney } from './money.js';
import { matchPrinter, type PrinterProfile } from './printers.js';

/**
 * Cost of one print (brief §4 plus the owner's decisions):
 *
 *   material    = Σ counted lines × times printed × Σ slots (grams × €/kg / 1000)
 *   electricity = Σ counted lines × times printed × hours × watts / 1000 × tariff
 *   total       = material + electricity; null only when both are unknown
 *
 * Price per kg for a slot: Spoolman (slot spool, else the print's spool) →
 * manual (slot, line, print) → default for the material ("Geschat").
 * Manual grams or print time on the print replace what the files say.
 * A missing input makes that component null and is listed in `missing`;
 * partial sums are never shown as if they were complete.
 */
export type PriceSource = 'spoolman' | 'manual' | 'estimated';
export type MissingInput = 'grams' | 'price' | 'printTime' | 'printerProfile' | 'tariff';

export interface CostSlotInput {
  slot: number;
  grams: number;
  /** Slicer material for this slot, e.g. "PLA". */
  material: string | null;
  spoolPricePerKg: number | null;
  manualPricePerKg: number | null;
}

/** A counted unit: one G-code file or one sliced 3MF plate. */
export interface CostLineInput {
  id: string;
  excluded: boolean;
  timesPrinted: number;
  printTimeSeconds: number | null;
  printerModel: string | null;
  /** Used when the slicer did not report slots: one slot with these grams. */
  totalGrams: number | null;
  material: string | null;
  manualPricePerKg: number | null;
  slots: CostSlotInput[];
}

export interface CostPrintInput {
  lines: CostLineInput[];
  /** Print-level Spoolman spool (brief: fallback after the asset's own spool). */
  spoolPricePerKg: number | null;
  manualPricePerKg: number | null;
  /** "Handmatig" overrides for incomplete legacy projects. */
  manualGrams: number | null;
  manualPrintTimeSeconds: number | null;
  material: string | null;
  printerModel: string | null;
  /** Print-level grams from metadata, used only when no counted line has grams. */
  metadataGrams: number | null;
}

export interface CostSettings {
  /** Default €/kg per material, keyed case-insensitively ("PLA" → 20). */
  materialPricesPerKg: Readonly<Record<string, number>>;
  tariffEurPerKwh: number | null;
  printers: readonly PrinterProfile[];
}

export interface SlotCost {
  slot: number;
  /** Grams for all prints of this line (grams × times printed). */
  grams: number;
  material: string | null;
  pricePerKg: number | null;
  source: PriceSource | null;
  cost: number | null;
}

export interface LineCost {
  id: string;
  counted: boolean;
  timesPrinted: number;
  grams: number | null;
  printTimeSeconds: number | null;
  printerKey: string | null;
  watts: number | null;
  energyKwh: number | null;
  slots: SlotCost[];
  materialCost: number | null;
}

export interface CostBreakdown {
  grams: number | null;
  gramsSource: 'files' | 'manual' | 'metadata' | null;
  /** Price used for manual or metadata grams (print level). */
  printPricePerKg: number | null;
  printPriceSource: PriceSource | null;
  printTimeSeconds: number | null;
  timeSource: 'files' | 'manual' | null;
  energyKwh: number | null;
  tariffEurPerKwh: number | null;
  materialCost: number | null;
  electricityCost: number | null;
  totalCost: number | null;
  lines: LineCost[];
  missing: MissingInput[];
}

interface Priced {
  pricePerKg: number;
  source: PriceSource;
}

export function calculateCost(input: CostPrintInput, settings: CostSettings): CostBreakdown {
  const missing = new Set<MissingInput>();
  const printerFor = (model: string | null) =>
    matchPrinter(model ?? input.printerModel, settings.printers);

  const lines: LineCost[] = input.lines.map((line) => {
    const counted = !line.excluded;
    const times = Math.max(1, Math.floor(line.timesPrinted));
    const slotInputs: CostSlotInput[] =
      line.slots.length > 0
        ? line.slots
        : line.totalGrams !== null && line.totalGrams > 0
          ? [
              {
                slot: 1,
                grams: line.totalGrams,
                material: line.material,
                spoolPricePerKg: null,
                manualPricePerKg: null,
              },
            ]
          : [];

    const slots: SlotCost[] = slotInputs.map((slot) => {
      const material = slot.material ?? line.material ?? input.material;
      const priced = priceForSlot(slot, line, input, settings, material);
      const grams = slot.grams * times;
      return {
        slot: slot.slot,
        grams: roundGrams(grams),
        material,
        pricePerKg: priced?.pricePerKg ?? null,
        source: priced?.source ?? null,
        cost: priced === null ? null : roundMoney((grams * priced.pricePerKg) / 1000),
      };
    });

    const printer = printerFor(line.printerModel);
    const seconds = line.printTimeSeconds === null ? null : line.printTimeSeconds * times;
    const watts = printer?.watts ?? null;
    const gramsTotal = slots.length > 0 ? roundGrams(slots.reduce((s, x) => s + x.grams, 0)) : null;
    const rawMaterial = slots.every((s) => s.pricePerKg !== null)
      ? slots.reduce((sum, s) => sum + (s.grams * (s.pricePerKg ?? 0)) / 1000, 0)
      : null;

    return {
      id: line.id,
      counted,
      timesPrinted: times,
      grams: gramsTotal,
      printTimeSeconds: seconds,
      printerKey: printer?.key ?? null,
      watts,
      energyKwh: seconds === null || watts === null ? null : roundEnergy(energy(seconds, watts)),
      slots,
      materialCost: slots.length === 0 || rawMaterial === null ? null : roundMoney(rawMaterial),
    };
  });

  const counted = lines.filter((line) => line.counted);

  // ---- material ----
  let grams: number | null = null;
  let gramsSource: CostBreakdown['gramsSource'] = null;
  let printPrice: Priced | null = null;
  let materialRaw: number | null = null;

  const countedWithGrams = counted.filter((line) => line.slots.length > 0);
  const printLevelGrams =
    input.manualGrams !== null
      ? { grams: input.manualGrams, source: 'manual' as const }
      : countedWithGrams.length === 0 && input.metadataGrams !== null && input.metadataGrams > 0
        ? { grams: input.metadataGrams, source: 'metadata' as const }
        : null;

  if (printLevelGrams !== null) {
    grams = roundGrams(printLevelGrams.grams);
    gramsSource = printLevelGrams.source;
    printPrice = priceForPrint(input, settings);
    if (printPrice === null) missing.add('price');
    else materialRaw = (printLevelGrams.grams * printPrice.pricePerKg) / 1000;
  } else if (countedWithGrams.length > 0) {
    const allSlots = countedWithGrams.flatMap((line) => line.slots);
    grams = roundGrams(allSlots.reduce((sum, slot) => sum + slot.grams, 0));
    gramsSource = 'files';
    if (allSlots.some((slot) => slot.pricePerKg === null)) missing.add('price');
    else materialRaw = allSlots.reduce((sum, s) => sum + (s.grams * (s.pricePerKg ?? 0)) / 1000, 0);
  } else {
    missing.add('grams');
  }

  // ---- electricity ----
  let printTimeSeconds: number | null = null;
  let timeSource: CostBreakdown['timeSource'] = null;
  let energyRaw: number | null = null;

  if (input.manualPrintTimeSeconds !== null) {
    printTimeSeconds = input.manualPrintTimeSeconds;
    timeSource = 'manual';
    const watts = matchPrinter(input.printerModel, settings.printers)?.watts ?? null;
    if (watts === null) missing.add('printerProfile');
    else energyRaw = energy(input.manualPrintTimeSeconds, watts);
  } else {
    const timed = counted.filter((line) => line.printTimeSeconds !== null);
    if (timed.length === 0) {
      missing.add('printTime');
    } else {
      printTimeSeconds = timed.reduce((sum, line) => sum + (line.printTimeSeconds ?? 0), 0);
      timeSource = 'files';
      if (timed.some((line) => line.watts === null)) missing.add('printerProfile');
      else
        energyRaw = timed.reduce(
          (sum, line) => sum + energy(line.printTimeSeconds ?? 0, line.watts ?? 0),
          0,
        );
    }
  }

  const tariff = settings.tariffEurPerKwh;
  if (energyRaw !== null && tariff === null) missing.add('tariff');

  const materialCost = materialRaw === null ? null : roundMoney(materialRaw);
  const electricityCost =
    energyRaw === null || tariff === null ? null : roundMoney(energyRaw * tariff);
  const totalCost =
    materialCost === null && electricityCost === null
      ? null
      : roundMoney((materialCost ?? 0) + (electricityCost ?? 0));

  return {
    grams,
    gramsSource,
    printPricePerKg: printPrice?.pricePerKg ?? null,
    printPriceSource: printPrice?.source ?? null,
    printTimeSeconds,
    timeSource,
    energyKwh: energyRaw === null ? null : roundEnergy(energyRaw),
    tariffEurPerKwh: tariff,
    materialCost,
    electricityCost,
    totalCost,
    lines,
    missing: [...missing],
  };
}

function priceForSlot(
  slot: CostSlotInput,
  line: CostLineInput,
  print: CostPrintInput,
  settings: CostSettings,
  material: string | null,
): Priced | null {
  const spool = slot.spoolPricePerKg ?? print.spoolPricePerKg;
  if (spool !== null) return { pricePerKg: spool, source: 'spoolman' };
  const manual = slot.manualPricePerKg ?? line.manualPricePerKg ?? print.manualPricePerKg;
  if (manual !== null) return { pricePerKg: manual, source: 'manual' };
  return defaultPrice(material, settings);
}

function priceForPrint(print: CostPrintInput, settings: CostSettings): Priced | null {
  if (print.spoolPricePerKg !== null)
    return { pricePerKg: print.spoolPricePerKg, source: 'spoolman' };
  if (print.manualPricePerKg !== null)
    return { pricePerKg: print.manualPricePerKg, source: 'manual' };
  return defaultPrice(print.material, settings);
}

function defaultPrice(material: string | null, settings: CostSettings): Priced | null {
  if (material === null) return null;
  const wanted = material.trim().toUpperCase();
  for (const [key, price] of Object.entries(settings.materialPricesPerKg)) {
    if (key.trim().toUpperCase() === wanted) return { pricePerKg: price, source: 'estimated' };
  }
  return null;
}

function energy(seconds: number, watts: number): number {
  return ((seconds / 3600) * watts) / 1000;
}

function roundGrams(value: number): number {
  return Math.round(value * 100) / 100;
}
