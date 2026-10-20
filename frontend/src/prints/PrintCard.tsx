import { Clock } from 'lucide-react';
import { Link } from 'react-router';
import { PaymentBadge } from '../finance/money';
import { formatDuration, formatGrams, formatMoney } from '../i18n/format';
import { t } from '../i18n/nl';
import { LacksChip, RecordBadge, TagChip, Thumbnail, StatusBadge, WasPrice } from './bits';
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
  to,
  reduced = false,
  showTags = true,
}: {
  print: PrintSummary;
  flashing: boolean;
  onFlashEnd: () => void;
  /** Herstellen, for Admins on deleted prints. */
  restore?: () => void;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  /** Where the name links; a session keeps its token in the URL. */
  to?: string;
  /**
   * A visitor's card (ScreenShareSession §5): no filament tint, no tags and
   * no "Ontbreekt" chip, which is a fact about the owner's folder. The meta
   * line is no longer among them — since GAP-174 it carries Materiaal and
   * Gewicht here as well, without Tijd.
   */
  reduced?: boolean;
  /**
   * Off for role User (ScreenPrintDetail 2.15, GAP-166 and README *Roles*):
   * **no tags, anywhere** — not in a print's header, not on a card, not as a
   * filter. Separate from `reduced` on purpose: a signed-in User's card keeps
   * its whole meta line, Tijd included, while a visitor's carries Materiaal
   * and Gewicht only (GAP-174).
   */
  showTags?: boolean;
}) {
  const classes = ['pp-card', 'pp-print'];
  if (print.status === 'deleted') classes.push('is-deleted');
  if (print.status === 'archived') classes.push('is-archived');
  if (selected === true) classes.push('is-selected');
  if (flashing) classes.push('flash');
  return (
    <article className={classes.join(' ')} onAnimationEnd={onFlashEnd}>
      <Thumbnail print={print} plain={reduced} />
      <div className="pp-info">
        <div>
          <h3>
            <Link className="app-card-link" to={to ?? `/prints/${print.id}`}>
              {print.name}
            </Link>{' '}
            {/* Behind the name, where the line was already empty (GAP-109). */}
            {!reduced && <LacksChip lacks={print.lacks} />}
          </h3>
          <span className="sub">{subLine(print)}</span>
        </div>
        {/*
          A visitor reads Materiaal and Gewicht too (GAP-174, the owner's
          answer), from the same line an operator gets; Tijd is the one fact
          that stays behind, machine time being what a klant cannot check.
        */}
        <Meta print={print} withTime={!reduced} />
        {!reduced && showTags && print.tags.length > 0 && (
          <div className="pp-tags">
            {print.tags.map((tag) => (
              <TagChip key={tag.id} tag={tag} />
            ))}
          </div>
        )}
        {(print.status !== 'indexed' || print.money !== null) && (
          /*
            Two slots, each holding the thing it is about (GAP-108). Money on
            the left — including "Geen prijs", which is the price. Payment
            status on the right, or nothing: a print with no price has no
            payment status, and space-between then leaves the money at the left
            edge instead of pushing two chips to opposite sides.
          */
          <div className="pp-foot">
            {/*
              A refused quote is `noPrice` no longer: it keeps the price it was
              given, shown as history. Before 2.8 it wore "Geen prijs", a
              warning meaning something needs doing, on a print that needs
              nothing.
            */}
            {print.money?.status === 'declined' ? (
              <WasPrice price={print.money.price} />
            ) : print.money?.status === 'noPrice' ? (
              <PaymentBadge status="noPrice" />
            ) : (
              <PriceBlock print={print} />
            )}
            {print.money?.status === 'declined' ? (
              <StatusBadge kind="declined" />
            ) : print.status !== 'indexed' ? (
              <span className="pp-row pp-gap-2">
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
              </span>
            ) : (
              print.money !== null &&
              print.money.status !== 'noPrice' && <PaymentBadge status={print.money.status} />
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
export function Meta({
  print,
  withTime = true,
}: {
  print: PrintSummary;
  /** Off on a visitor's card: Materiaal and Gewicht, not Tijd (GAP-174). */
  withTime?: boolean;
}) {
  return (
    <div className="pp-meta">
      {print.material !== null && <span>{print.material}</span>}
      {withTime && print.printSeconds !== null && (
        <span>
          <Clock className="pp-ico" aria-hidden="true" />
          {formatDuration(print.printSeconds)}
        </span>
      )}
      {print.grams !== null && <span className="pp-num">{formatGrams(print.grams)}</span>}
    </div>
  );
}
