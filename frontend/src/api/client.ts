/**
 * Thin fetch wrapper for /api: JSON in and out, the session's CSRF token on
 * changing requests, and one place that hears about an expired session.
 */
export class ApiError extends Error {
  override name = 'ApiError';

  constructor(
    readonly status: number,
    /** The `error` code from the response body, when there is one. */
    readonly code: string | null,
  ) {
    super(`API request failed with ${String(status)}${code === null ? '' : ` (${code})`}`);
  }
}

let csrfToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

/** Called when a request answers 401, so the app can return to the login page. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export async function api<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    /** A file sent as it is (logo upload), with its media type. */
    raw?: { data: Blob; type: string };
    quiet401?: boolean;
  } = {},
): Promise<T> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = { accept: 'application/json' };
  if (options.raw !== undefined) headers['content-type'] = options.raw.type;
  else if (options.body !== undefined) headers['content-type'] = 'application/json';
  if (!SAFE_METHODS.has(method) && csrfToken !== null) headers['x-csrf-token'] = csrfToken;

  const response = await fetch(path, {
    method,
    headers,
    credentials: 'same-origin',
    body:
      options.raw !== undefined
        ? options.raw.data
        : options.body === undefined
          ? undefined
          : JSON.stringify(options.body),
  });
  if (!response.ok) {
    const code = await response
      .json()
      .then((body: unknown) =>
        typeof body === 'object' &&
        body !== null &&
        'error' in body &&
        typeof body.error === 'string'
          ? body.error
          : null,
      )
      .catch(() => null);
    if (response.status === 401 && options.quiet401 !== true) onUnauthorized?.();
    throw new ApiError(response.status, code);
  }
  /*
    An empty body is not JSON, and `response.json()` throws a SyntaxError on
    it that a caller cannot tell apart from a failed request. That is how
    "Markeer als betaald" reported an error on every payment it had just
    saved: the route answered 201 with `content-length: 0`, which is not the
    204 this used to look for. A 204 is still the usual case; any other answer
    without a body is read the same way.
  */
  const text = await response.text();
  return (text === '' ? undefined : JSON.parse(text)) as T;
}
