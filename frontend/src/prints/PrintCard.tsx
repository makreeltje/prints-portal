import { Clock } from 'lucide-react';
import { Link } from 'react-router';
import { formatDuration, formatGrams } from '../i18n/format';
import { t } from '../i18n/nl';
import { RecordBadge, TagChip, Thumbnail } from './bits';
import { placeOf } from './filter';
import type { PrintSummary } from './types';

/**
 * PrintCard. Price and payment status arrive with M6; selection and the bulk
 * bar too. The card is a link to the detail page with the name as its text.
 */
export function PrintCard({
  print,
  flashing,
  onFlashEnd,
  restore,
}: {
  print: PrintSummary;
  flashing: boolean;
  onFlashEnd: () => void;
  /** Herstellen, for Admins on deleted prints. */
  restore?: () => void;
}) {
  return (
    <article
      className={flashing ? 'pp-card pp-print flash' : 'pp-card pp-print'}
      onAnimationEnd={onFlashEnd}
    >
      <Thumbnail print={print} />
      <div className="pp-info">
        <div>
          <h3>
            <Link className="app-card-link" to={`/prints/${print.id}`}>
              {print.name}
            </Link>
          </h3>
          <span className="pp-muted app-card-place">{placeOf(print)}</span>
        </div>
        <Meta print={print} />
        {print.tags.length > 0 && (
          <div className="pp-row app-tag-row">
            {print.tags.map((tag) => (
              <TagChip key={tag.id} tag={tag} />
            ))}
          </div>
        )}
        {print.status !== 'indexed' && (
          <div className="pp-foot">
            <RecordBadge print={print} />
            {restore !== undefined && (
              <button
                type="button"
                className="pp-btn pp-btn-secondary pp-btn-sm app-above-link"
                onClick={restore}
              >
                {t('common.restore')}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

/** materiaal · tijd · gram, each only when known. */
export function Meta({ print }: { print: PrintSummary }) {
  return (
    <div className="pp-meta">
      {print.material !== null && <span>{print.material}</span>}
      {print.printSeconds !== null && (
        <span>
          <Clock className="pp-ico" aria-hidden="true" />
          {formatDuration(print.printSeconds)}
        </span>
      )}
      {print.grams !== null && <span className="pp-num">{formatGrams(print.grams)}</span>}
    </div>
  );
}
