import { hash, verify } from '@node-rs/argon2';

/** Library defaults are argon2id, 19 MiB, 2 passes (OWASP baseline). */
export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 256;

export function hashPassword(password: string): Promise<string> {
  return hash(password);
}

/** Hash of a random string, verified against when the user does not exist so timing gives nothing away. */
let dummyHash: Promise<string> | undefined;

export async function verifyPassword(
  storedHash: string | null,
  password: string,
): Promise<boolean> {
  if (storedHash === null) {
    dummyHash ??= hash(crypto.randomUUID());
    await verify(await dummyHash, password).catch(() => false);
    return false;
  }
  return verify(storedHash, password).catch(() => false);
}

export function passwordProblem(password: string): 'too_short' | 'too_long' | null {
  if (password.length < MIN_PASSWORD_LENGTH) return 'too_short';
  if (password.length > MAX_PASSWORD_LENGTH) return 'too_long';
  return null;
}
