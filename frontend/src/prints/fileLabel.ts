/**
 * Middle-truncated file labels for a row of buttons (design system 2.6).
 *
 * `.pp-fname` splits a name into `.a`, the head, which CSS shrinks with an
 * ellipsis, and `.b`, the tail, which never shrinks. The app chooses only where
 * to cut; the cut itself stays CSS, so text zoom or a different monospace
 * degrades at the real rendered width instead of at a character count.
 *
 * The tail is the extension plus three stem characters — never the end, because
 * the extension is often the only thing separating two names, and in an
 * enumerated family so is the character before the dot.
 *
 * Within one row no two labels may read the same. Where they would, the row
 * grows whichever end reaches the difference: the tail first, then the head (by
 * giving the tail back), against two floors — the extension always survives and
 * the head keeps two characters.
 *
 * It does not always succeed, and the design system says so rather than hiding
 * it: a window of 15 characters cannot show a difference in the middle of a
 * name longer than 22. Measured here, 40 of 1682 within-print pairs stay
 * ambiguous and 3 are byte-identical, where nothing can help. The picture, the
 * fixed order, the caption and the tooltip carry those.
 */

/** The 112px name box at `text-xs`, measured: 15 monospace characters. */
const WINDOW = 15;
/** The head may never be shorter than this. */
const HEAD_FLOOR = 2;
/** The tail is the extension plus this many stem characters, by default. */
const STEM = 3;

const extensionOf = (name: string): string => {
  const dot = name.lastIndexOf('.');
  return dot <= 0 ? '' : name.slice(dot);
};

/** How the row renders one name, used to compare two labels, not to draw them. */
function label(name: string, stem: number): string {
  if (name.length <= WINDOW) return name;
  const tail = Math.min(name.length - HEAD_FLOOR, extensionOf(name).length + stem);
  const head = Math.max(HEAD_FLOOR, WINDOW - 1 - tail);
  return `${name.slice(0, head)}…${name.slice(-tail)}`;
}

/**
 * The stem length this row should use: the first that renders every name
 * differently. Tail first (more stem), then head (less), and where no length
 * separates them it returns the default — two labels that agree are honest, and
 * a label that changes as you scroll is not.
 */
export function stemForRow(names: readonly string[]): number {
  const widest = WINDOW - 1 - HEAD_FLOOR;
  const grow: number[] = [];
  for (let stem = STEM; stem <= widest; stem++) grow.push(stem);
  const shrink: number[] = [];
  for (let stem = STEM - 1; stem >= 0; stem--) shrink.push(stem);
  for (const stem of [...grow, ...shrink]) {
    const seen = new Set(names.map((name) => label(name, stem)));
    if (seen.size === names.length) return stem;
  }
  return STEM;
}

/** The two halves `.pp-fname` draws. `.a` keeps the whole head; CSS cuts it. */
export function splitName(name: string, stem: number): { head: string; tail: string } {
  if (name.length <= WINDOW) return { head: name, tail: '' };
  const tail = Math.min(name.length - HEAD_FLOOR, extensionOf(name).length + stem);
  return { head: name.slice(0, name.length - tail), tail: name.slice(-tail) };
}
