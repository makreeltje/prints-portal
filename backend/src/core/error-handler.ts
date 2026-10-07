import type { FastifyError, FastifyInstance } from 'fastify';

/**
 * What a caller is told when something goes wrong.
 *
 * Fastify's default handler puts the thrown error's message in the response,
 * so an internal failure (a missing property, a database error) reaches the
 * browser and tells a visitor more about the inside of the app than they
 * should learn. Anything the routes answer deliberately — a 4xx with a code,
 * a schema validation error — keeps its body; an unexpected failure is logged
 * in full and answered with nothing but the status.
 */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((raw, request, reply) => {
    const error = raw as FastifyError;
    const status = error.statusCode ?? 500;

    // Schema validation: the message names the field and holds no internals.
    if (error.validation !== undefined || (status >= 400 && status < 500)) {
      return reply.code(status).send({
        statusCode: status,
        error: error.name,
        message: error.message,
        code: error.code,
      });
    }

    request.log.error({ err: error }, 'request failed');
    return reply.code(status).send({ statusCode: status, error: 'Internal Server Error' });
  });
}
