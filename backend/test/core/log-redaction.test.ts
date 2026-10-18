import { describe, expect, it } from 'vitest';
import { redactUrl, REDACTED } from '../../src/core/log-redaction.js';

describe('log redaction', () => {
  const token = 'cm7Mk4dUiEpqpmuHZtzvyKJS32_xngf2SXx-ppKdGWE';

  it('masks a Deel-link token, which is the whole credential', () => {
    expect(redactUrl(`/api/share/${token}`)).toBe(`/api/share/${REDACTED}`);
    expect(redactUrl(`/api/share/${token}/overview.pdf`)).toBe(
      `/api/share/${REDACTED}/overview.pdf`,
    );
    expect(redactUrl(`/api/share/${token}/logo`)).toBe(`/api/share/${REDACTED}/logo`);
    expect(redactUrl(`/api/share/${token}?onlyOpen=true`)).toBe(
      `/api/share/${REDACTED}?onlyOpen=true`,
    );
    expect(redactUrl(`/api/share/${token}`)).not.toContain(token);
  });

  it('masks the OIDC authorization code and state', () => {
    const url = redactUrl('/api/auth/oidc/callback?code=abc123&state=xyz789&iss=https%3A%2F%2Fa');
    expect(url).toBe(
      `/api/auth/oidc/callback?code=${REDACTED}&state=${REDACTED}&iss=https%3A%2F%2Fa`,
    );
    for (const secret of ['abc123', 'xyz789']) expect(url).not.toContain(secret);
  });

  it('leaves ordinary paths and their parameters alone', () => {
    expect(redactUrl('/api/prints?limit=100&customer=Koen')).toBe(
      '/api/prints?limit=100&customer=Koen',
    );
    expect(redactUrl('/api/share-links')).toBe('/api/share-links');
    expect(redactUrl('/healthz')).toBe('/healthz');
    // A klant folder named like the share path must not be mistaken for a token.
    expect(redactUrl('/api/customers/share/invoice/preview')).toBe(
      '/api/customers/share/invoice/preview',
    );
  });

  it('keeps a fragment and survives odd shapes', () => {
    expect(redactUrl(`/api/share/${token}#top`)).toBe(`/api/share/${REDACTED}#top`);
    expect(redactUrl('/api/share/')).toBe('/api/share/');
    expect(redactUrl('')).toBe('');
  });
});
