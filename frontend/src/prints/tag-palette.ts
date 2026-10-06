/** Tag palette keys from design-system v1.3 (`data-c`, tokens `--tag-<key>`), in palette order. */
export const TAG_PALETTE = [
  'rose',
  'orange',
  'amber',
  'lime',
  'teal',
  'sky',
  'blue',
  'violet',
  'lilac',
  'grey',
] as const;

export type TagPaletteKey = (typeof TAG_PALETTE)[number];

export function isPaletteKey(value: string): value is TagPaletteKey {
  return (TAG_PALETTE as readonly string[]).includes(value);
}

/** Tag names: at most 64 characters (code points), unique regardless of case. */
export const MAX_TAG_NAME_LENGTH = 64;

export function normalizeTagName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function tagKey(name: string): string {
  return normalizeTagName(name).toLocaleLowerCase('nl-NL');
}

export function tagNameTooLong(name: string): boolean {
  return Array.from(normalizeTagName(name)).length > MAX_TAG_NAME_LENGTH;
}
