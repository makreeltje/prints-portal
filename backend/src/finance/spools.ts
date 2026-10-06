/**
 * A spool as it was when it was assigned (plan: "snapshot at assignment"):
 * later price changes in Spoolman do not change finished prints.
 */
export interface SpoolSnapshot {
  id: number;
  /** "eSun PLA+ Zwart": vendor and filament name. */
  name: string;
  vendor: string | null;
  material: string | null;
  /** #rrggbb, or null when Spoolman has no colour. */
  colour: string | null;
  /** Multi-colour filaments: every colour, #rrggbb. */
  colours: string[];
  multiColourDirection: 'coaxial' | 'longitudinal' | null;
  pricePerKg: number | null;
  takenAt: string;
}

export function parseSnapshot(text: string | null): SpoolSnapshot | null {
  if (text === null) return null;
  try {
    return JSON.parse(text) as SpoolSnapshot;
  } catch {
    return null;
  }
}
