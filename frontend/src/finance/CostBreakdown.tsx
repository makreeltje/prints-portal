import { TriangleAlert } from 'lucide-react';
import { formatGrams, formatMoney } from '../i18n/format';
import { t, type MessageKey } from '../i18n/nl';
import type { Cost, PriceSource } from '../prints/types';

const SOURCE: Record<PriceSource, { key: MessageKey; tone: string }> = {
  spoolman: { key: 'cost.source.spoolman', tone: 'info' },
  manual: { key: 'cost.source.manual', tone: 'neutral' },
  estimated: { key: 'cost.source.estimated', tone: 'neutral' },
};

function SourceBadge({ source }: { source: PriceSource | null }) {
  if (source === null) return null;
  return <span className={`pp-badge ${SOURCE[source].tone}`}>{t(SOURCE[source].key)}</span>;
}

const kwh = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 3 });
const perKg = (price: number) => `${formatMoney(price)}/kg`;
const dash = '—';

/**
 * CostBreakdown: Materiaal (one sub-row per counted file, one per slot for
 * multi-colour files), Stroom and Totaalkosten, each with its calculation
 * and source. A missing input shows a warning and "Onvolledig".
 */
export function CostBreakdown({
  cost,
  notBilled,
  onAdjust,
  manual,
}: {
  cost: Cost;
  notBilled: boolean;
  /** "Aanpassen" for Admins and Editors. */
  onAdjust?: () => void;
  /** The order has "Handmatig" values. */
  manual: boolean;
}) {
  const incomplete = cost.missing.length > 0;
  const printLevel = cost.gramsSource === 'manual' || cost.gramsSource === 'metadata';
  return (
    <section className="pp-card pp-flush" aria-labelledby="cost-title">
      <div className="pp-card-hd">
        <h2 id="cost-title" className="app-card-heading">
          <b>{notBilled ? t('cost.titleNotBilled') : t('cost.title')}</b>
        </h2>
        {onAdjust !== undefined && (
          <button type="button" className="pp-btn pp-btn-ghost pp-btn-sm" onClick={onAdjust}>
            {t('cost.adjust')}
          </button>
        )}
      </div>
      {cost.missing.includes('printerProfile') && (
        <div className="pp-alert warning" role="status">
          <TriangleAlert className="pp-ico" aria-hidden="true" />
          <div>{t('cost.noPrinterProfile')}</div>
        </div>
      )}
      {(cost.missing.includes('price') || cost.missing.includes('grams')) && (
        <div className="pp-alert warning" role="status">
          <TriangleAlert className="pp-ico" aria-hidden="true" />
          <div>{t('status.noCost')}</div>
        </div>
      )}
      <div className="pp-scroll">
        <table className="pp-cost">
          <thead>
            <tr>
              <th scope="col">{t('cost.col.item')}</th>
              <th scope="col">{t('cost.col.calculation')}</th>
              <th scope="col">{t('cost.col.source')}</th>
              <th scope="col" className="r">
                {t('cost.col.amount')}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{t('cost.material')}</td>
              <td>
                {printLevel && cost.grams !== null
                  ? `${formatGrams(cost.grams)}${cost.printPricePerKg === null ? '' : ` × ${perKg(cost.printPricePerKg)}`}`
                  : null}
              </td>
              <td>
                {printLevel ? (
                  <SourceBadge source={manual ? 'manual' : cost.printPriceSource} />
                ) : null}
              </td>
              <td className="r">{money(cost.materialCost)}</td>
            </tr>
            {!printLevel &&
              cost.lines.flatMap((line) => {
                const single = line.slots.length === 1 ? line.slots[0] : undefined;
                const times = line.timesPrinted > 1 ? `${String(line.timesPrinted)} × ` : '';
                const rows = [
                  <tr key={line.lineId} className="sub">
                    <td>
                      <span className="pp-sr">
                        {t('cost.partOf', { name: t('cost.material') })}{' '}
                      </span>
                      {line.fileName}
                    </td>
                    <td>
                      {single === undefined
                        ? line.grams === null
                          ? dash
                          : formatGrams(line.grams)
                        : `${times}${formatGrams(single.grams / line.timesPrinted)}${single.pricePerKg === null ? '' : ` × ${perKg(single.pricePerKg)}`}`}
                    </td>
                    <td>{single === undefined ? null : <SourceBadge source={single.source} />}</td>
                    <td className="r">{money(line.materialCost)}</td>
                  </tr>,
                ];
                if (single === undefined) {
                  for (const slot of line.slots) {
                    rows.push(
                      <tr key={`${line.lineId}-${String(slot.slot)}`} className="sub">
                        <td className="pp-slotname">
                          <span className="pp-sr">
                            {t('cost.partOf', { name: line.fileName })}{' '}
                          </span>
                          {t('cost.slotRow', { n: slot.slot })}
                        </td>
                        <td>
                          {`${times}${formatGrams(slot.grams / line.timesPrinted)}${slot.pricePerKg === null ? '' : ` × ${perKg(slot.pricePerKg)}`}`}
                        </td>
                        <td>
                          <SourceBadge source={slot.source} />
                        </td>
                        <td className="r">{money(slot.cost)}</td>
                      </tr>,
                    );
                  }
                }
                return rows;
              })}
            <tr>
              <td>{t('cost.electricity')}</td>
              <td>
                {cost.energyKwh === null
                  ? dash
                  : `${kwh.format(cost.energyKwh)} kWh${cost.tariffEurPerKwh === null ? '' : ` × ${formatMoney(cost.tariffEurPerKwh)}/kWh`}`}
              </td>
              <td>{cost.energyKwh === null ? null : <SourceBadge source="estimated" />}</td>
              <td className="r">{money(cost.electricityCost)}</td>
            </tr>
            <tr className="total">
              <td colSpan={3}>{notBilled ? t('cost.titleNotBilled') : t('cost.title')}</td>
              <td className="r">{incomplete ? t('cost.incomplete') : money(cost.totalCost)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {cost.excludedCount > 0 && (
        <div className="pp-card-hd">
          <span className="pp-muted pp-text-sm">
            {t('cost.notCounted', { count: cost.excludedCount })}
          </span>
        </div>
      )}
    </section>
  );
}

function money(amount: number | null): string {
  return amount === null ? dash : formatMoney(amount);
}
