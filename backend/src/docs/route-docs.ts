import type { FastifyInstance } from 'fastify';
import type { ApiTag } from './openapi.js';

/**
 * Dutch summary and tag per endpoint, in one place so the route files stay
 * about behaviour. An `onRoute` hook copies these onto each route's schema,
 * which @fastify/swagger then turns into the OpenAPI document.
 *
 * A route without an entry is left untagged and `hideUntagged` keeps it out
 * of the docs; `undocumentedRoutes` lets the tests fail when a new route is
 * added without a summary, so the documentation cannot quietly fall behind.
 */

/** `METHOD /path` exactly as Fastify registers it. */
export type RouteKey = `${string} ${string}`;

export const ROUTE_DOCS: Record<RouteKey, { tag: ApiTag; summary: string }> = {
  // ------------------------------------------------------------------ prints
  'GET /api/prints': { tag: 'Prints', summary: 'Prints zoeken en filteren' },
  'GET /api/prints/:id': { tag: 'Prints', summary: 'Eén print met bestanden en bestellingen' },
  'DELETE /api/prints/:id': { tag: 'Prints', summary: 'Print verwijderen (verbergen)' },
  'POST /api/prints/:id/restore': { tag: 'Prints', summary: 'Verwijderde print herstellen' },
  'GET /api/prints/:id/thumbnail': { tag: 'Prints', summary: 'Miniatuur van een print' },
  'GET /api/prints/:id/model': { tag: 'Prints', summary: '3D-model van een print' },
  'PUT /api/prints/:id/tags': { tag: 'Prints', summary: 'Tags van een print instellen' },
  'POST /api/prints/bulk': { tag: 'Prints', summary: 'Actie op meerdere prints tegelijk' },
  'POST /api/prints/:id/orders': { tag: 'Prints', summary: 'Nabestelling maken' },
  'GET /api/assets/:id/download': { tag: 'Prints', summary: 'Bestand downloaden' },
  'GET /api/customers': { tag: 'Prints', summary: 'Klanten met aantallen en openstaand bedrag' },
  'DELETE /api/customers/:folder': {
    tag: 'Prints',
    summary: 'Alle prints van een klant verbergen',
  },
  'POST /api/customers/:folder/restore': { tag: 'Prints', summary: 'Verwijderde klant herstellen' },
  'GET /api/tags': { tag: 'Prints', summary: 'Alle tags' },
  'POST /api/tags': { tag: 'Prints', summary: 'Tag maken' },
  'PATCH /api/tags/:id': { tag: 'Prints', summary: 'Tag hernoemen of verkleuren' },
  'DELETE /api/tags/:id': { tag: 'Prints', summary: 'Tag verwijderen' },

  // ------------------------------------------------------------------ kosten
  'POST /api/calculate': { tag: 'Kosten', summary: 'Kosten van een losse berekening' },
  'PUT /api/prints/:id/spool': { tag: 'Kosten', summary: 'Spoel voor de hele print' },
  'PUT /api/prints/:id/lines/:lineId/override': {
    tag: 'Kosten',
    summary: 'Spoel of prijs per kilo voor één bestand of slot',
  },
  'PUT /api/prints/:id/lines/:lineId/excluded': {
    tag: 'Kosten',
    summary: 'Bestand wel of niet meetellen in de kosten',
  },
  'PUT /api/prints/:id/lines/:lineId/times': {
    tag: 'Kosten',
    summary: 'Aantal keer geprint instellen',
  },
  'PUT /api/orders/:orderId/overrides': {
    tag: 'Kosten',
    summary: 'Handmatige gram, tijd of prijs per kilo',
  },
  'GET /api/spools': { tag: 'Kosten', summary: 'Spoelen uit Spoolman' },
  'GET /api/spoolman/status': { tag: 'Kosten', summary: 'Status van de Spoolman-koppeling' },
  'POST /api/spoolman/refresh': { tag: 'Kosten', summary: 'Spoelen opnieuw ophalen' },
  'GET /api/settings': { tag: 'Kosten', summary: 'Instellingen lezen' },
  'GET /api/settings/markup': { tag: 'Kosten', summary: 'Standaardmarge' },
  'PUT /api/settings/pricing': {
    tag: 'Kosten',
    summary: 'Marge, stroomtarief en materiaalprijzen',
  },
  'PUT /api/settings/printers': { tag: 'Kosten', summary: 'Printerprofielen' },
  'PUT /api/settings/company': { tag: 'Kosten', summary: 'Bedrijfsgegevens' },
  'GET /api/settings/logo': { tag: 'Kosten', summary: 'Logo ophalen' },
  'PUT /api/settings/logo': { tag: 'Kosten', summary: 'Logo uploaden (PNG of SVG)' },
  'DELETE /api/settings/logo': { tag: 'Kosten', summary: 'Logo verwijderen' },

  // ---------------------------------------------------------------- facturen
  'GET /api/outstanding': { tag: 'Facturen', summary: 'Openstaand per klant' },
  'POST /api/outstanding/:folder/mark-paid': {
    tag: 'Facturen',
    summary: 'Alles van een klant als betaald markeren',
  },
  'PUT /api/orders/:orderId/sale-price': { tag: 'Facturen', summary: 'Verkoopprijs instellen' },
  'POST /api/orders/:orderId/payments': { tag: 'Facturen', summary: 'Betaling registreren' },
  'POST /api/orders/:orderId/payments/undo': {
    tag: 'Facturen',
    summary: 'Betaling ongedaan maken (beheerder)',
  },
  'POST /api/orders/:orderId/write-off': { tag: 'Facturen', summary: 'Bestelling afschrijven' },
  'DELETE /api/orders/:orderId/write-off': {
    tag: 'Facturen',
    summary: 'Afschrijving ongedaan maken (beheerder)',
  },
  'DELETE /api/orders/:orderId': { tag: 'Facturen', summary: 'Nabestelling verwijderen' },
  'PUT /api/customers/:folder/billing': {
    tag: 'Facturen',
    summary: 'Klant wel of niet factureren',
  },
  'GET /api/customers/:folder/invoice/preview': {
    tag: 'Facturen',
    summary: 'Voorbeeld van een factuur',
  },
  'GET /api/customers/:folder/invoice/concept.pdf': {
    tag: 'Facturen',
    summary: 'Concept-factuur als PDF',
  },
  'POST /api/customers/:folder/invoices': { tag: 'Facturen', summary: 'Factuur definitief maken' },
  'GET /api/customers/:folder/reminder.pdf': { tag: 'Facturen', summary: 'Herinnering als PDF' },
  'GET /api/invoices': { tag: 'Facturen', summary: 'Facturen en creditnota’s' },
  'GET /api/invoices/:id': { tag: 'Facturen', summary: 'Eén factuur met regels' },
  'GET /api/invoices/:id/pdf': { tag: 'Facturen', summary: 'Factuur als PDF' },
  'POST /api/invoices/:id/credit': { tag: 'Facturen', summary: 'Creditnota maken (beheerder)' },

  // -------------------------------------------------------------- deel-links
  'GET /api/share-links': { tag: 'Deel-links', summary: 'Deel-links (zonder token)' },
  'POST /api/share-links': {
    tag: 'Deel-links',
    summary: 'Deel-link maken; toont de link één keer',
  },
  'POST /api/share-links/:id/revoke': { tag: 'Deel-links', summary: 'Deel-link intrekken' },
  'GET /api/share/:token': { tag: 'Deel-links', summary: 'Publieke overzichtspagina (geen login)' },
  'GET /api/share/:token/overview.pdf': { tag: 'Deel-links', summary: 'Overzicht als PDF' },
  'GET /api/share/:token/logo': { tag: 'Deel-links', summary: 'Logo voor de overzichtspagina' },
  'GET /api/share/:token/prints/:printId/thumbnail': {
    tag: 'Deel-links',
    summary: 'Voorbeeldafbeelding van een regel op de overzichtspagina',
  },

  // ----------------------------------------------------------------- toegang
  'GET /api/auth/config': { tag: 'Toegang', summary: 'Welke aanmeldmethoden aanstaan' },
  'POST /api/auth/login': { tag: 'Toegang', summary: 'Aanmelden met naam of e-mailadres' },
  'POST /api/auth/logout': { tag: 'Toegang', summary: 'Afmelden' },
  'GET /api/auth/session': { tag: 'Toegang', summary: 'Huidige sessie' },
  'POST /api/auth/password': { tag: 'Toegang', summary: 'Eigen wachtwoord wijzigen' },
  'GET /api/users': { tag: 'Toegang', summary: 'Gebruikers' },
  'POST /api/users': { tag: 'Toegang', summary: 'Gebruiker maken' },
  'PATCH /api/users/:id': { tag: 'Toegang', summary: 'Rol wijzigen' },
  'DELETE /api/users/:id': { tag: 'Toegang', summary: 'Gebruiker verwijderen' },
  'POST /api/users/:id/password': { tag: 'Toegang', summary: 'Tijdelijk wachtwoord instellen' },
  'GET /api/access': { tag: 'Toegang', summary: 'Toegang per klant' },
  'PATCH /api/access': { tag: 'Toegang', summary: 'Toegang per klant wijzigen' },

  // ----------------------------------------------------------------- systeem
  'GET /healthz': { tag: 'Systeem', summary: 'Status van database en printsmap' },
  'POST /api/admin/reindex': { tag: 'Systeem', summary: 'Opnieuw indexeren' },
  'GET /api/live': { tag: 'Systeem', summary: 'Live updates (WebSocket)' },
};

/** Routes that are deliberately not in the docs. */
const UNDOCUMENTED = new Set<RouteKey>([
  'GET /api/openapi.json',
  // OIDC redirects are browser flows, not an API to call.
  'GET /api/auth/oidc/login',
  'GET /api/auth/oidc/callback',
]);

/** Copies the summary and tag onto every route's schema before it is compiled. */
export function registerRouteDocs(app: FastifyInstance): void {
  app.addHook('onRoute', (route) => {
    const methods = Array.isArray(route.method) ? route.method : [route.method];
    for (const method of methods) {
      if (method === 'HEAD' || method === 'OPTIONS') continue;
      const entry = ROUTE_DOCS[`${method} ${route.url}`];
      if (entry === undefined) continue;
      const schema = (route.schema ?? {}) as Record<string, unknown>;
      route.schema = { ...schema, tags: [entry.tag], summary: entry.summary };
    }
  });
}

/** Every route either has a summary or is listed as deliberately undocumented. */
export function undocumentedRoutes(routes: readonly RouteKey[]): RouteKey[] {
  return routes.filter((key) => ROUTE_DOCS[key] === undefined && !UNDOCUMENTED.has(key));
}
