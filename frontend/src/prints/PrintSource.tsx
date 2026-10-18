import { ExternalLink } from 'lucide-react';
import { t } from '../i18n/nl';
import type { PrintSource as Source } from './types';

/**
 * PrintSource: where a print's model came from (GAP-152).
 *
 * A bron means a link exists, nothing more — not that the model is free, still
 * online, licensed, downloaded, or that this print was printed from it. And a
 * print with no bron is not "a design job": 69 of the owner's 84 folders carry
 * no `.url`, so an absence says nothing at all.
 */
export function SourceList({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="pp-srcs">
      {sources.map((source) => (
        <SourceEntry key={source.url} source={source} />
      ))}
    </div>
  );
}

/**
 * One entry. The chip marks provenance and therefore appears only on the
 * folder's entries: the provenance of a typed value is "you", and a chip
 * saying so would be noise on every print.
 */
function SourceEntry({ source }: { source: Source }) {
  return (
    <span className="pp-src pp-row pp-gap-1">
      <ExternalLink className="pp-ico" aria-hidden="true" />
      <SourceLink source={source} />
      {source.fileName !== null && (
        <span
          className="pp-hintchip"
          title={t('print.source.fromFolderAria', { bestandsnaam: source.fileName })}
          aria-label={t('print.source.fromFolderAria', { bestandsnaam: source.fileName })}
        >
          {t('print.source.fromFolder')}
        </span>
      )}
    </span>
  );
}

/**
 * The link itself. Its accessible name says the new tab out loud, so the name
 * is never just the host and never just "link".
 */
export function SourceLink({ source }: { source: Source }) {
  return (
    <a
      className="pp-link"
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('print.source.open', { host: source.label })}
    >
      {source.label}
    </a>
  );
}
