import type { FastifyInstance, FastifyReply } from 'fastify';
import type { AppConfig } from '../config/config.js';
import type { AppDatabase } from '../db/connection.js';
import type { Role } from '../db/schema.js';
import { hasAllCustomerAccess, listCustomerFolders } from './access.js';
import { hashPassword, MAX_PASSWORD_LENGTH, passwordProblem } from './passwords.js';
import type { SessionStore } from './sessions.js';
import { createUser, findUserById, findUserByLogin, ROLES, toPublicUser } from './users.js';

const ADMIN_ONLY = { auth: ['Admin'] as const };
const idParams = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string', maxLength: 36 } },
} as const;
const passwordSchema = { type: 'string', minLength: 1, maxLength: MAX_PASSWORD_LENGTH } as const;

class LastAdminError extends Error {}

/** /api/users and /api/access: user management and per-customer grants (Admin only). */
export function registerAdminRoutes(
  app: FastifyInstance,
  deps: { config: AppConfig; db: AppDatabase; sessions: SessionStore; now: () => Date },
): void {
  const { db, sessions, now } = deps;
  const localLogin = deps.config.auth.oidc === null;

  const sendPasswordProblem = (reply: FastifyReply, password: string) => {
    const problem = passwordProblem(password);
    return problem === null ? null : reply.code(400).send({ error: `password_${problem}` });
  };

  app.get('/api/users', { config: ADMIN_ONLY }, async () => {
    const users = await db.selectFrom('users').selectAll().execute();
    return {
      users: users
        .map(toPublicUser)
        .sort((a, b) => a.displayName.localeCompare(b.displayName, 'nl')),
    };
  });

  app.post<{ Body: { login: string; role: Role; password: string } }>(
    '/api/users',
    {
      config: ADMIN_ONLY,
      schema: {
        body: {
          type: 'object',
          required: ['login', 'role', 'password'],
          additionalProperties: false,
          properties: {
            // "E-mailadres of naam": any visible text; stored trimmed and lower-case.
            login: { type: 'string', pattern: '\\S', maxLength: 320 },
            role: { type: 'string', enum: ROLES },
            password: passwordSchema,
          },
        },
      },
    },
    async (request, reply) => {
      if (!localLogin) return reply.code(409).send({ error: 'local_login_disabled' });
      const { login, role, password } = request.body;
      const rejected = sendPasswordProblem(reply, password);
      if (rejected !== null) return rejected;
      if ((await findUserByLogin(db, login)) !== undefined) {
        return reply.code(409).send({ error: 'login_taken' });
      }
      const user = await createUser(
        db,
        // The password is temporary: the user chooses their own at the first sign-in.
        { login, role, passwordHash: await hashPassword(password), mustChangePassword: true },
        now(),
      );
      return reply.code(201).send(toPublicUser(user));
    },
  );

  app.patch<{ Params: { id: string }; Body: { role: Role } }>(
    '/api/users/:id',
    {
      config: ADMIN_ONLY,
      schema: {
        params: idParams,
        body: {
          type: 'object',
          required: ['role'],
          additionalProperties: false,
          properties: { role: { type: 'string', enum: ROLES } },
        },
      },
    },
    async (request, reply) => {
      try {
        const updated = await db.transaction().execute(async (trx) => {
          const user = await findUserById(trx, request.params.id);
          if (user === undefined) return null;
          if (user.role === 'Admin' && request.body.role !== 'Admin') {
            await assertAnotherAdmin(trx, user.id);
          }
          await trx
            .updateTable('users')
            // A role set by hand is no longer managed by the OIDC admin group.
            .set({ role: request.body.role, role_from_group: 0 })
            .where('id', '=', user.id)
            .execute();
          return { ...user, role: request.body.role, role_from_group: 0 };
        });
        if (updated === null) return await reply.code(404).send({ error: 'not_found' });
        return toPublicUser(updated);
      } catch (error) {
        if (error instanceof LastAdminError) {
          return reply.code(409).send({ error: 'last_admin' });
        }
        throw error;
      }
    },
  );

  app.post<{ Params: { id: string }; Body: { password: string } }>(
    '/api/users/:id/password',
    {
      config: ADMIN_ONLY,
      schema: {
        params: idParams,
        body: {
          type: 'object',
          required: ['password'],
          additionalProperties: false,
          properties: { password: passwordSchema },
        },
      },
    },
    async (request, reply) => {
      const user = await findUserById(db, request.params.id);
      if (user === undefined) return reply.code(404).send({ error: 'not_found' });
      if (!localLogin || user.oidc_subject !== null) {
        return reply.code(409).send({ error: 'not_local' });
      }
      const rejected = sendPasswordProblem(reply, request.body.password);
      if (rejected !== null) return rejected;
      await db
        .updateTable('users')
        .set({ password_hash: await hashPassword(request.body.password), must_change_password: 1 })
        .where('id', '=', user.id)
        .execute();
      // Whoever knew the old password is signed out (the Admin keeps their own session).
      await sessions.destroyForUser(user.id, request.auth?.idHash);
      return reply.code(204).send();
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/api/users/:id',
    { config: ADMIN_ONLY, schema: { params: idParams } },
    async (request, reply) => {
      try {
        const deleted = await db.transaction().execute(async (trx) => {
          const user = await findUserById(trx, request.params.id);
          if (user === undefined) return false;
          if (user.role === 'Admin') await assertAnotherAdmin(trx, user.id);
          // Sessions and grants go with the user (ON DELETE CASCADE).
          await trx.deleteFrom('users').where('id', '=', user.id).execute();
          return true;
        });
        return await reply
          .code(deleted ? 204 : 404)
          .send(deleted ? undefined : { error: 'not_found' });
      } catch (error) {
        if (error instanceof LastAdminError) {
          return reply.code(409).send({ error: 'last_admin' });
        }
        throw error;
      }
    },
  );

  app.get('/api/access', { config: ADMIN_ONLY }, async () => {
    const [customers, users, grants] = await Promise.all([
      listCustomerFolders(db),
      db.selectFrom('users').selectAll().execute(),
      db.selectFrom('customer_access').select(['user_id', 'customer_folder']).execute(),
    ]);
    return {
      customers,
      users: users
        .map((user) => ({
          ...toPublicUser(user),
          customers: hasAllCustomerAccess(user.role)
            ? customers
            : grants
                .filter((grant) => grant.user_id === user.id)
                .map((grant) => grant.customer_folder)
                .sort((a, b) => a.localeCompare(b, 'nl')),
        }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName, 'nl')),
    };
  });

  app.patch<{
    Body: { changes: { userId: string; customerFolder: string; granted: boolean }[] };
  }>(
    '/api/access',
    {
      config: ADMIN_ONLY,
      schema: {
        body: {
          type: 'object',
          required: ['changes'],
          additionalProperties: false,
          properties: {
            changes: {
              type: 'array',
              minItems: 1,
              maxItems: 5000,
              items: {
                type: 'object',
                required: ['userId', 'customerFolder', 'granted'],
                additionalProperties: false,
                properties: {
                  userId: { type: 'string', maxLength: 36 },
                  customerFolder: { type: 'string', minLength: 1, maxLength: 255 },
                  granted: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { changes } = request.body;
      const userIds = [...new Set(changes.map((change) => change.userId))];
      const users = await db
        .selectFrom('users')
        .select(['id', 'role'])
        .where('id', 'in', userIds)
        .execute();
      if (users.length !== userIds.length) {
        return reply.code(404).send({ error: 'unknown_user' });
      }
      // Admins and Editors already see every customer; grants are for Users only.
      if (users.some((user) => user.role !== 'User')) {
        return reply.code(400).send({ error: 'not_user_role' });
      }
      const grantedAt = now().toISOString();
      await db.transaction().execute(async (trx) => {
        for (const { userId, customerFolder, granted } of changes) {
          await trx
            .deleteFrom('customer_access')
            .where('user_id', '=', userId)
            .where('customer_folder', '=', customerFolder)
            .execute();
          if (granted) {
            await trx
              .insertInto('customer_access')
              .values({ user_id: userId, customer_folder: customerFolder, granted_at: grantedAt })
              .execute();
          }
        }
      });
      return reply.code(204).send();
    },
  );
}

async function assertAnotherAdmin(db: AppDatabase, exceptUserId: string): Promise<void> {
  const other = await db
    .selectFrom('users')
    .select('id')
    .where('role', '=', 'Admin')
    .where('id', '!=', exceptUserId)
    .executeTakeFirst();
  if (other === undefined) throw new LastAdminError();
}
