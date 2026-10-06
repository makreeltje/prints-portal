import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
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
    <div className={customer.deleted ? 'pp-card pp-cust is-deleted' : 'pp-card pp-cust'}>
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

/** CustomerChips: "Alle klanten" plus one chip per klant; exactly one is pressed. */
function CustomerChips({ customers, selected, onSelect, total, onAskDelete }: WithAsk) {
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
            className="pp-chip"
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
