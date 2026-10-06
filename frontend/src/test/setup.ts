import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// jsdom has no modal dialogs; mirror the browser's open attribute and close event.
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

/**
 * A WebSocket that never connects; tests drive it with `FakeWebSocket.last.receive(…)`.
 */
export class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  static get last(): FakeWebSocket | undefined {
    return FakeWebSocket.instances.at(-1);
  }
  readonly sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  constructor(readonly url: string) {
    FakeWebSocket.instances.push(this);
  }
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    // Closed by the app: no close event, like a socket that is being torn down.
  }
  open() {
    this.onopen?.();
  }
  receive(payload: object) {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }
  drop(code = 1006) {
    this.onclose?.({ code });
  }
}

/** Empty answers for the dashboard's requests; tests that need data stub fetch themselves. */
function emptyApi(input: string): Promise<Response> {
  const path = input.split('?')[0];
  const body =
    path === '/api/prints'
      ? { items: [], total: 0 }
      : path === '/api/customers'
        ? { customers: [] }
        : path === '/api/tags'
          ? { tags: [] }
          : path === '/healthz'
            ? { status: 'ok', checks: { printsRoot: { status: 'up' } } }
            : path === '/api/settings'
              ? {
                  pricing: {
                    defaultMarkupPercent: null,
                    tariffEurPerKwh: null,
                    materialPricesPerKg: {},
                  },
                  printers: [],
                  company: { name: '', iban: '', address: '', email: null, phone: null },
                }
              : path === '/api/spoolman/status'
                ? {
                    configured: false,
                    url: null,
                    reachable: false,
                    spoolCount: null,
                    lastSync: null,
                  }
                : {};
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  );
}

beforeEach(() => {
  FakeWebSocket.instances = [];
  vi.stubGlobal('WebSocket', FakeWebSocket);
  vi.stubGlobal('fetch', vi.fn(emptyApi));
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});
