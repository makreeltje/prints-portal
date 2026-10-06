import { Archive, Box, Copy, FolderOpen, SearchX, TriangleAlert, Trash2, X } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { t } from '../i18n/nl';
import { thumbnailUrl } from './api';
import { isPaletteKey } from './tag-palette';
import type { PrintSummary, Tag } from './types';

/** StatusBadge (record and asset statuses used so far). Always an icon and a word. */
export function StatusBadge({
  kind,
}: {
  kind: 'archived' | 'deleted' | 'duplicate' | 'missingFile';
}) {
  switch (kind) {
    case 'archived':
      return (
        <span className="pp-badge neutral">
          <Archive className="pp-ico" aria-hidden="true" />
          {t('status.archived')}
        </span>
      );
    case 'deleted':
      return (
        <span className="pp-badge neutral">
          <Trash2 className="pp-ico" aria-hidden="true" />
          {t('status.deleted')}
        </span>
      );
    case 'duplicate':
      return (
        <span className="pp-badge warning">
          <Copy className="pp-ico" aria-hidden="true" />
          {t('asset.duplicate')}
        </span>
      );
    case 'missingFile':
      return (
        <span className="pp-badge warning">
          <TriangleAlert className="pp-ico" aria-hidden="true" />
          {t('asset.missingFile')}
        </span>
      );
  }
}

export function RecordBadge({ print }: { print: Pick<PrintSummary, 'status'> }) {
  if (print.status === 'deleted') return <StatusBadge kind="deleted" />;
  if (print.status === 'archived') return <StatusBadge kind="archived" />;
  return null;
}

/**
 * TagChip: a palette colour is a `data-c` key (design system v1.3); a free
 * colour stored before v1.3 is user data passed as the per-instance variables
 * the component reads (--tag, --tag-ink); no colour is the outlined chip.
 */
export function TagChip({ tag, onRemove }: { tag: Tag; onRemove?: () => void }) {
  const remove =
    onRemove === undefined ? null : (
      <button type="button" aria-label={t('tags.remove', { tag: tag.name })} onClick={onRemove}>
        <X className="pp-ico" aria-hidden="true" />
      </button>
    );
  if (tag.colour !== null && isPaletteKey(tag.colour)) {
    return (
      <span className="pp-tag" data-c={tag.colour}>
        {tag.name}
        {remove}
      </span>
    );
  }
  if (tag.colour === null || tag.ink === null) {
    return (
      <span className="pp-tag none">
        {tag.name}
        {remove}
      </span>
    );
  }
  return (
    <span className="pp-tag" style={{ '--tag': tag.colour, '--tag-ink': tag.ink } as CSSProperties}>
      {tag.name}
      {remove}
    </span>
  );
}

/** Filament colour disc (SpoolSwatch); hatch without colour; dashed ring for a slicer colour. */
export function ColourDot({ colour, slicer = false }: { colour: string | null; slicer?: boolean }) {
  if (colour === null) return <span className="pp-spool none" aria-hidden="true" />;
  return (
    <span
      className={slicer ? 'pp-spool slicer' : 'pp-spool'}
      aria-hidden="true"
      style={{ '--c1': colour, '--c2': colour } as CSSProperties}
    />
  );
}

/**
 * Thumbnail with the tint rule (SpoolSwatch): the print colour behind the
 * image (.pp-thumb.tinted, --c1), surface-2 without colour, "Geen voorbeeld"
 * when there is no image.
 */
export function Thumbnail({ print }: { print: PrintSummary }) {
  const tinted = print.colour !== null;
  const content = print.hasThumbnail ? (
    <img
      className="app-thumb-img"
      src={thumbnailUrl(print)}
      alt=""
      loading="lazy"
      decoding="async"
    />
  ) : (
    <span className="app-thumb-none">
      <Box className="pp-ico pp-ico-24" aria-hidden="true" />
      <span>{t('print.noPreview')}</span>
    </span>
  );
  return tinted ? (
    <div className="pp-thumb tinted" style={{ '--c1': print.colour } as CSSProperties}>
      {content}
    </div>
  ) : (
    <div className="pp-thumb">{content}</div>
  );
}

/** EmptyState variants from the copy deck. */
export function EmptyState({
  kind,
  action,
}: {
  kind: 'noPrints' | 'noResults' | 'unreachable';
  action?: ReactNode;
}) {
  const Icon = kind === 'noResults' ? SearchX : kind === 'unreachable' ? TriangleAlert : FolderOpen;
  return (
    <div className="pp-empty">
      <div className="pp-illus" aria-hidden="true">
        <Icon className="pp-ico pp-ico-24" />
      </div>
      <h3>{t(`empty.${kind}.title`)}</h3>
      <p>{t(`empty.${kind}.body`)}</p>
      {action}
    </div>
  );
}
