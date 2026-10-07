import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TriangleAlert } from 'lucide-react';
import { useId, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Dialog } from '../components/Dialog';
import { GenericError } from '../components/FieldError';
import { formatMoney } from '../i18n/format';
import { t } from '../i18n/nl';
import { keys } from '../prints/api';
import { billingKeys, conceptUrl, fetchInvoicePreview, finaliseInvoice } from './billing-api';

/**
 * ScreenInvoiceExport for Editors: "Factuur maken voor {klant}" with
 * "Alleen openstaand", the live preview card (Regels, Totaal, Betaald,
 * Openstaand), the prints left out for lack of a price, "Concept
 * downloaden" and "Definitief maken" (confirmed with klant, count, amount
 * and the new number). Van / Tot en met wait for GAP-043 (owner decision):
 * the invoice covers every order not yet on a final invoice.
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
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const preview = useQuery({
    queryKey: billingKeys.preview(customer, onlyOpen),
    queryFn: () => fetchInvoicePreview(customer, onlyOpen),
  });
  const data = preview.data;
  const empty = data !== undefined && data.lines.length === 0;
  const ready = data !== undefined && !empty;

  const concept = (block: boolean) =>
    ready ? (
      <a
        className={block ? 'pp-btn pp-btn-secondary pp-fill' : 'pp-btn pp-btn-secondary'}
        href={conceptUrl(customer, onlyOpen)}
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
      aria-describedby={empty ? `${id}-empty` : undefined}
      onClick={() => {
        setConfirming(true);
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
        title={t('invoice.createFor', { customer })}
        onClose={onClose}
        footer={
          <>
            <div className="pp-only-wide">
              {/* The three buttons do not fit 440px (GAP-045): the row wraps, right-aligned. */}
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
          <label className="pp-opt">
            <input
              type="checkbox"
              className="pp-check"
              checked={onlyOpen}
              data-autofocus
              onChange={(event) => {
                setOnlyOpen(event.target.checked);
              }}
            />
            {t('invoice.onlyOutstanding')}
          </label>
          <div className="pp-card pp-sec pp-gap-2 pp-bg-2" aria-live="polite">
            <b className="pp-strong">{t('invoice.preview')}</b>
            {preview.isPending && <span className="pp-spin" aria-hidden="true" />}
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
          </div>
          {data !== undefined && data.excluded.length > 0 && (
            <div className="pp-alert warning" role="alert">
              <TriangleAlert className="pp-ico" aria-hidden="true" />
              <div>
                {t('invoice.omitted', {
                  count: data.excluded.length,
                  names: data.excluded.join(', '),
                })}
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
