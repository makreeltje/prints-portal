import path from 'node:path';

/** Asset types by extension (brief §2.2; .step and .cxprj are Other). */
export type AssetType = 'gcode' | '3mf' | 'stl' | 'video' | 'f3d' | 'pdf' | 'url' | 'other';

const TYPES_BY_EXTENSION: Readonly<Record<string, AssetType>> = {
  '.gcode': 'gcode',
  '.3mf': '3mf',
  '.stl': 'stl',
  '.mp4': 'video',
  '.mkv': 'video',
  '.f3d': 'f3d',
  '.pdf': 'pdf',
  '.url': 'url',
};

export function classifyAsset(fileName: string): AssetType {
  return TYPES_BY_EXTENSION[path.extname(fileName).toLowerCase()] ?? 'other';
}

/**
 * Files and folders the indexer skips entirely (not even listed). Matched
 * against every path segment, case-insensitively. A leading dot covers
 * .DS_Store, ._* AppleDouble files, .thumbs/.thumbnails caches and the
 * Nextcloud client's hidden temporary files.
 */
export const DEFAULT_IGNORE_PATTERNS: readonly string[] = [
  '.*',
  '__MACOSX',
  'Thumbs.db',
  'desktop.ini',
  '*.part',
  '~$*',
];

/** Subfolders inside a project whose files start as "Telt niet mee in kosten" (G1). */
export const DEFAULT_AUTO_EXCLUDE_FOLDERS: readonly string[] = ['Nog te printen', 'Test'];

export function isIgnoredPath(
  relativePath: string,
  patterns: readonly string[] = DEFAULT_IGNORE_PATTERNS,
): boolean {
  const matchers = patterns.map(globToRegExp);
  return splitSegments(relativePath).some((segment) => matchers.some((re) => re.test(segment)));
}

/** Simple glob for one path segment: `*` any run of characters, `?` one character. */
export function globToRegExp(glob: string): RegExp {
  const body = glob.replace(/[*?]|[\\^$.|+()[\]{}]/g, (ch) =>
    ch === '*' ? '.*' : ch === '?' ? '.' : `\\${ch}`,
  );
  return new RegExp(`^${body}$`, 'i');
}

export interface PrintLocation {
  customerFolder: string;
  /** Second level under the root; null for files directly under the customer. */
  projectFolder: string | null;
  /** Folders between the project (or customer) and the file, e.g. ["Test"]. */
  subFolders: string[];
  fileName: string;
}

/**
 * Splits `<customer>/<project>/…/<file>` (relative to the prints root).
 * Files directly in the root belong to no customer and return null.
 */
export function locatePrintFile(relativePath: string): PrintLocation | null {
  const segments = splitSegments(relativePath);
  const fileName = segments.pop();
  const customerFolder = segments.shift();
  if (fileName === undefined || customerFolder === undefined) return null;
  const projectFolder = segments.shift() ?? null;
  return { customerFolder, projectFolder, subFolders: segments, fileName };
}

/** The folder name that makes a file start excluded, or null. */
export function autoExcludeFolder(
  subFolders: readonly string[],
  folderNames: readonly string[] = DEFAULT_AUTO_EXCLUDE_FOLDERS,
): string | null {
  const wanted = new Set(folderNames.map((name) => name.toLocaleLowerCase('nl-NL')));
  return subFolders.find((folder) => wanted.has(folder.toLocaleLowerCase('nl-NL'))) ?? null;
}

function splitSegments(relativePath: string): string[] {
  return relativePath.split(/[\\/]+/).filter((segment) => segment !== '' && segment !== '.');
}
