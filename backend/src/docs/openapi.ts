import type { FastifyInstance } from 'fastify';

/**
 * The OpenAPI document for `/api-docs`. @fastify/swagger reads the JSON
 * schemas the routes already carry, so there is one source of truth for
 * validation and documentation; `describeRoute` adds the Dutch summary and
 * the tag a route is listed under.
 */

/** Tags in the order the docs show them. */
export const API_TAGS = [
  { name: 'Prints', description: 'Prints, bestanden, miniaturen en tags' },
  { name: 'Kosten', description: 'Kosten, spoelen en instellingen' },
  { name: 'Facturen', description: 'Openstaand, facturen en creditnota’s' },
  { name: 'Deel-links', description: 'Deel-links en de publieke overzichtspagina' },
  { name: 'Toegang', description: 'Aanmelden, gebruikers en toegang' },
  { name: 'Systeem', description: 'Status, indexeren en documentatie' },
] as const;

export type ApiTag = (typeof API_TAGS)[number]['name'];

export const openapiOptions = {
  openapi: {
    openapi: '3.1.0',
    info: {
      title: '3D Prints Portal API',
      version: '1',
      description:
        'De API achter het portaal. Er is geen inlogveld: de documentatie ' +
        'gebruikt je sessie. Elk verzoek gaat met de sessiecookie; wijzigende ' +
        'verzoeken sturen de CSRF-token mee in de header `x-csrf-token`.',
    },
    tags: API_TAGS.map((tag) => ({ ...tag })),
    // No securitySchemes and no `security`: the browser sends the session cookie
    // by itself, so an authentication panel would only show a field nobody fills
    // in. The description above says how signing in works.
  },
  /** Routes without a tag (static files, the SPA fallback) stay out of the docs. */
  hideUntagged: true,
};

/** Serves the generated document; every signed-in role may read it. */
export function registerOpenapiRoute(app: FastifyInstance): void {
  app.get(
    '/api/openapi.json',
    { schema: { hide: true } },
    () => app.swagger() as Record<string, unknown>,
  );
}
