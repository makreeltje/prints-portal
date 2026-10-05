import type { PrintFilter } from './types';

export type ViewMode = 'cards' | 'list';

export function isFiltered(filter: PrintFilter): boolean {
  return (
    filter.customer !== null ||
    filter.tagIds.length > 0 ||
    filter.search.trim() !== '' ||
    filter.archived ||
    filter.deleted
  );
}

/** "klant / project", or only the klant for files directly under a customer. */
export function placeOf(print: { customerFolder: string; projectFolder: string | null }): string {
  return print.projectFolder === null
    ? print.customerFolder
    : `${print.customerFolder} / ${print.projectFolder}`;
}
