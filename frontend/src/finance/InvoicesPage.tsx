import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Download, Receipt, Search } from 'lucide-react';
import { useId, useState } from 'react';
import { useCurrentUser } from '../auth/context';
import { Dialog } from '../components/Dialog';
import { GenericError } from '../components/FieldError';
import { formatDate, formatMoney } from '../i18n/format';
import { t } from '../i18n/nl';
import { ErrorState, LoadingRows } from '../pages/ErrorState';
import { keys } from '../prints/api';
import {
  billingKeys,
  createCreditNote,
  fetchInvoice,
  fetchInvoices,
  invoicePdfUrl,
  type InvoiceSummary,
} from './billing-api';

/**
 * ScreenInvoices (`/facturen`, Admin and Editor): filters (Klant, Type,
 * search on number or klant), the register of final invoices and credit
 * notes (shared yearly sequence), downloads and, for Admins, "Creditnota
 * maken" on an invoice. Phones get cards.
 */
export function InvoicesPage() {
  const user = useCurrentUser();
  const isAdmin = user.role === 'Admin';
  const id = useId();
  const invoices = useQuery({ queryKey: billingKeys.invoices, queryFn: fetchInvoices });
  const [customer, setCustomer] = useState('');
  const [kind, setKind] = useState('');
  const [query, setQuery] = useState('');
  const [crediting, setCrediting] = useState<InvoiceSummary | null>(null);

  const all = invoices.data?.invoices ?? [];
  const customers = [...new Set(all.map((invoice) => invoice.customer))].sort((a, b) =>
    a.localeCompare(b, 'nl'),
  );
  const needle = query.trim().toLocaleLowerCase('nl-NL');
  const shown = all.filter(
    (invoice) =>
      (customer === '' || invoice.customer === customer) &&
      (kind === '' || invoice.kind === kind) &&
      (needle === '' ||
        invoice.number.toLowerCase().includes(needle) ||
        invoice.customer.toLocaleLowerCase('nl-NL').includes(needle)),
  );
  const kindLabel = (invoice: InvoiceSummary) =>
    invoice.kind === 'credit' ? t('invoices.kind.credit') : t('invoices.kind.invoice');

  return (
    <>
      <div className="pp-ph">
        <h1>{t('invoice.registerTitle')}</h1>
      </div>
      {invoices.isPending ? (
        <LoadingRows rows={4} />
      ) : invoices.isError ? (
        <ErrorState body={t('system.errorBody')} onRetry={() => void invoices.refetch()} />
      ) : all.length === 0 ? (
        <div className="pp-empty">
          <div className="pp-illus">
            <Receipt className="pp-ico pp-ico-24" aria-hidden="true" />
          </div>
          <h3>{t('invoice.empty')}</h3>
          <p>{t('invoice.emptyHint')}</p>
        </div>
      ) : (
        <>
          <div className="pp-filters" role="search">
            <div className="pp-iwrap pp-w-160">
              <select
                className="pp-input pp-select"
                aria-label={t('filters.customer')}
                value={customer}
                onChange={(event) => {
                  setCustomer(event.target.value);
                }}
              >
                <option value="">{t('filters.allCustomers')}</option>
                {customers.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pp-ico r" aria-hidden="true" />
            </div>
            <div className="pp-iwrap pp-w-160">
              <select
                className="pp-input pp-select"
                aria-label={t('invoice.type')}
                value={kind}
                onChange={(event) => {
                  setKind(event.target.value);
                }}
              >
                <option value="">{t('invoices.allTypes')}</option>
                <option value="invoice">{t('invoices.kind.invoice')}</option>
                <option value="credit">{t('invoices.kind.credit')}</option>
              </select>
              <ChevronDown className="pp-ico r" aria-hidden="true" />
            </div>
            <div className="pp-iwrap grow">
              <Search className="pp-ico" aria-hidden="true" />
              <input
                id={`${id}-search`}
                className="pp-input"
                type="search"
                aria-label={t('common.search.label')}
                placeholder={t('invoices.search')}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                }}
              />
            </div>
          </div>
          <div className="pp-only-wide">
            <div className="pp-scroll edge">
              <table className="pp-table">
                <thead>
                  <tr>
                    <th scope="col">{t('invoice.number')}</th>
                    <th scope="col">{t('invoices.col.customer')}</th>
                    <th scope="col">{t('invoices.col.date')}</th>
                    <th scope="col" className="r">
                      {t('invoices.col.amount')}
                    </th>
                    <th scope="col">{t('invoice.type')}</th>
                    <th scope="col" className="r">
                      {t('invoices.col.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="name pp-mono pp-text-sm">{invoice.number}</td>
                      <td>{invoice.customer}</td>
                      <td>{formatDate(`${invoice.issuedOn}T12:00:00Z`)}</td>
                      <td className="r">{formatMoney(invoice.total)}</td>
                      <td>
                        <span className="pp-badge neutral">{kindLabel(invoice)}</span>
                        {invoice.creditsNumber !== null && (
                          <div className="pp-muted pp-text-xs">
                            {t('invoices.relates', { number: invoice.creditsNumber })}
                          </div>
                        )}
                      </td>
                      <td className="r">
                        <div className="pp-row pp-end pp-gap-1 pp-nowrap">
                          <a
                            className="pp-btn pp-btn-ghost pp-btn-icon"
                            href={invoicePdfUrl(invoice.id)}
                            download
                            aria-label={t('invoices.downloadNumber', { number: invoice.number })}
                          >
                            <Download className="pp-ico" aria-hidden="true" />
                          </a>
                          {isAdmin && invoice.kind === 'invoice' && (
                            <button
                              type="button"
                              className="pp-btn pp-btn-ghost pp-btn-sm"
                              onClick={() => {
                                setCrediting(invoice);
                              }}
                            >
                              {t('invoice.createCredit')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="pp-only-phone">
            <ul className="pp-plain pp-col">
              {shown.map((invoice) => (
                <li key={invoice.id} className="pp-card pp-sec pp-gap-2">
                  <div className="pp-row pp-between">
                    <b className="pp-mono pp-strong">{invoice.number}</b>
                    <span className="pp-money">{formatMoney(invoice.total)}</span>
                  </div>
                  <span className="pp-muted pp-text-sm">
                    {`${invoice.customer} · ${formatDate(`${invoice.issuedOn}T12:00:00Z`)}`}
                  </span>
                  <div className="pp-row pp-gap-2">
                    <span className="pp-badge neutral">{kindLabel(invoice)}</span>
                    <a
                      className="pp-btn pp-btn-secondary pp-btn-sm"
                      href={invoicePdfUrl(invoice.id)}
                      download
                      aria-label={t('invoices.downloadNumber', { number: invoice.number })}
                    >
                      {t('common.download')}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
      {crediting !== null && (
        <CreditDialog
          invoice={crediting}
          onClose={() => {
            setCrediting(null);
          }}
        />
      )}
    </>
  );
}

/** "Creditnota maken voor factuur {nummer}" (Admin): the lines as checkboxes, all ticked. */
function CreditDialog({ invoice, onClose }: { invoice: InvoiceSummary; onClose: () => void }) {
  const queryClient = useQueryClient();
  const detail = useQuery({
    queryKey: billingKeys.invoice(invoice.id),
    queryFn: () => fetchInvoice(invoice.id),
  });
  const open = (detail.data?.lines ?? []).filter((line) => !line.credited);
  const [unticked, setUnticked] = useState<ReadonlySet<string>>(new Set());
  const chosen = open.filter((line) => !unticked.has(line.id));
  const total = -chosen.reduce((sum, line) => sum + Math.round(line.amount * 100), 0) / 100;
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const submit = async () => {
    if (chosen.length === 0) return;
    setBusy(true);
    setFailed(false);
    try {
      await createCreditNote(
        invoice.id,
        chosen.map((line) => line.id),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: billingKeys.invoices }),
        queryClient.invalidateQueries({ queryKey: billingKeys.outstanding }),
        queryClient.invalidateQueries({ queryKey: keys.all }),
      ]);
      onClose();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      title={t('invoice.createCreditFor', { number: invoice.number })}
      onClose={onClose}
      busy={busy}
      onSubmit={() => void submit()}
      footer={
        <>
          <button
            type="button"
            className="pp-btn pp-btn-secondary"
            disabled={busy}
            onClick={onClose}
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="pp-btn pp-btn-primary"
            disabled={busy || chosen.length === 0}
            aria-busy={busy}
          >
            {busy && <span className="pp-spin" aria-hidden="true" />}
            {t('invoice.createCredit')}
          </button>
        </>
      }
    >
      <div className="pp-col">
        {failed && <GenericError />}
        <span>{t('invoice.pickLines')}</span>
        {detail.isPending && <span className="pp-spin" aria-hidden="true" />}
        {detail.isError && <GenericError />}
        {open.map((line, index) => (
          <div key={line.id} className="pp-row pp-between pp-nowrap">
            <label className="pp-opt">
              <input
                type="checkbox"
                className="pp-check"
                checked={!unticked.has(line.id)}
                data-autofocus={index === 0 ? true : undefined}
                onChange={(event) => {
                  const next = new Set(unticked);
                  if (event.target.checked) next.delete(line.id);
                  else next.add(line.id);
                  setUnticked(next);
                }}
              />
              {line.description}
            </label>
            <span className="pp-money pp-fw-medium">{formatMoney(line.amount)}</span>
          </div>
        ))}
        {detail.data !== undefined && (
          <div className="pp-card pp-sec pp-gap-2 pp-bg-2" aria-live="polite">
            <dl className="pp-kv tight">
              <dt>{t('invoices.creditNote')}</dt>
              <dd className="pp-num pp-fw-regular">{formatMoney(total)}</dd>
              <dt>{t('invoice.number')}</dt>
              <dd className="pp-num pp-fw-regular">{detail.data.nextNumber}</dd>
              <dt>{t('invoices.relatesShort')}</dt>
              <dd className="pp-num pp-fw-regular">
                {t('invoices.relatesValue', { number: invoice.number })}
              </dd>
            </dl>
          </div>
        )}
      </div>
    </Dialog>
  );
}
