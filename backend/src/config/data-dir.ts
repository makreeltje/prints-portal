import { constants } from 'node:fs';
import { access, mkdir } from 'node:fs/promises';

/**
 * The data folder must be writable by the app's user. The usual mistake is
 * a bind mount owned by root while the container runs as uid 1000, so the
 * message says exactly that.
 */
export async function checkDataDir(dataDir: string): Promise<string | null> {
  try {
    await mkdir(dataDir, { recursive: true });
    await access(dataDir, constants.W_OK);
    return null;
  } catch {
    const uid = typeof process.getuid === 'function' ? process.getuid() : undefined;
    const gid = typeof process.getgid === 'function' ? process.getgid() : undefined;
    const owner = uid === undefined ? 'the app user' : `uid ${String(uid)}:${String(gid ?? uid)}`;
    return (
      `The data folder ${dataDir} is not writable by ${owner}. ` +
      `The database, sessions and invoices cannot be stored. ` +
      `With a bind mount, give it to that user, e.g. "chown -R ${uid === undefined ? '1000:1000' : `${String(uid)}:${String(gid ?? uid)}`} <host folder>", ` +
      `or use a named Docker volume.`
    );
  }
}
