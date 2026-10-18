import type { PrintFilter } from './types';

export type ViewMode = 'cards' | 'list';

export function isFiltered(filter: PrintFilter): boolean {
  return (
    filter.customer !== null ||
    filter.tagIds.length > 0 ||
    filter.search.trim() !== '' ||
    filter.archived ||
    filter.deleted ||
    filter.status !== null
  );
}

/**
 * Compare two names the way GAP-072 asks: case, spaces and punctuation ignored,
 * so "Bloembak clips" and "bloembak-clips" are the same name.
 */
export const squashName = (value: string) =>
  value.toLocaleLowerCase('nl').replace(/[^\p{L}\p{N}]+/gu, '');

/**
 * "klant / project", or the klant alone when the project only repeats the
 * print's own name — which the heading beside it already says (GAP-072).
 * An absent or empty project is the same case.
 */
export function placeOf(print: {
  customerFolder: string;
  projectFolder: string | null;
  name: string;
}): string {
  const project = print.projectFolder;
  // An empty or punctuation-only project says nothing, so it is the same case
  // as no project at all.
  if (project === null || squashName(project) === '') return print.customerFolder;
  if (squashName(project) === squashName(print.name)) return print.customerFolder;
  return `${print.customerFolder} / ${project}`;
}
