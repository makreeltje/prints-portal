import { FileText, TriangleAlert } from 'lucide-react';
import { useId } from 'react';
import { Link } from 'react-router';
import { useCurrentUser } from '../auth/context';
import { formatGrams, formatMoney } from '../i18n/format';
import { t, type MessageKey } from '../i18n/nl';
import type { Cost, PriceSource } from '../prints/types';

const SOURCE: Record<PriceSource, { key: MessageKey; tone: string }> = {
  spoolman: { key: 'cost.source.spoolman', tone: 'info' },
  manual: { key: 'cost.source.manual', tone: 'neutral' },
  estimated: { key: 'cost.source.estimated', tone: 'neutral' },
};

/**
 * One line naming what is missing and where to fix it (CostBreakdown 1.9,
 * GAP-073 and GAP-076). The cost card used to repeat "Kosten ontbreken";
 * PaymentPanel says the consequence, this says the cause.
 */
function MissingInputs({ cost, printer }: { cost: Cost; printer: string | null }) {
  const user = useCurrentUser();
  const noWattage = cost.missing.includes('printerProfile');
  const noTariff = cost.missing.includes('tariff');
  if (!noWattage && !noTariff) return null;

  const both = noWattage && noTariff;
  const sentence = both
    ? t('cost.missingWattageAndPrice', { printer: printer ?? '—' })
    : noWattage
      ? t('cost.missingWattage', { printer: printer ?? '—' })
      : t('cost.missingTariff');
  const isAdmin = user.role === 'Admin';
  return (
    <p className="pp-missing pp-m0" role="status">
      <TriangleAlert className="pp-ico" aria-hidden="true" />
      <span>
        {sentence}{' '}
        {isAdmin ? (
          <Link className="pp-link" to="/instellingen#printers">
            {both ? t('cost.setInputs') : t('cost.setWattage')}
          </Link>
        ) : (
          t('cost.askAdmin')
        )}
      </span>
    </p>
  );
}

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
 * and source. A missing input shows "Onvolledig" and one line naming the
 * input and where to set it (1.9).
 */
export function CostBreakdown({
  cost,
  notBilled,
  onAdjust,
  invoiceNumber = null,
  manual,
  printerModel = null,
}: {
  cost: Cost;
  notBilled: boolean;
  /** Named in the "Geen vermogen voor {printer}." line (GAP-076). */
  printerModel?: string | null;
  /** "Aanpassen" for Admins and Editors; absent on a locked order. */
  onAdjust?: () => void;
  /** Set when the order is on a final invoice: the badge replaces "Aanpassen" (1.6). */
  invoiceNumber?: string | null;
  /** The order has "Handmatig" values. */
  manual: boolean;
}) {
  const titleId = useId();
  const incomplete = cost.missing.length > 0;
  const printLevel = cost.gramsSource === 'manual' || cost.gramsSource === 'metadata';
  return (
    <section className="pp-card pp-flush" aria-labelledby={titleId}>
      <div className="pp-card-hd">
        <h2 id={titleId} className="app-card-heading">
          <b>{notBilled ? t('cost.titleNotBilled') : t('cost.title')}</b>
        </h2>
        {invoiceNumber !== null ? (
          <span className="pp-badge info">
            <FileText className="pp-ico" aria-hidden="true" />
            {t('status.onInvoice', { number: invoiceNumber })}
          </span>
        ) : (
          onAdjust !== undefined && (
            <button type="button" className="pp-btn pp-btn-ghost pp-btn-sm" onClick={onAdjust}>
              {t('cost.adjust')}
            </button>
          )
        )}
      </div>
      <div className="pp-scroll" tabIndex={0} role="region" aria-label={t('cost.title')}>
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
      <MissingInputs cost={cost} printer={printerModel} />
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
