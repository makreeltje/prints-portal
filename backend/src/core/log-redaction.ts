/**
 * Some URLs carry a credential rather than an identifier, and Fastify logs the
 * URL of every request. A Deel-link token is the only thing standing between a
 * visitor and a klant's prints, and an OIDC callback carries the authorization
 * code, so neither may end up in a log that gets copied into a terminal, a
 * ticket or a log collector.
 */

/** `/api/share/<token>` and anything under it; the token is the whole secret. */
const SHARE_PATH = /^(\/api\/share\/)[^/?#]+/;
/** Query parameters that are credentials wherever they appear. */
const SECRET_PARAMS = new Set(['code', 'state', 'token', 'access_token', 'id_token']);

export const REDACTED = '[redacted]';

/** The URL as it may be logged: the path kept, the credentials in it masked. */
export function redactUrl(url: string): string {
  const [pathAndQuery, hash] = splitOnce(url, '#');
  const [pathname, query] = splitOnce(pathAndQuery, '?');
  const safePath = pathname.replace(SHARE_PATH, `$1${REDACTED}`);
  if (query === undefined) return hash === undefined ? safePath : `${safePath}#${hash}`;

  const safeQuery = query
    .split('&')
    .map((pair) => {
      const [name] = splitOnce(pair, '=');
      return SECRET_PARAMS.has(decodeURIComponent(name)) ? `${name}=${REDACTED}` : pair;
    })
    .join('&');
  const rebuilt = `${safePath}?${safeQuery}`;
  return hash === undefined ? rebuilt : `${rebuilt}#${hash}`;
}

function splitOnce(value: string, separator: string): [string, string | undefined] {
  const index = value.indexOf(separator);
  return index === -1 ? [value, undefined] : [value.slice(0, index), value.slice(index + 1)];
}
