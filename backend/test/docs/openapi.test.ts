import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { undocumentedRoutes, type RouteKey } from '../../src/docs/route-docs.js';
import { startTestApp, TEST_SESSION_SECRET, type Session, type TestApp } from '../helpers/app.js';
import { TEST_DATABASES } from '../helpers/databases.js';

interface OpenApiDocument {
  openapi: string;
  info: { title: string; version: string; description: string };
  tags: { name: string }[];
  paths: Record<string, Record<string, { summary?: string; tags?: string[] }>>;
  components?: { securitySchemes?: Record<string, unknown> };
}

describe.each(TEST_DATABASES)('OpenAPI document on $name', ({ url }) => {
  let t: TestApp;
  let admin: Session;
  let helper: Session;

  beforeEach(async () => {
    t = await startTestApp(url);
    await t.addUser('owner@example.org', 'Admin');
    await t.addUser('helper@example.org', 'User');
    admin = await t.login('owner@example.org');
    helper = await t.login('helper@example.org');
  });

  afterEach(async () => {
    await t.close();
  });

  const document = async () =>
    (await t.as(admin, { url: '/api/openapi.json' })).json<OpenApiDocument>();

  it('describes the API with Dutch summaries under the six tags', async () => {
    const doc = await document();
    expect(doc.openapi).toMatch(/^3\./);
    expect(doc.info).toMatchObject({ title: '3D Prints Portal API', version: '1' });
    expect(doc.tags.map((tag) => tag.name)).toEqual([
      'Prints',
      'Kosten',
      'Facturen',
      'Deel-links',
      'Toegang',
      'Systeem',
    ]);
    // Fastify's :param becomes OpenAPI's {param}.
    expect(doc.paths['/api/prints/{id}']?.get).toMatchObject({
      summary: 'Eén print met bestanden en bestellingen',
      tags: ['Prints'],
    });
    expect(doc.paths['/api/share/{token}']?.get?.tags).toEqual(['Deel-links']);
    // The browser sends the session cookie itself, so the document declares no
    // scheme and the page shows no credential field; the description says it.
    expect(doc.components?.securitySchemes).toBeUndefined();
    expect(doc.info.description).toContain('sessiecookie');
    expect(doc.info.description).toContain('x-csrf-token');
    // Password fields belong in the docs; their values and the session secret do not.
    const json = JSON.stringify(doc);
    expect(json).not.toContain(TEST_SESSION_SECRET);
    expect(json).not.toMatch(/"(example|default)":\s*"[^"]*(pass|secret|token)/i);
  });

  it('documents every route, so a new endpoint cannot be forgotten', async () => {
    const doc = await document();
    const routes: RouteKey[] = [];
    for (const [path, methods] of Object.entries(doc.paths)) {
      for (const method of Object.keys(methods)) {
        routes.push(`${method.toUpperCase()} ${path.replace(/\{(\w+)\}/g, ':$1')}`);
      }
    }
    // Everything the document holds is tagged, and nothing is tagged twice.
    expect(undocumentedRoutes(routes)).toEqual([]);
    for (const methods of Object.values(doc.paths)) {
      for (const operation of Object.values(methods)) {
        expect(operation.summary ?? '').not.toBe('');
        expect(operation.tags).toHaveLength(1);
      }
    }
    // The spec itself and the OIDC browser redirects stay out.
    expect(doc.paths['/api/openapi.json']).toBeUndefined();
    expect(doc.paths['/api/auth/oidc/login']).toBeUndefined();
  });

  it('is readable by every signed-in role but not anonymously', async () => {
    expect((await t.as(helper, { url: '/api/openapi.json' })).statusCode).toBe(200);
    expect((await t.as(null, { url: '/api/openapi.json' })).statusCode).toBe(401);
  });
});
