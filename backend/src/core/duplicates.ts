/**
 * "Mogelijk dubbel": files in one project with the same size and identical
 * slicer metadata (grams per slot, print time, slot colours). A reprint in
 * another colour differs in its slot colours, so it is not flagged. Files
 * without slicer metadata are never compared on size alone.
 */
export interface FingerprintInput {
  sizeBytes: number;
  totalGrams: number | null;
  printTimeSeconds: number | null;
  slots: readonly { slot: number; grams: number; colour: string | null }[];
}

export function duplicateFingerprint(input: FingerprintInput): string | null {
  if (input.totalGrams === null && input.printTimeSeconds === null) return null;
  const slots = [...input.slots]
    .sort((a, b) => a.slot - b.slot)
    .map((s) => `${s.slot}:${s.grams.toFixed(2)}:${s.colour ?? '-'}`)
    .join(',');
  return [
    input.sizeBytes,
    input.totalGrams?.toFixed(2) ?? '-',
    input.printTimeSeconds ?? '-',
    slots,
  ].join('|');
}

/** Groups of ids (two or more) that share a fingerprint, in input order. */
export function findDuplicateGroups(
  items: readonly { id: string; fingerprint: string | null }[],
): string[][] {
  const groups = new Map<string, string[]>();
  for (const item of items) {
    if (item.fingerprint === null) continue;
    const group = groups.get(item.fingerprint) ?? [];
    group.push(item.id);
    groups.set(item.fingerprint, group);
  }
  return [...groups.values()].filter((group) => group.length > 1);
}
