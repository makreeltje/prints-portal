import { Receipt, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { formatMoney } from '../i18n/format';
import { t } from '../i18n/nl';
import { StatusBadge } from './bits';
import type { Customer } from './types';

interface CustomerStripProps {
  customers: readonly Customer[];
  /** The klant filter (null: Alle klanten). */
  selected: string | null;
  onSelect: (folder: string | null) => void;
  /** Prints in the current result, for the phone toolbar. */
  total: number | null;
  /** Klant verwijderen, for Admins and Editors. */
  onDelete?: (folder: string) => Promise<void>;
  /** Herstellen on a deleted klant, for Admins. */
  onRestore?: (folder: string) => void;
}

/**
 * Customer strip of ScreenDashboard: CustomerCard per klant above 480px,
 * CustomerChips with a toolbar at 480px and below (one DOM, pp-only-wide /
 * pp-only-phone). Amounts and Factuur arrive with M6/M7.
 */
export function CustomerStrip(props: CustomerStripProps) {
  const { customers, onDelete } = props;
  const [confirming, setConfirming] = useState<Customer | null>(null);
  const ask = onDelete === undefined ? undefined : setConfirming;

  return (
    <>
      <div className="pp-only-wide">
        <div className="pp-custs">
          {customers.map((customer) => (
            <CustomerCard key={customer.folder} customer={customer} {...props} onAskDelete={ask} />
          ))}
        </div>
      </div>
      <div className="pp-only-phone">
        <CustomerChips {...props} onAskDelete={ask} />
      </div>
      {onDelete !== undefined && (
        <ConfirmDialog
          open={confirming !== null}
          title={t('confirm.deleteCustomer', { name: confirming?.folder ?? '' })}
          body={t('confirm.deleteCustomerBody', { count: confirming?.printCount ?? 0 })}
          confirmLabel={t('common.delete')}
          destructive
          onConfirm={async () => {
            if (confirming !== null) await onDelete(confirming.folder);
          }}
          onClose={() => {
            setConfirming(null);
          }}
        />
      )}
    </>
  );
}

type WithAsk = CustomerStripProps & { onAskDelete?: (customer: Customer) => void };

/** CustomerCard: the name sets the klant filter; delete and restore per the spec. */
function CustomerCard({
  customer,
  selected,
  onSelect,
  onAskDelete,
  onRestore,
}: WithAsk & { customer: Customer }) {
  const isSelected = selected === customer.folder;
  return (
    <div
      className={[
        'pp-card pp-cust',
        customer.deleted ? 'is-deleted' : '',
        isSelected ? 'is-selected' : '',
      ]
        .filter((name) => name !== '')
        .join(' ')}
    >
      <div className="hd">
        <b>
          <button
            type="button"
            className="app-name-button"
            aria-pressed={isSelected}
            onClick={() => {
              onSelect(isSelected ? null : customer.folder);
            }}
          >
            {customer.folder}
          </button>
        </b>
        <span className="end">
          <span className="cnt">{t('customers.printCount', { count: customer.printCount })}</span>
          {!customer.deleted && onAskDelete !== undefined && (
            <button
              type="button"
              className="pp-btn pp-btn-ghost pp-btn-sm pp-btn-icon"
              aria-label={t('customers.delete')}
              onClick={() => {
                onAskDelete(customer);
              }}
            >
              <Trash2 className="pp-ico" aria-hidden="true" />
            </button>
          )}
        </span>
      </div>
      {!customer.deleted && <CustomerMoney customer={customer} />}
      {customer.deleted && (
        <>
          <div>
            <StatusBadge kind="deleted" />
          </div>
          {onRestore !== undefined && (
            <div className="acts">
              <button
                type="button"
                className="pp-btn pp-btn-secondary pp-btn-sm"
                onClick={() => {
                  onRestore(customer.folder);
                }}
              >
                {t('common.restore')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Openstaand, "Alles betaald" or the Niet factureren badge (Admins and Editors). */
function CustomerMoney({ customer }: { customer: Customer }) {
  if (customer.noBilling) {
    return (
      <span>
        <span className="pp-badge neutral">
          <Receipt className="pp-ico" aria-hidden="true" />
          {t('customers.notBilled')}
        </span>
      </span>
    );
  }
  if (customer.openAmount === null) return null;
  if (customer.openAmount === 0) return <span className="cnt">{t('customers.allPaid')}</span>;
  return (
    <span className="amt">
      <span className="pp-money">{formatMoney(customer.openAmount)}</span>
      <small>{t('money.openSuffix')}</small>
    </span>
  );
}

/** CustomerChips: "Alle klanten" plus one chip per klant; exactly one is pressed. */
function CustomerChips({ customers, selected, onSelect, total, onAskDelete, onRestore }: WithAsk) {
  const current = customers.find((customer) => customer.folder === selected);
  return (
    <div className="pp-col">
      <div className="pp-chips" role="group" aria-label={t('customers.label')}>
        <button
          type="button"
          className="pp-chip"
          aria-pressed={selected === null}
          onClick={() => {
            onSelect(null);
          }}
        >
          {t('filters.allCustomers')}
        </button>
        {customers.map((customer) => (
          <button
            key={customer.folder}
            type="button"
            className={customer.deleted ? 'pp-chip is-deleted' : 'pp-chip'}
            aria-pressed={selected === customer.folder}
            onClick={() => {
              onSelect(customer.folder);
            }}
          >
            {customer.folder}
            <span className="n">{customer.printCount}</span>
          </button>
        ))}
      </div>
      {(total !== null || current !== undefined) && (
        <div className="pp-toolbar">
          <span className="pp-muted pp-text-sm">
            {total === null ? null : t('customers.printCount', { count: total })}
          </span>
          {current?.deleted === true && (
            <span className="pp-row pp-gap-2">
              <StatusBadge kind="deleted" />
              {onRestore !== undefined && (
                <button
                  type="button"
                  className="pp-btn pp-btn-secondary pp-btn-sm"
                  onClick={() => {
                    onRestore(current.folder);
                  }}
                >
                  {t('common.restore')}
                </button>
              )}
            </span>
          )}
          {current !== undefined && !current.deleted && onAskDelete !== undefined && (
            <button
              type="button"
              className="pp-btn pp-btn-ghost pp-btn-sm"
              onClick={() => {
                onAskDelete(current);
              }}
            >
              <Trash2 className="pp-ico" aria-hidden="true" />
              {t('customers.delete')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
