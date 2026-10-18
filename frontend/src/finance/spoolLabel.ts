/**
 * Where a spool's name is cut when the trigger has to shrink (SpoolPicker
 * 2.14, GAP-163).
 *
 * `.pp-fname` draws two halves: `.a`, which CSS shrinks with an ellipsis, and
 * `.b`, which never shrinks. For a file name the tail is the extension plus a
 * few stem characters (`fileLabel.ts`); for a spool the design system says the
 * tail is the **last word** — a spool is identified at both ends, brand and
 * material at the front and the colour or line at the back, so "Creality
 * Rainbow Wild Blossom Hyper" must read "Creality Rainbow Wild…Hyper" rather
 * than lose its end.
 *
 * The separating space stays on the head, so the untruncated name renders with
 * its space and the truncated one puts the ellipsis where the space was.
 */
export function splitSpoolName(name: string): { head: string; tail: string } {
  const cut = name.trimEnd().lastIndexOf(' ');
  if (cut <= 0) return { head: name, tail: '' };
  return { head: name.slice(0, cut + 1), tail: name.slice(cut + 1) };
}
