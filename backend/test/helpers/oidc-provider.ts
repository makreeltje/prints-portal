import { createHash, randomBytes } from 'node:crypto';
import Fastify, { type FastifyInstance } from 'fastify';
import { exportJWK, generateKeyPair, SignJWT, type JWK } from 'jose';

/**
 * A minimal OpenID Connect provider for tests: discovery, authorize (no
 * login page; the test picks who signs in), token with client-secret and
 * PKCE checks, userinfo and JWKS. Plain HTTP on 127.0.0.1.
 */
export interface FakeUser {
  sub: string;
  email: string;
  name?: string;
  groups?: string[];
}

interface PendingCode {
  user: FakeUser;
  nonce: string;
  challenge: string;
  redirectUri: string;
}

export class FakeOidcProvider {
  readonly clientId = 'prints-portal';
  readonly clientSecret = 'fake-provider-client-secret';
  /** Who signs in at the next authorize request. */
  nextUser: FakeUser = { sub: 'user-1', email: 'person@example.org' };
  /** Put the groups only in userinfo, like a provider without groups in the ID token. */
  groupsInUserinfoOnly = false;
  tokenRequests = 0;

  private server: FastifyInstance | null = null;
  private issuerUrl = '';
  private readonly codes = new Map<string, PendingCode>();
  private readonly accessTokens = new Map<string, FakeUser>();
  private keys: {
    privateKey: Awaited<ReturnType<typeof generateKeyPair>>['privateKey'];
    jwk: JWK;
  } | null = null;

  get issuer(): string {
    return this.issuerUrl;
  }

  async start(): Promise<void> {
    const { privateKey, publicKey } = await generateKeyPair('RS256');
    this.keys = { privateKey, jwk: { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256' } };
    const app = Fastify();
    app.addContentTypeParser(
      'application/x-www-form-urlencoded',
      { parseAs: 'string' },
      (_request, body, done) => {
        done(null, Object.fromEntries(new URLSearchParams(body as string)));
      },
    );

    app.get('/.well-known/openid-configuration', () => ({
      issuer: this.issuerUrl,
      authorization_endpoint: `${this.issuerUrl}/authorize`,
      token_endpoint: `${this.issuerUrl}/token`,
      userinfo_endpoint: `${this.issuerUrl}/userinfo`,
      jwks_uri: `${this.issuerUrl}/jwks`,
      response_types_supported: ['code'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
    }));

    app.get('/jwks', () => ({ keys: [this.keys?.jwk] }));

    app.get<{ Querystring: Record<string, string> }>('/authorize', (request, reply) => {
      const q = request.query;
      if (q.client_id !== this.clientId || q.code_challenge_method !== 'S256') {
        return reply.code(400).send('bad authorize request');
      }
      const code = randomBytes(16).toString('hex');
      this.codes.set(code, {
        user: this.nextUser,
        nonce: q.nonce ?? '',
        challenge: q.code_challenge ?? '',
        redirectUri: q.redirect_uri ?? '',
      });
      const target = new URL(q.redirect_uri ?? '');
      target.searchParams.set('code', code);
      target.searchParams.set('state', q.state ?? '');
      return reply.redirect(target.href);
    });

    app.post<{ Body: Record<string, string> }>('/token', async (request, reply) => {
      this.tokenRequests++;
      const body = request.body;
      const [basicId, basicSecret] = Buffer.from(
        (request.headers.authorization ?? '').replace(/^Basic /, ''),
        'base64',
      )
        .toString()
        .split(':')
        .map(decodeURIComponent);
      const id = body.client_id ?? basicId;
      const secret = body.client_secret ?? basicSecret;
      if (id !== this.clientId || secret !== this.clientSecret) {
        return reply.code(401).send({ error: 'invalid_client' });
      }
      const pending = this.codes.get(body.code ?? '');
      this.codes.delete(body.code ?? '');
      const verifierHash = createHash('sha256')
        .update(body.code_verifier ?? '')
        .digest('base64url');
      if (
        pending === undefined ||
        pending.challenge !== verifierHash ||
        pending.redirectUri !== body.redirect_uri
      ) {
        return reply.code(400).send({ error: 'invalid_grant' });
      }
      const accessToken = randomBytes(16).toString('hex');
      this.accessTokens.set(accessToken, pending.user);
      const { sub, email, name, groups } = pending.user;
      const idClaims: Record<string, unknown> = { email, name, nonce: pending.nonce };
      if (!this.groupsInUserinfoOnly) idClaims.groups = groups ?? [];
      const idToken = await new SignJWT(idClaims)
        .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
        .setIssuer(this.issuerUrl)
        .setAudience(this.clientId)
        .setSubject(sub)
        .setIssuedAt()
        .setExpirationTime('5m')
        .sign(this.keys?.privateKey ?? new Uint8Array());
      return {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 300,
        id_token: idToken,
      };
    });

    app.get('/userinfo', (request, reply) => {
      const user = this.accessTokens.get(
        (request.headers.authorization ?? '').replace(/^Bearer /, ''),
      );
      if (user === undefined) return reply.code(401).send({ error: 'invalid_token' });
      return { ...user, groups: user.groups ?? [] };
    });

    await app.listen({ host: '127.0.0.1', port: 0 });
    const address = app.server.address();
    if (address === null || typeof address === 'string') throw new Error('no port');
    this.issuerUrl = `http://127.0.0.1:${String(address.port)}`;
    this.server = app;
  }

  async stop(): Promise<void> {
    await this.server?.close();
  }
}
