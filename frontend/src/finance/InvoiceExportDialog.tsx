import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TriangleAlert } from 'lucide-react';
import { useId, useState } from 'react';
import { Link } from 'react-router';
import { useCurrentUser } from '../auth/context';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DatePicker } from '../components/DatePicker';
import { Dialog } from '../components/Dialog';
import { GenericError } from '../components/FieldError';
import { formatMoney } from '../i18n/format';
import { t } from '../i18n/nl';
import { keys } from '../prints/api';
import {
  billingKeys,
  conceptUrl,
  fetchInvoicePreview,
  finaliseInvoice,
  type InvoicePeriod,
} from './billing-api';

/**
 * ScreenInvoiceExport for Editors (`pp-dialog lg`): "Factuur maken voor
 * {klant}" with Van / Tot en met (the order date; empty means every order
 * not yet on a final invoice), "Alleen openstaand", the live preview card,
 * the prints left out for lack of a price, "Concept downloaden" and
 * "Definitief maken" (confirmed with klant, count, amount and the new
 * number; refused while Bedrijfsgegevens has no name or IBAN).
 */
export function InvoiceExportDialog({
  customer,
  onClose,
}: {
  customer: string;
  onClose: () => void;
}) {
  const id = useId();
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const badPeriod = from !== null && to !== null && to < from;
  const period: InvoicePeriod = { from, to, onlyOpen };
  const preview = useQuery({
    queryKey: billingKeys.preview(customer, period),
    queryFn: () => fetchInvoicePreview(customer, period),
    enabled: !badPeriod,
  });
  const data = badPeriod ? undefined : preview.data;
  const empty = data !== undefined && data.lines.length === 0;
  const ready = data !== undefined && !empty;
  const blocked = data !== undefined && !data.companyReady;

  const concept = (block: boolean) =>
    ready ? (
      <a
        className={block ? 'pp-btn pp-btn-secondary pp-fill' : 'pp-btn pp-btn-secondary'}
        href={conceptUrl(customer, period)}
        download
      >
        {t('invoice.conceptDownload')}
      </a>
    ) : (
      <button type="button" className="pp-btn pp-btn-secondary" disabled>
        {t('invoice.conceptDownload')}
      </button>
    );
  const finalise = (
    <button
      type="button"
      className="pp-btn pp-btn-primary"
      disabled={!ready}
      aria-disabled={blocked || undefined}
      aria-describedby={empty ? `${id}-empty` : blocked ? `${id}-blocked` : undefined}
      onClick={() => {
        if (!blocked) setConfirming(true);
      }}
    >
      {t('invoice.finalize')}
    </button>
  );
  const cancel = (
    <button type="button" className="pp-btn pp-btn-secondary" onClick={onClose}>
      {t('common.cancel')}
    </button>
  );

  return (
    <>
      <Dialog
        open={!confirming}
        size="lg"
        title={t('invoice.createFor', { customer })}
        onClose={onClose}
        footer={
          <>
            <div className="pp-only-wide">
              <div className="pp-row pp-gap-2 pp-end">
                {cancel}
                {concept(false)}
                {finalise}
              </div>
            </div>
            <div className="pp-only-phone">
              <div className="pp-col pp-fill">
                {finalise}
                {concept(true)}
                {cancel}
              </div>
            </div>
          </>
        }
      >
        <div className="pp-col">
          <div className="pp-row pp-gap-3 pp-nowrap pp-items-start">
            <DatePicker label={t('invoice.from')} value={from} onChange={setFrom} max={to} />
            <DatePicker
              label={t('invoice.to')}
              value={to}
              onChange={setTo}
              min={from}
              error={badPeriod ? t('date.outOfRange') : null}
            />
          </div>
          <span className="pp-help">{t('invoice.periodHelp')}</span>
          <label className="pp-opt">
            <input
              type="checkbox"
              className="pp-check"
              checked={onlyOpen}
              onChange={(event) => {
                setOnlyOpen(event.target.checked);
              }}
            />
            {t('invoice.onlyOutstanding')}
          </label>
          <div className="pp-card pp-sec pp-gap-2 pp-bg-2" aria-live="polite">
            <b className="pp-strong">{t('invoice.preview')}</b>
            {preview.isPending && !badPeriod && <span className="pp-spin" aria-hidden="true" />}
            {preview.isError && <GenericError />}
            {data !== undefined && (
              <dl className="pp-kv tight">
                <dt>{t('invoice.lines')}</dt>
                <dd className="pp-num pp-fw-regular">{data.lines.length}</dd>
                <dt>{t('invoice.total')}</dt>
                <dd className="pp-num pp-fw-regular">{formatMoney(data.total)}</dd>
                <dt>{t('invoice.paid')}</dt>
                <dd className="pp-num pp-fw-regular">{formatMoney(data.paid)}</dd>
                <dt>{t('invoice.outstanding')}</dt>
                <dd className="pp-num pp-fw-bold">{formatMoney(data.open)}</dd>
              </dl>
            )}
            {empty && (
              <span id={`${id}-empty`} className="pp-help">
                {t('invoice.noLines')}
              </span>
            )}
            {/*
              Left out because the klant refused it, not because something is
              missing: plain ink, no alert and no glyph (2.9, GAP-140). It sits
              in the card because the card is already `aria-live`, so a
              declined print entering or leaving the period is announced when
              the filters change, without claiming anything needs doing.
            */}
            {(data?.declined ?? []).length > 0 && (
              <div className="pp-reason">
                {t('invoice.omittedDeclined', {
                  count: (data?.declined ?? []).length,
                  names: nameList(data?.declined ?? []),
                })}
              </div>
            )}
          </div>
          {data !== undefined && data.excluded.length > 0 && (
            <div className="pp-alert warning" role="alert">
              <TriangleAlert className="pp-ico" aria-hidden="true" />
              <div>
                {t('invoice.omitted', {
                  count: data.excluded.length,
                  names: nameList(data.excluded),
                })}
              </div>
            </div>
          )}
          {blocked && (
            <div id={`${id}-blocked`} className="pp-alert warning" role="alert">
              <TriangleAlert className="pp-ico" aria-hidden="true" />
              <div>
                {t('invoice.finalize.blocked')}
                {user.role === 'Admin' && (
                  <>
                    {' '}
                    <Link className="pp-link" to="/instellingen">
                      {t('invoice.toSettings')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </Dialog>
      {data !== undefined && (
        <ConfirmDialog
          open={confirming}
          title={t('confirm.finalize')}
          body={t('confirm.finalizeBody', {
            customer,
            count: data.lines.length,
            amount: formatMoney(data.total),
            number: data.nextNumber,
          })}
          confirmLabel={t('invoice.finalize')}
          onConfirm={async () => {
            await finaliseInvoice(customer, {
              ...(from === null ? {} : { from }),
              ...(to === null ? {} : { to }),
              onlyOpen,
              expectedTotal: data.total,
              expectedLines: data.lines.length,
            });
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: billingKeys.invoices }),
              queryClient.invalidateQueries({ queryKey: billingKeys.outstanding }),
              queryClient.invalidateQueries({ queryKey: keys.all }),
            ]);
            onClose();
          }}
          onClose={() => {
            setConfirming(false);
          }}
        />
      )}
    </>
  );
}

/**
 * At most five names, then "en {n} andere": an unbounded list would put 83
 * names in one sentence in a 560px dialog (2.9).
 */
const NAME_CAP = 5;

function nameList(names: readonly string[]): string {
  if (names.length <= NAME_CAP) return names.join(', ');
  const shown = names.slice(0, NAME_CAP).join(', ');
  return `${shown} ${t('invoice.omittedMore', { count: names.length - NAME_CAP })}`;
}
