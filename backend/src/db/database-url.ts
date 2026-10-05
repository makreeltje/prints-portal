/**
 * Parses DATABASE_URL into a dialect-specific connection target.
 *
 * Supported forms:
 *   sqlite:///absolute/path.db   sqlite://relative/path.db   sqlite::memory:
 *   postgres://… | postgresql://…
 *   mysql://… | mariadb://…   (both use the mysql2 driver)
 */
export type DatabaseTarget =
  | { dialect: 'sqlite'; filename: string }
  | { dialect: 'postgres'; connectionString: string }
  | { dialect: 'mysql'; uri: string };

export class DatabaseUrlError extends Error {
  override name = 'DatabaseUrlError';
}

export function parseDatabaseUrl(url: string): DatabaseTarget {
  const trimmed = url.trim();
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(trimmed)?.[1]?.toLowerCase();

  switch (scheme) {
    case 'sqlite': {
      if (trimmed.toLowerCase() === 'sqlite::memory:') {
        return { dialect: 'sqlite', filename: ':memory:' };
      }
      const prefix = 'sqlite://';
      if (!trimmed.toLowerCase().startsWith(prefix) || trimmed.length === prefix.length) {
        throw new DatabaseUrlError(
          'DATABASE_URL for SQLite must look like sqlite:///absolute/path.db or sqlite://relative/path.db',
        );
      }
      return { dialect: 'sqlite', filename: decodeURIComponent(trimmed.slice(prefix.length)) };
    }
    case 'postgres':
    case 'postgresql':
      assertHasHost(trimmed);
      return { dialect: 'postgres', connectionString: trimmed };
    case 'mysql':
    case 'mariadb':
      assertHasHost(trimmed);
      return { dialect: 'mysql', uri: trimmed.replace(/^mariadb:/i, 'mysql:') };
    default:
      throw new DatabaseUrlError(
        'DATABASE_URL must start with sqlite://, postgres://, postgresql://, mysql:// or mariadb://',
      );
  }
}

function assertHasHost(url: string): void {
  let host = '';
  try {
    host = new URL(url).hostname;
  } catch {
    // handled below
  }
  if (host === '') {
    throw new DatabaseUrlError(
      'DATABASE_URL must include a host, e.g. postgres://user:pass@host/db',
    );
  }
}
