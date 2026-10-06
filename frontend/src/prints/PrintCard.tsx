import { Clock } from 'lucide-react';
import { Link } from 'react-router';
import { PaymentBadge } from '../finance/money';
import { formatDuration, formatGrams, formatMoney } from '../i18n/format';
import { t } from '../i18n/nl';
import { RecordBadge, TagChip, Thumbnail } from './bits';
import { subLine } from './orders';
import type { PrintSummary } from './types';

/**
 * PrintCard: thumbnail, name (a link to the detail page), place, meta, tags,
 * then the price block and the status badge. Admins and Editors get the
 * selection checkbox for the bulk bar.
 */
export function PrintCard({
  print,
  flashing,
  onFlashEnd,
  restore,
  selected,
  onSelect,
}: {
  print: PrintSummary;
  flashing: boolean;
  onFlashEnd: () => void;
  /** Herstellen, for Admins on deleted prints. */
  restore?: () => void;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
}) {
  const classes = ['pp-card', 'pp-print'];
  if (print.status === 'deleted') classes.push('is-deleted');
  if (print.status === 'archived') classes.push('is-archived');
  if (selected === true) classes.push('is-selected');
  if (flashing) classes.push('flash');
  return (
    <article className={classes.join(' ')} onAnimationEnd={onFlashEnd}>
      <Thumbnail print={print} />
      <div className="pp-info">
        <div>
          <h3>
            <Link className="app-card-link" to={`/prints/${print.id}`}>
              {print.name}
            </Link>
          </h3>
          <span className="sub">{subLine(print)}</span>
        </div>
        <Meta print={print} />
        {print.tags.length > 0 && (
          <div className="pp-tags">
            {print.tags.map((tag) => (
              <TagChip key={tag.id} tag={tag} />
            ))}
          </div>
        )}
        {(print.status !== 'indexed' || print.money !== null) && (
          <div className="pp-foot">
            <PriceBlock print={print} />
            {print.status === 'indexed' ? (
              print.money !== null && <PaymentBadge status={print.money.status} />
            ) : (
              <RecordBadge print={print} />
            )}
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
      {/* After the content: positioned later, so it sits above the card's link overlay. */}
      {onSelect !== undefined && (
        <span className="pp-sel app-above-link">
          <label className="pp-opt">
            <input
              type="checkbox"
              className="pp-check"
              aria-label={t('print.select', { name: print.name })}
              checked={selected === true}
              onChange={(event) => {
                onSelect(event.target.checked);
              }}
            />
          </label>
        </span>
      )}
    </article>
  );
}

/**
 * The price block (MoneyDisplay): the price, with "Nog € x open" when partly
 * paid; "Kosten € x" for a klant that is niet factureren.
 */
export function PriceBlock({ print }: { print: PrintSummary }) {
  const money = print.money;
  if (money === null) return <span />;
  if (money.status === 'notBilled') {
    if (money.cost === null) return <span />;
    return (
      <span>
        <span className="pp-muted pp-text-xs">{t('money.cost')}</span>{' '}
        <span className="pp-money">{formatMoney(money.cost)}</span>
      </span>
    );
  }
  if (money.price === null) return <span />;
  // Several orders: the remainder over all orders as soon as something is paid.
  if (money.remaining !== null && money.remaining > 0 && money.remaining < money.price) {
    return (
      <span>
        <span className="pp-money">{formatMoney(money.price)}</span>
        <br />
        <span className="pp-remaining">
          {t('status.remaining', { amount: formatMoney(money.remaining) })}
        </span>
      </span>
    );
  }
  return <span className="pp-money">{formatMoney(money.price)}</span>;
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
