import type { Dirent } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { isIgnoredPath } from '../core/files.js';

/**
 * Reads the folder layout under the prints root:
 *   <root>/<customer>/<project>/…   a print per project folder
 *   <root>/<customer>/<file>        files directly under a customer: a print without project
 * The scanner never writes and never follows anything outside the root.
 */
export interface ScannedFile {
  /** Relative to the prints root, with "/" separators. */
  relativePath: string;
  fileName: string;
  /** Folders between the project (or customer) and the file. */
  subFolders: string[];
  sizeBytes: number;
  lastWriteUtc: string;
}

export interface ProjectRef {
  customerFolder: string;
  projectFolder: string | null;
}

export class Scanner {
  constructor(
    private readonly root: string,
    private readonly ignorePatterns?: readonly string[],
  ) {}

  /** Customer folders (first level). */
  async listCustomers(): Promise<string[]> {
    return (await this.readDir(''))
      .filter((entry) => entry.isDirectory() && !this.ignored(entry.name))
      .map((entry) => entry.name)
      .sort();
  }

  /** Project folders of a customer, plus null when files sit directly under the customer. */
  async listProjects(customerFolder: string): Promise<ProjectRef[]> {
    return this.projectsFrom(customerFolder, await this.readDir(customerFolder));
  }

  /**
   * As `listProjects`, but null when the customer folder itself is gone.
   *
   * The difference is the caller's whole question: a folder that is missing
   * means the klant left, while a folder that cannot be read (a permission or
   * an I/O error on a network mount) means nothing of the sort, and that error
   * is raised rather than passed off as a klant who left.
   */
  async listProjectsOrNull(customerFolder: string): Promise<ProjectRef[] | null> {
    const entries = await this.readDirOrNull(customerFolder);
    return entries === null ? null : this.projectsFrom(customerFolder, entries);
  }

  private projectsFrom(customerFolder: string, all: Dirent[]): ProjectRef[] {
    const entries = all.filter((entry) => !this.ignored(`${customerFolder}/${entry.name}`));
    const projects: ProjectRef[] = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b))
      .map((projectFolder) => ({ customerFolder, projectFolder }));
    if (entries.some((entry) => entry.isFile()))
      projects.unshift({ customerFolder, projectFolder: null });
    return projects;
  }

  /**
   * Files of one print, or null when its folder no longer exists (or, for a
   * print without project, when the customer has no loose files left).
   */
  async listFiles({ customerFolder, projectFolder }: ProjectRef): Promise<ScannedFile[] | null> {
    if (projectFolder === null) {
      const entries = await this.readDirOrNull(customerFolder);
      if (entries === null) return null;
      const files = await this.collect(customerFolder, [], entries, false);
      return files.length === 0 ? null : files;
    }
    const base = `${customerFolder}/${projectFolder}`;
    const entries = await this.readDirOrNull(base);
    return entries === null ? null : this.collect(base, [], entries, true);
  }

  private async collect(
    dir: string,
    subFolders: string[],
    entries: Dirent[],
    recurse: boolean,
  ): Promise<ScannedFile[]> {
    const files: ScannedFile[] = [];
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const relativePath = `${dir}/${entry.name}`;
      if (this.ignored(relativePath)) continue;
      if (entry.isDirectory() && recurse) {
        const children = await this.readDirOrNull(relativePath);
        if (children !== null) {
          files.push(
            ...(await this.collect(relativePath, [...subFolders, entry.name], children, true)),
          );
        }
      } else if (entry.isFile()) {
        const info = await stat(path.join(this.root, relativePath)).catch(() => null);
        if (info === null) continue; // removed while scanning
        files.push({
          relativePath,
          fileName: entry.name,
          subFolders,
          sizeBytes: info.size,
          lastWriteUtc: info.mtime.toISOString(),
        });
      }
    }
    return files;
  }

  private ignored(relativePath: string): boolean {
    return isIgnoredPath(relativePath, this.ignorePatterns);
  }

  private readDir(relative: string): Promise<Dirent[]> {
    return readdir(path.join(this.root, relative), { withFileTypes: true });
  }

  private async readDirOrNull(relative: string): Promise<Dirent[] | null> {
    try {
      return await this.readDir(relative);
    } catch (error) {
      if (isMissing(error)) return null;
      throw error;
    }
  }
}

function isMissing(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException | undefined)?.code;
  return code === 'ENOENT' || code === 'ENOTDIR';
}
