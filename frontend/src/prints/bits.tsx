import {
  Archive,
  Box,
  Copy,
  FileCode,
  FolderOpen,
  Package,
  SearchX,
  TriangleAlert,
  Trash2,
  X,
} from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { t } from '../i18n/nl';
import { thumbnailUrl } from './api';
import { isPaletteKey } from './tag-palette';
import type { MissingFileType, PrintSummary, Tag } from './types';

const LACKS_LABEL = {
  gcode: 'print.lacks.gcode',
  '3mf': 'print.lacks.threemf',
  stl: 'print.lacks.stl',
} as const satisfies Record<MissingFileType, string>;

const LACKS_ICON = {
  gcode: FileCode,
  '3mf': Package,
  stl: Box,
} as const satisfies Record<MissingFileType, typeof Box>;

/** "a", "a en b", "a, b en c" — the Dutch list the accessible name is built from. */
function joinDutch(parts: readonly string[]): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} en ${parts[parts.length - 1]}`;
}

/**
 * Which files a print has none of (GAP-090). One chip rather than three icons:
 * at this size the words are shorter than a legend would be, and they need no
 * learning. Absent, not empty, when nothing is missing — which is about 70% of
 * prints, so the grid is unchanged for most of them.
 */
export function LacksChip({
  lacks,
  withText = false,
}: {
  lacks: readonly MissingFileType[];
  /** The worded chip, for the print detail where there is room for it. */
  withText?: boolean;
}) {
  if (lacks.length === 0) return null;
  const types = lacks.map((type) => t(LACKS_LABEL[type]));
  const name = t('print.lacks.aria', {
    types: joinDutch(lacks.map((type) => t('print.lacks.item', { type: t(LACKS_LABEL[type]) }))),
  });
  if (withText) {
    return (
      <span className="pp-lacks has-text" role="img" aria-label={name} title={name}>
        <TriangleAlert className="pp-ico" aria-hidden="true" />
        {t('print.lacks', { types: types.join(', ') })}
      </span>
    );
  }
  return (
    <span className="pp-lacks" role="img" aria-label={name} title={name}>
      {lacks.map((type) => {
        const Icon = LACKS_ICON[type];
        // The slash is the "no" convention, drawn in the same SVG; the thicker
        // line underneath knocks a gap out of the glyph so it reads at 16px.
        return (
          <Icon key={type} className="pp-ico" aria-hidden="true">
            <line className="sl-bg" x1="3" y1="21" x2="21" y2="3" />
            <line className="sl" x1="3" y1="21" x2="21" y2="3" />
          </Icon>
        );
      })}
    </span>
  );
}

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
export function Thumbnail({ print, small = false }: { print: PrintSummary; small?: boolean }) {
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
      {/* The list's 40px square has no room for a caption (PrintRow 1.9). */}
      {!small && <span>{t('print.noPreview')}</span>}
    </span>
  );
  const base = small ? 'pp-thumb sm' : 'pp-thumb';
  return tinted ? (
    <div className={`${base} tinted`} style={{ '--c1': print.colour } as CSSProperties}>
      {content}
    </div>
  ) : (
    <div className={base}>{content}</div>
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
