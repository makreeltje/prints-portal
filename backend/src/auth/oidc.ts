import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import * as client from 'openid-client';
import type { OidcConfig } from '../config/config.js';
import type { AppDatabase } from '../db/connection.js';
import { isSecureRequest, setSessionCookie } from './guard.js';
import type { SessionStore } from './sessions.js';
import { createUser, normalizeEmail, type UserRow } from './users.js';

const FLOW_COOKIE = 'pp_oidc';
const FLOW_COOKIE_PATH = '/api/auth/oidc';
const FLOW_MAX_AGE_SECONDS = 10 * 60;
export const CALLBACK_PATH = '/api/auth/oidc/callback';
/** Where the browser lands when sign-in through the identity provider fails. */
export const OIDC_FAILURE_REDIRECT = '/login?error=oidc';

interface FlowState {
  state: string;
  nonce: string;
  codeVerifier: string;
}

/** What the identity provider tells us about the person signing in. */
export interface OidcIdentity {
  subject: string;
  email: string;
  name: string | null;
  groups: readonly string[];
}

/**
 * Authorization code flow with PKCE as a confidential client. The provider's
 * metadata is fetched on first use (not at startup, so the app starts while
 * the provider is down) and fetched again after a failure.
 */
export class OidcClient {
  private configuration: Promise<client.Configuration> | null = null;

  constructor(
    private readonly oidc: OidcConfig,
    private readonly publicUrl: string,
  ) {}

  get redirectUri(): string {
    return `${this.publicUrl}${CALLBACK_PATH}`;
  }

  async start(): Promise<{ url: URL; flow: FlowState }> {
    const config = await this.config();
    const flow: FlowState = {
      state: client.randomState(),
      nonce: client.randomNonce(),
      codeVerifier: client.randomPKCECodeVerifier(),
    };
    const url = client.buildAuthorizationUrl(config, {
      redirect_uri: this.redirectUri,
      scope: 'openid email profile',
      state: flow.state,
      nonce: flow.nonce,
      code_challenge: await client.calculatePKCECodeChallenge(flow.codeVerifier),
      code_challenge_method: 'S256',
    });
    return { url, flow };
  }

  async finish(callbackUrl: URL, flow: FlowState): Promise<OidcIdentity> {
    const config = await this.config();
    const tokens = await client.authorizationCodeGrant(config, callbackUrl, {
      pkceCodeVerifier: flow.codeVerifier,
      expectedState: flow.state,
      expectedNonce: flow.nonce,
      idTokenExpected: true,
    });
    const idClaims = tokens.claims();
    if (idClaims === undefined) throw new Error('the provider returned no ID token');
    // Groups and e-mail may live only in the userinfo response, depending on the provider setup.
    const userInfo = await client.fetchUserInfo(config, tokens.access_token, idClaims.sub);
    const claims: Record<string, unknown> = { ...userInfo, ...idClaims };

    const email = typeof claims.email === 'string' ? normalizeEmail(claims.email) : '';
    if (email === '') throw new Error('the provider returned no e-mail address');
    const name =
      typeof claims.name === 'string' && claims.name.trim() !== ''
        ? claims.name.trim()
        : typeof claims.preferred_username === 'string'
          ? claims.preferred_username
          : null;
    const groups = Array.isArray(claims.groups)
      ? claims.groups.filter((group): group is string => typeof group === 'string')
      : [];
    return { subject: idClaims.sub, email, name, groups };
  }

  private config(): Promise<client.Configuration> {
    this.configuration ??= client
      .discovery(
        this.oidc.issuer,
        this.oidc.clientId,
        this.oidc.clientSecret,
        undefined,
        // A plain-http issuer only makes sense on a test or lab network.
        this.oidc.issuer.protocol === 'http:'
          ? // eslint-disable-next-line @typescript-eslint/no-deprecated -- deliberate, for http issuers only
            { execute: [client.allowInsecureRequests] }
          : undefined,
      )
      .catch((error: unknown) => {
        this.configuration = null;
        throw error;
      });
    return this.configuration;
  }
}

/**
 * Finds or creates the user for an identity: by subject, else by e-mail
 * address (so an account made before OIDC was switched on is taken over),
 * else a new User. Membership of OIDC_ADMIN_GROUP makes an Admin; leaving
 * the group demotes to User only when the group gave the role, so roles set
 * by hand stay.
 */
