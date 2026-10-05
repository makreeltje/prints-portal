/**
 * Tag rules: names are unique case-insensitively and at most 64 characters;
 * colours are stored as #rrggbb or null; the chip text colour is picked by
 * contrast (design-system/README.md, Colour: "#141a33 or #ffffff, whichever
 * has the higher contrast").
 */
export const MAX_TAG_NAME_LENGTH = 64;

/** The two chip text colours named in the design-system README. */
export const TAG_INK_DARK = '#141a33';
export const TAG_INK_LIGHT = '#ffffff';

export class TagNameError extends Error {
  override name = 'TagNameError';
}

/** Trims and collapses whitespace; throws when empty or longer than 64 characters. */
export function normalizeTagName(name: string): string {
  const normalized = name.trim().replace(/\s+/g, ' ');
  if (normalized === '') throw new TagNameError('tag name is empty');
  // Count code points, so an emoji counts as one character.
  if (Array.from(normalized).length > MAX_TAG_NAME_LENGTH) {
    throw new TagNameError(`tag name is longer than ${MAX_TAG_NAME_LENGTH} characters`);
  }
  return normalized;
}

/** Key for case-insensitive uniqueness. */
export function tagKey(name: string): string {
  return normalizeTagName(name).toLocaleLowerCase('nl-NL');
}

/** Accepts #rgb, #rrggbb, rgb or rrggbb in any case; anything else becomes null. */
export function normalizeHexColor(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  const hex = match?.[1];
  if (hex === undefined) return null;
  const full = hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex;
  return `#${full.toLowerCase()}`;
}

/** Text colour for a chip on `background` (#rrggbb). */
export function tagInkColor(background: string): string {
  const bg = normalizeHexColor(background);
  if (bg === null) throw new RangeError(`not a colour: ${background}`);
  const darkContrast = contrastRatio(bg, TAG_INK_DARK);
  const lightContrast = contrastRatio(bg, TAG_INK_LIGHT);
  return darkContrast >= lightContrast ? TAG_INK_DARK : TAG_INK_LIGHT;
}

/** WCAG 2.x contrast ratio between two #rrggbb colours. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** WCAG 2.x relative luminance of #rrggbb. */
export function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = channels.map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
