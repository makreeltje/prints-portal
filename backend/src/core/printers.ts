/**
 * Printer profiles, edited in Settings and seeded with the Creality K1/K2
 * family. A profile's wattage drives electricity cost; without a matching
 * profile (or without watts) there is no electricity cost, never a guess.
 */
export interface PrinterProfile {
  /** Short key, also the default timelapse prefix, e.g. "k1max". */
  key: string;
  displayName: string;
  /** Other names slicers write, e.g. Creality Print's "K1 Max". */
  aliases: string[];
  /** Timelapse file-name prefixes; for display only, never for cost. */
  videoPrefixes: string[];
  /** Average power draw while printing; null until the owner sets it. */
  watts: number | null;
}

export const DEFAULT_PRINTER_PROFILES: readonly PrinterProfile[] = [
  { key: 'k1', displayName: 'Creality K1', aliases: ['K1'], videoPrefixes: ['k1'], watts: null },
  {
    key: 'k1max',
    displayName: 'Creality K1 Max',
    aliases: ['K1 Max', 'k1m'],
    videoPrefixes: ['k1max', 'k1m'],
    watts: null,
  },
  { key: 'k2', displayName: 'Creality K2', aliases: ['K2'], videoPrefixes: ['k2'], watts: null },
  {
    key: 'k2plus',
    displayName: 'Creality K2 Plus',
    aliases: ['K2 Plus'],
    videoPrefixes: ['k2plus'],
    watts: null,
  },
];

/** Lower case without whitespace, dashes or underscores: "K1-Max" → "k1max". */
export function normalizePrinterName(name: string): string {
  return name.toLowerCase().replace(/[\s_-]+/g, '');
}

/**
 * Finds the profile for a slicer's printer model string. A name that equals
 * the model wins; otherwise the longest name contained in the model, so
 * "Creality K1 Max (0.4 nozzle)" is a K1 Max and not a K1.
 */
export function matchPrinter(
  model: string | null | undefined,
  profiles: readonly PrinterProfile[],
): PrinterProfile | null {
  if (model === null || model === undefined) return null;
  const target = normalizePrinterName(model);
  if (target === '') return null;

  let best: { profile: PrinterProfile; score: number } | null = null;
  for (const profile of profiles) {
    for (const name of [profile.key, profile.displayName, ...profile.aliases]) {
      const candidate = normalizePrinterName(name);
      if (candidate === '') continue;
      const score =
        candidate === target
          ? 10_000 + candidate.length
          : target.includes(candidate)
            ? candidate.length
            : 0;
      if (score > 0 && (best === null || score > best.score)) best = { profile, score };
    }
  }
  return best?.profile ?? null;
}

export function matchVideoPrefix(
  prefix: string | null | undefined,
  profiles: readonly PrinterProfile[],
): PrinterProfile | null {
  if (prefix === null || prefix === undefined) return null;
  const wanted = prefix.toLowerCase();
  return (
    profiles.find((profile) =>
      profile.videoPrefixes.some((candidate) => candidate.toLowerCase() === wanted),
    ) ?? null
  );
}
