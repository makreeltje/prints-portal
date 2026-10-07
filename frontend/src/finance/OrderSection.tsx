import { ChevronDown, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { formatDate, formatMoney } from '../i18n/format';
import { t } from '../i18n/nl';
import { isSettled } from '../prints/orders';
import type { Order } from '../prints/types';
import { PaymentBadge } from './money';

/**
 * OrderSection: one order of a print as a `details` block. The summary
 * reads title, date, status, total and "Nog € x open"; the body holds the
 * order's files and costs (left) and its PaymentPanel (right), stacking on
 * phones. Settled orders start closed. A Nabestelling without payment,
 * write-off or invoice can be deleted; Bestelling 1 never.
 */
export function OrderSection({
  order,
  current,
  files,
  payment,
  onDelete,
}: {
  order: Order;
  /** The newest unsettled order (`is-open-order`, primary border). */
  current: boolean;
  /** Files and CostBreakdown of this order. */
  files: ReactNode;
  payment: ReactNode;
  /** Admin and Editor: "Nabestelling verwijderen". */
  onDelete?: () => Promise<void>;
}) {
  const [open, setOpen] = useState(!isSettled(order.status));
  const [confirming, setConfirming] = useState(false);
  const title = order.number === 1 ? t('orders.first') : t('orders.repeat', { n: order.number });
  const remaining = order.remaining ?? null;
  const partly = order.status === 'partial' && remaining !== null && remaining > 0;
  const hasPayment = (order.payments ?? []).some((payment) => payment.undoneAt === null);
  const deletable =
    order.number > 1 &&
    onDelete !== undefined &&
    !hasPayment &&
    (order.writtenOff ?? null) === null;
  const locked = order.invoice ?? null;

  return (
    <details
      className={current ? 'pp-order is-open-order' : 'pp-order'}
      open={open}
      onToggle={(event) => {
        setOpen(event.currentTarget.open);
      }}
    >
      <summary>
        <span className="ttl">
          <b>{title}</b>
          <span className="pp-muted pp-text-sm">{formatDate(order.date)}</span>
        </span>
        <span className="sum">
          <PaymentBadge status={order.status} />
          {order.invoice != null && (
            <span className="pp-badge neutral">
              {t('status.onInvoice', { number: order.invoice.number })}
            </span>
          )}
          {order.price !== null && <span className="pp-money">{formatMoney(order.price)}</span>}
          {partly && (
            <span className="pp-remaining">
              {t('status.remaining', { amount: formatMoney(remaining) })}
            </span>
          )}
        </span>
        <span className="chev">
          <ChevronDown className="pp-ico" aria-hidden="true" />
        </span>
      </summary>
      <div className="bd">
        <div className="pp-detail">
          <div className="pp-col">{files}</div>
          <div>{payment}</div>
        </div>
        {deletable && (
          <div className="pp-row pp-between">
            <span className="pp-help">
              {locked === null
                ? t('orders.deleteHelp')
                : t('orders.deleteLocked', { number: locked.number })}
            </span>
            <button
              type="button"
              className="pp-btn pp-btn-ghost pp-btn-sm"
              disabled={locked !== null}
              onClick={() => {
                setConfirming(true);
              }}
            >
              <Trash2 className="pp-ico" aria-hidden="true" />
              {t('orders.delete')}
            </button>
          </div>
        )}
      </div>
      {onDelete !== undefined && (
        <ConfirmDialog
          open={confirming}
          title={t('confirm.deleteOrder', { n: order.number })}
          body={t('confirm.deleteOrderBody')}
          confirmLabel={t('common.delete')}
          destructive
          onConfirm={onDelete}
          onClose={() => {
            setConfirming(false);
          }}
        />
      )}
    </details>
  );
}
