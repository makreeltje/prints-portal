/**
 * The link inside a Windows `.url` shortcut.
 *
 * These are plain INI files that Windows and Nextcloud both leave alone:
 *
 *     [InternetShortcut]
 *     URL=https://www.printables.com/model/417260-laptop-tablet-foldable-stand
 *
 * All 16 in the owner's library are of exactly this shape. The parser is
 * deliberately forgiving about the rest of the file — other keys (`IDList`,
 * `Prop3`) and other sections are ignored, and CRLF is expected rather than
 * tolerated, because these files are written on Windows.
 *
 * Only absolute http(s) links are returned. A `file:` shortcut points at
 * someone's own disk and means nothing to this app or to a klant.
 */
export function readUrlShortcut(contents: string): string | null {
  for (const line of contents.split(/\r?\n/)) {
    const match = /^URL\s*=\s*(.+)$/i.exec(line.trim());
    if (match === null) continue;
    const value = match[1]?.trim() ?? '';
    if (!isHttpUrl(value)) continue;
    return value;
  }
  return null;
}

/** An absolute http(s) URL: the only thing a bron may be (PrintSource). */
export function isHttpUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  return parsed.protocol === 'http:' || parsed.protocol === 'https:';
}

/**
 * What a bron shows: host and path, without the scheme (PrintSource).
 *
 * The scheme is noise in a list of links and the host is what says at a glance
 * which site this is. `www.` goes too — it distinguishes nothing and costs
 * four characters of a line that truncates.
 */
export function sourceLabel(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return value;
  }
  const host = parsed.host.replace(/^www\./, '');
  const rest = `${parsed.pathname}${parsed.search}${parsed.hash}`;
  return `${host}${rest === '/' ? '' : rest}`;
}
