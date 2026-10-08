import { Link } from 'react-router';
import { formatDuration, formatGrams } from '../i18n/format';
import { t } from '../i18n/nl';
import { PaymentBadge } from '../finance/money';
import { LacksChip, ColourDot, RecordBadge, TagChip, Thumbnail } from './bits';
import { subLine } from './orders';
import { PriceBlock } from './PrintCard';
import type { PrintSummary } from './types';

/**
 * PrintRow list view with selection (Admins and Editors) and Prijs; at
 * 480px and below the dashboard shows cards instead (pp-only-wide /
 * pp-only-phone). Archived and deleted rows have muted text; live updates
 * flash the row.
 */
export function PrintTable({
  prints,
  flashing,
  onFlashEnd,
  restore,
  selection,
}: {
  prints: readonly PrintSummary[];
  flashing: ReadonlySet<string>;
  onFlashEnd: (id: string) => void;
  restore?: (print: PrintSummary) => void;
  selection?: {
    selected: ReadonlySet<string>;
    toggle: (id: string, on: boolean) => void;
    setAll: (on: boolean) => void;
  };
}) {
  const selectedCount =
    selection === undefined ? 0 : prints.filter((p) => selection.selected.has(p.id)).length;
  const showMoney = prints.some((p) => p.money !== null);
  return (
    <div className="pp-scroll edge" tabIndex={0} role="region" aria-label={t('nav.dashboard')}>
      <table className="pp-table">
        <thead>
          <tr>
            {selection !== undefined && (
              <th scope="col" className="chk">
                <input
                  type="checkbox"
                  className="pp-check"
                  aria-label={t('common.selectAll')}
                  checked={selectedCount > 0 && selectedCount === prints.length}
                  ref={(input) => {
                    if (input !== null) {
                      input.indeterminate = selectedCount > 0 && selectedCount < prints.length;
                    }
                  }}
                  onChange={(event) => {
                    selection.setAll(event.target.checked);
                  }}
                />
              </th>
            )}
            <th scope="col" className="img">
              <span className="pp-sr">{t('print.preview')}</span>
            </th>
            <th scope="col">{t('print.name')}</th>
            <th scope="col">{t('print.material')}</th>
            <th scope="col" className="r">
              {t('print.time')}
            </th>
            <th scope="col" className="r">
              {t('print.weight')}
            </th>
            {showMoney && (
              <th scope="col" className="r">
                {t('print.price')}
              </th>
            )}
            <th scope="col">{t('print.status')}</th>
            <th scope="col">{t('tags.label')}</th>
          </tr>
        </thead>
        <tbody>
          {prints.map((print) => {
            const classes: string[] = [];
            if (print.status === 'deleted') classes.push('is-deleted');
            if (print.status === 'archived') classes.push('is-archived');
            if (flashing.has(print.id)) classes.push('flash');
            if (selection?.selected.has(print.id) === true) classes.push('is-selected');
            return (
              <tr
                key={print.id}
                className={classes.length > 0 ? classes.join(' ') : undefined}
                onAnimationEnd={() => {
                  onFlashEnd(print.id);
                }}
              >
                {selection !== undefined && (
                  <td>
                    <input
                      type="checkbox"
                      className="pp-check"
                      aria-label={t('print.select', { name: print.name })}
                      checked={selection.selected.has(print.id)}
                      onChange={(event) => {
                        selection.toggle(print.id, event.target.checked);
                      }}
                    />
                  </td>
                )}
                <td className="img">
                  <Thumbnail print={print} small />
                </td>
                <td className="name">
                  <Link className="app-row-link" to={`/prints/${print.id}`}>
                    {print.name}
                  </Link>
                  <div className="pp-muted">{subLine(print)}</div>
                </td>
                <td>
                  <span className="pp-row app-material">
                    <ColourDot colour={print.colour} />
                    {print.material ?? '–'}
                  </span>
                </td>
                <td className="r">
                  {print.printSeconds === null ? '–' : formatDuration(print.printSeconds)}
                </td>
                <td className="r">{print.grams === null ? '–' : formatGrams(print.grams)}</td>
                {showMoney && (
                  <td className="r">
                    <PriceBlock print={print} />
                  </td>
                )}
                <td>
                  <span className="pp-row app-material">
                    {print.status === 'indexed' && print.money !== null ? (
                      <PaymentBadge status={print.money.status} />
                    ) : (
                      <RecordBadge print={print} />
                    )}
                    {print.status === 'deleted' && restore !== undefined && (
                      <button
                        type="button"
                        className="pp-btn pp-btn-secondary pp-btn-sm"
                        onClick={() => {
                          restore(print);
                        }}
                      >
                        {t('common.restore')}
                      </button>
                    )}
                  </span>
                  {/* Under the badge, not beside it (GAP-090). */}
                  <LacksChip lacks={print.lacks} compact />
                </td>
                <td>
                  <span className="pp-tags">
                    {print.tags.map((tag) => (
                      <TagChip key={tag.id} tag={tag} />
                    ))}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
