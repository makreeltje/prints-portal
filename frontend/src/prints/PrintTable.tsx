import { useEffect } from 'react';
import { Link } from 'react-router';
import { formatDuration, formatGrams } from '../i18n/format';
import { t } from '../i18n/nl';
import { ColourDot, RecordBadge, TagChip } from './bits';
import { placeOf } from './filter';
import type { PrintSummary } from './types';

/**
 * PrintRow list view. Price and selection columns arrive with M6; at 480px
 * and below the dashboard shows cards instead (pp-only-wide / pp-only-phone).
 * Rows do not flash on live updates yet: there is no row flash class (GAP-024).
 */
export function PrintTable({
  prints,
  flashing,
  onFlashEnd,
  restore,
}: {
  prints: readonly PrintSummary[];
  flashing: ReadonlySet<string>;
  onFlashEnd: (id: string) => void;
  restore?: (print: PrintSummary) => void;
}) {
  useEffect(() => {
    for (const id of flashing) onFlashEnd(id);
  }, [flashing, onFlashEnd]);

  return (
    <div className="pp-scroll edge">
      <table className="pp-table">
        <thead>
          <tr>
            <th scope="col">{t('print.name')}</th>
            <th scope="col">{t('print.material')}</th>
            <th scope="col" className="r">
              {t('print.time')}
            </th>
            <th scope="col" className="r">
              {t('print.weight')}
            </th>
            <th scope="col">{t('print.status')}</th>
            <th scope="col">{t('tags.label')}</th>
          </tr>
        </thead>
        <tbody>
          {prints.map((print) => {
            const muted = print.status !== 'indexed';
            return (
              <tr key={print.id}>
                <td className="name">
                  <Link className="app-row-link" to={`/prints/${print.id}`}>
                    {print.name}
                  </Link>
                  <div className="pp-muted app-row-place">{placeOf(print)}</div>
                </td>
                <td className={muted ? 'pp-muted' : undefined}>
                  <span className="pp-row app-material">
                    <ColourDot colour={print.colour} />
                    {print.material ?? '–'}
                  </span>
                </td>
                <td className={muted ? 'r pp-muted' : 'r'}>
                  {print.printSeconds === null ? '–' : formatDuration(print.printSeconds)}
                </td>
                <td className={muted ? 'r pp-muted' : 'r'}>
                  {print.grams === null ? '–' : formatGrams(print.grams)}
                </td>
                <td>
                  <span className="pp-row app-material">
                    <RecordBadge print={print} />
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
                </td>
                <td>
                  <span className="pp-row app-tag-row">
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
