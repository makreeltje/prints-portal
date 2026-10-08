import { LayoutGrid, Receipt, RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Dialog } from '../components/Dialog';
import { OverflowMenu } from '../components/OverflowMenu';
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
  /** "Factuur" (ScreenInvoiceExport), for Admins and Editors. */
  onInvoice?: (folder: string) => void;
}

/**
 * Customer strip of ScreenDashboard: CustomerCard per klant above 480px,
 * CustomerChips with a toolbar at 480px and below (one DOM, pp-only-wide /
 * pp-only-phone). "Factuur" on the card, and on phones in the toolbar while
 * one klant is selected, opens the invoice export dialog.
 */
export function CustomerStrip(props: CustomerStripProps) {
  const { customers, onDelete } = props;
  const [confirming, setConfirming] = useState<Customer | null>(null);
  const ask = onDelete === undefined ? undefined : setConfirming;

  const [overviewOpen, setOverviewOpen] = useState(false);
  return (
    <>
      <CustomerChips
        {...props}
        onAskDelete={ask}
        onOpenOverview={() => {
          setOverviewOpen(true);
        }}
      />
      <Dialog
        open={overviewOpen}
        title={t('strip.dialog.title')}
        size="lg"
        footer={null}
        onClose={() => {
          setOverviewOpen(false);
        }}
      >
        <div className="pp-allcust">
          {customers.map((customer) => (
            <CustomerCard
              key={customer.folder}
              customer={customer}
              {...props}
              onAskDelete={ask}
              onSelect={(folder) => {
                props.onSelect(folder);
                setOverviewOpen(false);
              }}
            />
          ))}
        </div>
      </Dialog>
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

type WithAsk = CustomerStripProps & {
  onAskDelete?: (customer: Customer) => void;
  onOpenOverview?: () => void;
};

/** The tile's rare actions (OverflowMenu 1.9): Factuur maken, Klant verwijderen. */
function CustomerMenu({
  customer,
  onAskDelete,
  onRestore,
  onInvoice,
}: {
  customer: Customer;
  onAskDelete?: (customer: Customer) => void;
  onRestore?: (folder: string) => void;
  onInvoice?: (folder: string) => void;
}) {
  const items = [];
  if (!customer.deleted && !customer.noBilling && onInvoice !== undefined) {
    items.push({
      key: 'invoice',
      label: t('menu.invoice'),
      icon: <Receipt className="pp-ico" aria-hidden="true" />,
      run: () => {
        onInvoice(customer.folder);
      },
    });
  }
  if (customer.deleted && onRestore !== undefined) {
    items.push({
      key: 'restore',
      label: t('common.restore'),
      icon: <RotateCcw className="pp-ico" aria-hidden="true" />,
      run: () => {
        onRestore(customer.folder);
      },
    });
  }
  if (!customer.deleted && onAskDelete !== undefined) {
    items.push({
      key: 'delete',
      label: t('customers.delete'),
      icon: <Trash2 className="pp-ico" aria-hidden="true" />,
      danger: true,
      separated: items.length > 0,
      run: () => {
        onAskDelete(customer);
      },
    });
  }
  return <OverflowMenu items={items} />;
}

/** CustomerCard: the name sets the klant filter; delete and restore per the spec. */
function CustomerCard({
  customer,
  selected,
  onSelect,
  onAskDelete,
  onRestore,
  onInvoice,
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
          {/* The button is stretched over the tile, so the amount filters too. */}
          <button
            type="button"
            className="pp-cust-name"
            aria-pressed={isSelected}
            onClick={() => {
              onSelect(isSelected ? null : customer.folder);
            }}
          >
            {t('customers.tile', {
              customer: customer.folder,
              count: customer.printCount,
            })}
          </button>
        </b>
        <span className="end">
          <span className="cnt">{t('customers.printCount', { count: customer.printCount })}</span>
          <CustomerMenu
            customer={customer}
            onAskDelete={onAskDelete}
            onRestore={onRestore}
            onInvoice={onInvoice}
          />
        </span>
      </div>
      {!customer.deleted && <CustomerMoney customer={customer} />}
      {!customer.deleted && !customer.noBilling && onInvoice !== undefined && (
        <div className="acts">
          <button
            type="button"
            className="pp-btn pp-btn-secondary pp-btn-sm"
            onClick={() => {
              onInvoice(customer.folder);
            }}
          >
            <Receipt className="pp-ico" aria-hidden="true" />
            {t('invoice.button')}
          </button>
        </div>
      )}
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
function CustomerChips({
  customers,
  selected,
  onSelect,
  total,
  onAskDelete,
  onRestore,
  onInvoice,
  onOpenOverview,
}: WithAsk) {
  const current = customers.find((customer) => customer.folder === selected);
  const row = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  // The fade at the end only makes sense while the row really does continue.
  useEffect(() => {
    const element = row.current;
    if (element === null) return;
    const measure = () => {
      setOverflows(element.scrollWidth > element.clientWidth + 1);
    };
    measure();
    // The fade is an enhancement: without a ResizeObserver (jsdom, older
    // browsers) the window's own resize is close enough.
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => {
        window.removeEventListener('resize', measure);
      };
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [customers.length]);
  // After choosing in the overview, bring the selected chip into view.
  useEffect(() => {
    const chip = row.current?.querySelector('[aria-pressed="true"]');
    // jsdom has no scrollIntoView; bringing the chip into view is cosmetic.
    if (chip instanceof HTMLElement && typeof chip.scrollIntoView === 'function') {
      chip.scrollIntoView({ inline: 'nearest', block: 'nearest' });
    }
  }, [selected]);

  return (
    <div className="pp-col">
      <div className="pp-strip">
        <div
          ref={row}
          className={overflows ? 'pp-chips is-overflow' : 'pp-chips'}
          role="group"
          aria-label={t('customers.label')}
        >
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
              {/* The name leads; the count and the amount follow at 400 with
                  the separator the chip draws itself (GAP-092). */}
              <span className="nm">{customer.folder}</span>
              <span className="n">{customer.printCount}</span>
              {customer.openAmount !== null && customer.openAmount > 0 && (
                <span className="amt">{formatMoney(customer.openAmount)}</span>
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="pp-btn pp-btn-secondary pp-btn-sm"
          aria-haspopup="dialog"
          aria-label={t('strip.overview.label', { n: customers.length })}
          onClick={onOpenOverview}
        >
          <LayoutGrid className="pp-ico" aria-hidden="true" />
          {t('strip.overview')}
        </button>
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
          {current !== undefined && !current.deleted && (
            <span className="pp-row pp-gap-2">
              {!current.noBilling && onInvoice !== undefined && (
                <button
                  type="button"
                  className="pp-btn pp-btn-secondary pp-btn-sm"
                  onClick={() => {
                    onInvoice(current.folder);
                  }}
                >
                  <Receipt className="pp-ico" aria-hidden="true" />
                  {t('invoice.button')}
                </button>
              )}
              {onAskDelete !== undefined && (
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
            </span>
          )}
        </div>
      )}
    </div>
  );
}
