import { realpath } from 'node:fs/promises';
import path from 'node:path';

/**
 * The one place that turns a client-supplied relative path into a file
 * under the prints root. Containment is checked against `root + separator`,
 * so a sibling such as `/prints-other` never passes for `/prints`.
 */
export class PathEscapeError extends Error {
  override name = 'PathEscapeError';
}

/** Lexical check: rejects absolute paths, NUL bytes and anything that resolves outside `root`. */
export function resolveWithinRoot(root: string, relativePath: string): string {
  if (relativePath.includes('\0')) throw new PathEscapeError('path contains a NUL byte');
  if (path.isAbsolute(relativePath) || path.win32.isAbsolute(relativePath)) {
    throw new PathEscapeError('path must be relative to the prints root');
  }
  const base = path.resolve(root);
  const resolved = path.resolve(base, relativePath);
  if (!isInside(base, resolved)) throw new PathEscapeError('path escapes the prints root');
  return resolved;
}

/**
 * Also follows symbolic links: both the root and the target are resolved
 * with realpath, so a link inside the root that points elsewhere is refused.
 * The file must exist.
 */
export async function resolveExistingWithinRoot(
  root: string,
  relativePath: string,
): Promise<string> {
  const lexical = resolveWithinRoot(root, relativePath);
  const [realRoot, realTarget] = await Promise.all([realpath(root), realpath(lexical)]);
  if (!isInside(realRoot, realTarget)) throw new PathEscapeError('path escapes the prints root');
  return realTarget;
}

/** True when `candidate` is `root` itself or below it. Both must be absolute and normalised. */
export function isInside(root: string, candidate: string): boolean {
  if (candidate === root) return true;
  const prefix = root.endsWith(path.sep) ? root : root + path.sep;
  return candidate.startsWith(prefix);
}
