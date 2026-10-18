import { describe, expect, it } from 'vitest';
import {
  pricePerKg,
  SpoolmanClient,
  SpoolmanUnavailableError,
  toOption,
  type RawSpool,
} from '../../src/finance/spoolman.js';

const spool = (overrides: Partial<RawSpool> = {}): RawSpool => ({
  id: 3,
  price: 20,
  initial_weight: 800,
  remaining_weight: 100,
  filament: {
    name: 'PETG Blauw',
    material: 'PETG',
    price: 18,
    weight: 1000,
    color_hex: '0055FFCC',
    vendor: { name: 'Sunlu' },
  },
  ...overrides,
});

describe('Spoolman v0.27.0 mapping', () => {
  it('takes the spool price over its net weight, else the filament price', () => {
    expect(pricePerKg(spool())).toBe(25);
    expect(pricePerKg(spool({ price: null }))).toBe(18);
    expect(pricePerKg(spool({ initial_weight: 0 }))).toBe(18);
    expect(
      pricePerKg(spool({ price: null, filament: { ...spool().filament, weight: null } })),
    ).toBeNull();
  });

  it('builds the name and colours, dropping the alpha channel', () => {
    expect(toOption(spool())).toEqual({
      id: 3,
      name: 'Sunlu PETG Blauw',
      vendor: 'Sunlu',
      material: 'PETG',
      colour: '#0055ff',
      colours: [],
      multiColourDirection: null,
      pricePerKg: 25,
      remainingWeight: 100,
      archived: false,
    });
    const multi = toOption(
      spool({
        filament: {
          name: 'Silk Dual',
          material: 'PLA',
          multi_color_hexes: 'D4AF37,C0C0C0',
          multi_color_direction: 'longitudinal',
          vendor: null,
        },
      }),
    );
    expect(multi).toMatchObject({
      name: 'Silk Dual',
      vendor: null,
      colour: '#d4af37',
      colours: ['#d4af37', '#c0c0c0'],
      multiColourDirection: 'longitudinal',
    });
  });
});

describe('SpoolmanClient', () => {
  it('caches the list and reports its status', async () => {
    let calls = 0;
    let clock = 0;
    const client = new SpoolmanClient({
      url: 'http://spoolman.test',
      timeoutMs: 100,
      cacheMs: 60_000,
      now: () => new Date(clock),
      fetch: () => {
        calls += 1;
        return Promise.resolve(Response.json([spool()]));
      },
    });
    await client.listSpools();
    await client.listSpools();
    expect(calls).toBe(1);
    clock = 61_000;
    await client.listSpools();
    expect(calls).toBe(2);
    expect(await client.status()).toMatchObject({
      configured: true,
      reachable: true,
      spoolCount: 1,
    });
  });

  it('asks for the archive too, puts it last, and leaves it out of the count', async () => {
    let asked = '';
    const client = new SpoolmanClient({
      url: 'http://spoolman.test',
      timeoutMs: 100,
      cacheMs: 0,
      fetch: (input) => {
        asked = input instanceof Request ? input.url : String(input);
        return Promise.resolve(
          Response.json([
            spool({ id: 7, archived: true, remaining_weight: 0 }),
            spool({ id: 8 }),
            spool({ id: 9, archived: false }),
          ]),
        );
      },
    });
    const spools = await client.listSpools();
    expect(asked).toContain('allow_archived=true');
    // An empty spool is still the one an old print was made with.
    expect(spools.map((one) => one.id)).toEqual([8, 9, 7]);
    expect(spools.map((one) => one.archived)).toEqual([false, false, true]);
    expect(spools.map((one) => one.remainingWeight)).toEqual([100, 100, 0]);
    // The status card counts stock, and an archived spool is not stock.
    expect(await client.status()).toMatchObject({ spoolCount: 2 });
  });

  it('turns a timeout or an error status into SpoolmanUnavailableError', async () => {
    const slow = new SpoolmanClient({
      url: 'http://spoolman.test',
      timeoutMs: 20,
      cacheMs: 0,
      fetch: ((_input: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new Error('aborted'));
          });
        })) as typeof fetch,
    });
    await expect(slow.listSpools()).rejects.toBeInstanceOf(SpoolmanUnavailableError);
    expect(await slow.status()).toMatchObject({ reachable: false });

    const broken = new SpoolmanClient({
      url: 'http://spoolman.test',
      timeoutMs: 100,
      cacheMs: 0,
      fetch: () => Promise.resolve(new Response('oops', { status: 500 })),
    });
    await expect(broken.listSpools()).rejects.toBeInstanceOf(SpoolmanUnavailableError);
    expect(await broken.getSpool(1).catch((e: unknown) => e)).toBeInstanceOf(
      SpoolmanUnavailableError,
    );
  });

  it('is hidden when not configured', async () => {
    const client = new SpoolmanClient({ url: null, timeoutMs: 100, cacheMs: 0 });
    expect(client.configured).toBe(false);
    expect(await client.status()).toEqual({
      configured: false,
      url: null,
      reachable: false,
      spoolCount: null,
      lastSync: null,
    });
  });
});
