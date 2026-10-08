/**
 * What an uploaded SVG logo may contain (design system 2.0, GAP-104).
 *
 * The container ships no fonts and the rasteriser is given no font
 * configuration, so `<text>` renders as nothing at all: measured in the running
 * container, an SVG holding one rectangle and one word drew 1600 opaque pixels
 * for the shape and 0 for the text. Accepting such a file produced a logo that
 * silently lost the studio's name, on screen and on every document. It is
 * refused instead, with a reason the field can show.
 */
export type SvgRefusal = 'svg_text' | 'svg_external';

/** Comments and CDATA may hide anything, so they go before the checks. */
function stripNoise(source: string): string {
  return source.replace(/<!--[\s\S]*?-->/g, '').replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
}

/**
 * Null when the SVG may be rasterised, otherwise why it may not.
 *
 * It reads the source rather than parsing it: the question is only whether
 * certain elements and references occur at all, and a parser would accept
 * namespaced spellings this has to catch anyway.
 */
export function refuseSvg(source: Buffer | string): SvgRefusal | null {
  const text = stripNoise(typeof source === 'string' ? source : source.toString('utf8'));

  // Any element that needs a font to draw, including namespaced spellings.
  if (/<\s*(?:[A-Za-z0-9_-]+:)?(?:text|tspan|textPath|altGlyph)[\s/>]/i.test(text)) {
    return 'svg_text';
  }
  // Anything the file cannot carry on its own.
  if (/@import/i.test(text)) return 'svg_external';
  for (const match of text.matchAll(/\b(?:xlink:)?href\s*=\s*["']([^"']*)["']/gi)) {
    const target = (match[1] ?? '').trim();
    // A fragment points inside the file; a data URI carries its own bytes.
    if (target === '' || target.startsWith('#') || target.toLowerCase().startsWith('data:')) {
      continue;
    }
    return 'svg_external';
  }
  return null;
}
