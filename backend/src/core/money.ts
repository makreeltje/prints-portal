/**
 * Rounding rules from the brief: money to 2 decimals, energy to 3, both
 * half away from zero. Binary floating point can turn 1.005 into
 * 1.00499999…, so the scaled value is first normalised to 15 significant
 * digits before rounding.
 */
export function roundHalfAwayFromZero(value: number, decimals: number): number {
  if (!Number.isFinite(value)) throw new RangeError(`cannot round ${String(value)}`);
  const factor = 10 ** decimals;
  const scaled = Number((Math.abs(value) * factor).toPrecision(15));
  const rounded = (Math.sign(value) * Math.round(scaled)) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function roundMoney(value: number): number {
  return roundHalfAwayFromZero(value, 2);
}

export function roundEnergy(value: number): number {
  return roundHalfAwayFromZero(value, 3);
}

/** Euros (2 decimals) to integer cents for storage. */
export function toCents(euros: number): number {
  return Math.round(roundMoney(euros) * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}
