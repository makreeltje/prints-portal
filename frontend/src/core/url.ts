/**
 * An absolute http(s) URL: the only thing a bron may be (PrintSource).
 *
 * The same rule the backend enforces, checked here so the operator sees the
 * error before a request goes out rather than after one comes back.
 */
export function isHttpUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  return parsed.protocol === 'http:' || parsed.protocol === 'https:';
}
