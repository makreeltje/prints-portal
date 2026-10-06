import path from 'node:path';
import send from '@fastify/send';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { PathEscapeError, resolveExistingWithinRoot } from '../core/paths.js';

/**
 * Streams a file from the prints root with Range, ETag and Last-Modified
 * support. The path is resolved (symlinks included) and must stay inside
 * the root; anything else answers 404 so nothing is revealed about the disk.
 */
export async function sendPrintFile(
  request: FastifyRequest,
  reply: FastifyReply,
  printsRoot: string,
  relativePath: string,
  options: { download: boolean; fileName: string },
): Promise<FastifyReply> {
  let absolute: string;
  try {
    absolute = await resolveExistingWithinRoot(printsRoot, relativePath);
  } catch (error) {
    if (error instanceof PathEscapeError)
      request.log.warn({ relativePath }, 'file outside the prints root');
    return reply.code(404).send({ error: 'file_not_found' });
  }

  const result = await send(request.raw, `/${encodeURIComponent(path.basename(absolute))}`, {
    root: path.dirname(absolute),
    dotfiles: 'allow',
    index: false,
    acceptRanges: true,
    cacheControl: false,
  });
  if (result.type === 'error' && result.statusCode === 416) {
    // Range outside the file: keep send's Content-Range so the client can retry.
    return reply.code(416).headers(result.headers).send();
  }
  if (result.type !== 'file') {
    return reply.code(404).send({ error: 'file_not_found' });
  }
  reply.code(result.statusCode).headers(result.headers);
  reply.header('cache-control', 'private, no-cache');
  reply.header('x-content-type-options', 'nosniff');
  reply.header(
    'content-disposition',
    `${options.download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeRfc5987(options.fileName)}`,
  );
  return reply.send(result.stream);
}

function encodeRfc5987(value: string): string {
  return encodeURIComponent(value).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}