export async function provisionOidcUser(
  db: AppDatabase,
  identity: OidcIdentity,
  adminGroup: string,
  now: Date,
): Promise<UserRow> {
  const isAdmin = identity.groups.includes(adminGroup);
  const existing =
    (await db
      .selectFrom('users')
      .selectAll()
      .where('oidc_subject', '=', identity.subject)
      .executeTakeFirst()) ??
    (await db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', identity.email)
      .where('oidc_subject', 'is', null)
      .executeTakeFirst());

  if (existing === undefined) {
    const created = await createUser(
      db,
      {
        email: identity.email,
        displayName: identity.name ?? identity.email,
        role: isAdmin ? 'Admin' : 'User',
        oidcSubject: identity.subject,
        roleFromGroup: isAdmin,
      },
      now,
    );
    await db
      .updateTable('users')
      .set({ last_login_at: now.toISOString() })
      .where('id', '=', created.id)
      .execute();
    return { ...created, last_login_at: now.toISOString() };
  }

  const role = isAdmin ? 'Admin' : existing.role_from_group === 1 ? 'User' : existing.role;
  const emailTaken =
    identity.email !== existing.email &&
    (await db
      .selectFrom('users')
      .select('id')
      .where('email', '=', identity.email)
      .executeTakeFirst()) !== undefined;
  const changes = {
    oidc_subject: identity.subject,
    email: emailTaken ? existing.email : identity.email,
    display_name: identity.name ?? existing.display_name,
    role,
    role_from_group: isAdmin ? 1 : 0,
    // The identity provider owns the credentials from now on.
    password_hash: null,
    last_login_at: now.toISOString(),
  };
  await db.updateTable('users').set(changes).where('id', '=', existing.id).execute();
  return { ...existing, ...changes };
}

export function registerOidcRoutes(
  app: FastifyInstance,
  deps: {
    db: AppDatabase;
    sessions: SessionStore;
    oidc: OidcConfig;
    publicUrl: string;
    now: () => Date;
  },
): void {
  const oidcClient = new OidcClient(deps.oidc, deps.publicUrl);

  app.get('/api/auth/oidc/login', { config: { auth: 'public' } }, async (request, reply) => {
    try {
      const { url, flow } = await oidcClient.start();
      reply.setCookie(FLOW_COOKIE, JSON.stringify(flow), {
        path: FLOW_COOKIE_PATH,
        httpOnly: true,
        // Lax: the cookie must come along on the provider's top-level redirect back.
        sameSite: 'lax',
        secure: isSecureRequest(request),
        maxAge: FLOW_MAX_AGE_SECONDS,
        signed: true,
      });
      return await reply.redirect(url.href);
    } catch (error) {
      request.log.error({ err: error }, 'could not start OIDC sign-in');
      return reply.redirect(OIDC_FAILURE_REDIRECT);
    }
  });

  app.get(CALLBACK_PATH, { config: { auth: 'public' } }, async (request, reply) => {
    const flow = readFlow(request);
    clearFlowCookie(request, reply);
    if (flow === null) {
      request.log.warn('OIDC callback without a valid sign-in cookie');
      return reply.redirect(OIDC_FAILURE_REDIRECT);
    }
    try {
      const callbackUrl = new URL(request.url, `${deps.publicUrl}/`);
      const identity = await oidcClient.finish(callbackUrl, flow);
      const user = await provisionOidcUser(deps.db, identity, deps.oidc.adminGroup, deps.now());
      if (request.auth !== null) await deps.sessions.destroy(request.auth.idHash);
      const session = await deps.sessions.create(user.id);
      setSessionCookie(request, reply, session.token, session.expiresAt);
      request.log.info({ userId: user.id, role: user.role }, 'signed in through OIDC');
      return await reply.redirect('/');
    } catch (error) {
      request.log.warn({ err: error }, 'OIDC sign-in failed');
      return reply.redirect(OIDC_FAILURE_REDIRECT);
    }
  });
}

function readFlow(request: FastifyRequest): FlowState | null {
  const raw = request.cookies[FLOW_COOKIE];
  if (raw === undefined) return null;
  const unsigned = request.unsignCookie(raw);
  if (!unsigned.valid) return null;
  try {
    const parsed = JSON.parse(unsigned.value) as Partial<FlowState>;
    const { state, nonce, codeVerifier } = parsed;
    return typeof state === 'string' &&
      typeof nonce === 'string' &&
      typeof codeVerifier === 'string'
      ? { state, nonce, codeVerifier }
      : null;
  } catch {
    return null;
  }
}

function clearFlowCookie(request: FastifyRequest, reply: FastifyReply): void {
  reply.clearCookie(FLOW_COOKIE, {
    path: FLOW_COOKIE_PATH,
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(request),
  });
}
