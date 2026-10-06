import { CircleCheck, Info, RotateCcw, TriangleAlert } from 'lucide-react';
import { useId, useState } from 'react';
import { ApiError } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FieldError } from '../components/FieldError';
import {
  formatAmount,
  formatAmountInput,
  formatDate,
  formatMoney,
  parseAmount,
} from '../i18n/format';
import { t } from '../i18n/nl';
import type { Order } from '../prints/types';
import { Money, PaymentBadge } from './money';
import { WriteOffDialog } from './WriteOffDialog';

export interface PaymentActions {
  setSalePrice: (price: number | null) => Promise<void>;
  addPayment: (amount: number) => Promise<void>;
  writeOff: (reason: string | null) => Promise<void>;
  undoPayment: () => Promise<void>;
  undoWriteOff: () => Promise<void>;
}

/**
 * PaymentPanel ("Betaling") for one order: Verkoopprijs with the markup
 * suggestion, payments (partial ones stay open for the rest), Afschrijven,
 * and for Admins the undo actions. Niet factureren replaces it with the
 * cost; Users see the badge and price only.
 */
export function PaymentPanel({
  order,
  printName,
  markupPercent,
  notBilled,
  cost,
  role,
  actions,
}: {
  order: Order;
  printName: string;
  markupPercent: number | null;
  notBilled: boolean;
  /** Totaalkosten, for the niet-factureren note. */
  cost: number | null;
  role: 'Admin' | 'Editor' | 'User';
  actions: PaymentActions;
}) {
  if (notBilled) {
    return (
      <section className="pp-card pp-pay" aria-labelledby="pay-title">
        <h3 id="pay-title">{t('pay.title')}</h3>
        <div className="pp-alert info">
          <Info className="pp-ico" aria-hidden="true" />
          <div>{t('pay.notBilledNote')}</div>
        </div>
        <div className="pp-row pp-between">
          <span className="pp-muted">{t('money.cost')}</span>
          {cost === null ? null : <Money amount={cost} />}
        </div>
      </section>
    );
  }
  if (role === 'User') {
    return (
      <section className="pp-card pp-pay" aria-labelledby="pay-title">
        <h3 id="pay-title">{t('pay.title')}</h3>
        <div className="pp-row pp-between">
          <PaymentBadge status={order.status} />
          {order.price === null ? null : <Money amount={order.price} />}
        </div>
        <div className="pp-muted pp-text-sm">{t('pay.userNote')}</div>
      </section>
    );
  }
  return (
    <ManagedPanel
      order={order}
      printName={printName}
      markupPercent={markupPercent}
      isAdmin={role === 'Admin'}
      actions={actions}
    />
  );
}

function ManagedPanel({
  order,
  printName,
  markupPercent,
  isAdmin,
  actions,
}: {
  order: Order;
  printName: string;
  markupPercent: number | null;
  isAdmin: boolean;
  actions: PaymentActions;
}) {
  const id = useId();
  const paid = order.paid ?? 0;
  const remaining = order.remaining ?? null;
  const active = (order.payments ?? []).filter((p) => p.undoneAt === null);
  const settled = order.status === 'paid' || order.status === 'writtenOff';

  const initialPrice = order.salePrice ?? order.suggestion?.salePrice ?? null;
  const [priceText, setPriceText] = useState(
    initialPrice === null ? '' : formatAmountInput(initialPrice),
  );
  const [priceSuggested, setPriceSuggested] = useState(
    order.salePrice === null || order.salePrice === undefined,
  );
  const [priceError, setPriceError] = useState<string | null>(null);
  const [amountText, setAmountText] = useState(
    remaining === null ? '' : formatAmountInput(remaining),
  );
  const [amountError, setAmountError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'price' | 'pay' | null>(null);
  const [failed, setFailed] = useState(false);
  const [confirm, setConfirm] = useState<'writeOff' | 'undoPayment' | 'undoWriteOff' | null>(null);

  // Follow the server when the order changes (a payment elsewhere, a live update).
  const [seen, setSeen] = useState({ salePrice: order.salePrice, remaining });
  if (seen.salePrice !== order.salePrice || seen.remaining !== remaining) {
    setSeen({ salePrice: order.salePrice, remaining });
    const next = order.salePrice ?? order.suggestion?.salePrice ?? null;
    setPriceText(next === null ? '' : formatAmountInput(next));
    setPriceSuggested(order.salePrice === null || order.salePrice === undefined);
    setAmountText(remaining === null ? '' : formatAmountInput(remaining));
  }

  const savePrice = async () => {
    const value = priceText.trim() === '' ? null : parseAmount(priceText);
    if (priceText.trim() !== '' && (value === null || value < 0)) {
      setPriceError(t('error.invalidAmount'));
      return;
    }
    setPriceError(null);
    setBusy('price');
    setFailed(false);
    try {
      await actions.setSalePrice(value);
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  };

  const pay = async () => {
    const value = parseAmount(amountText);
    if (value === null || value <= 0 || (remaining !== null && value > remaining)) {
      setAmountError(t('error.invalidAmount'));
      return;
    }
    setAmountError(null);
    setBusy('pay');
    setFailed(false);
    try {
      await actions.addPayment(value);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'overpayment') {
        setAmountError(t('error.invalidAmount'));
      } else {
        setFailed(true);
      }
    } finally {
      setBusy(null);
    }
  };

  const suggestion = order.suggestion;
  const history =
    active.length > 0 ? (
      <ul className="app-plain-list pp-col pp-gap-1 pp-text-sm">
        {active.map((payment) => (
          <li key={payment.id} className="pp-row pp-between pp-gap-2">
            <span className="pp-muted">{formatDate(payment.paidAt)}</span>
            <span className="pp-money">{formatMoney(payment.amount)}</span>
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <section className="pp-card pp-pay" aria-labelledby="pay-title">
      <h3 id="pay-title">{t('pay.title')}</h3>
      {failed && (
        <div className="pp-alert unpaid" role="alert">
          <TriangleAlert className="pp-ico" aria-hidden="true" />
          <div>{t('error.generic')}</div>
        </div>
      )}

      {order.status !== 'open' && order.status !== 'noPrice' && (
        <div className="pp-row pp-between">
          <PaymentBadge status={order.status} />
          {order.price === null ? null : (
            <span className="pp-money app-money-lg">{formatMoney(order.price)}</span>
          )}
        </div>
      )}

      {order.status === 'partial' && order.price !== null && (
        <div className="pp-text-sm" aria-live="polite">
          <div>
            {t('pay.paidOf', { paid: formatAmount(paid), total: formatAmount(order.price) })}
          </div>
          {remaining !== null && (
            <span className="pp-remaining">
              {t('status.remaining', { amount: formatMoney(remaining) })}
            </span>
          )}
        </div>
      )}

      {order.status === 'paid' && active.length > 0 && (
        <div className="pp-muted pp-text-sm">
          {t('status.paidOn', { date: formatDate(active[active.length - 1]?.paidAt ?? '') })}
        </div>
      )}

      {order.status === 'writtenOff' &&
      order.writtenOff !== null &&
      order.writtenOff !== undefined ? (
        <dl className="pp-kv narrow">
          <dt>{t('pay.paidAmount')}</dt>
          <dd>{formatMoney(paid)}</dd>
          <dt>{t('pay.writtenOffAmount')}</dt>
          <dd>{formatMoney(order.writtenOff.amount)}</dd>
          <dt>{t('pay.date')}</dt>
          <dd>{formatDate(order.writtenOff.at)}</dd>
          <dt>{t('pay.by')}</dt>
          <dd>{order.writtenOff.by ?? '—'}</dd>
          {order.writtenOff.reason !== null && (
            <>
              <dt>{t('pay.writeOffReason')}</dt>
              <dd>{order.writtenOff.reason}</dd>
            </>
          )}
        </dl>
      ) : (
        history
      )}

      {(order.status === 'open' || order.status === 'noPrice') && (
        <>
          {suggestion?.reason === 'noCost' && (
            <div className="pp-alert warning" role="status">
              <TriangleAlert className="pp-ico" aria-hidden="true" />
              <div>
                <strong>{t('status.noCost')}.</strong> {t('pay.missingCost')}
              </div>
            </div>
          )}
          <div className="pp-field">
            <label htmlFor={`${id}-price`}>{t('pay.salePrice')}</label>
            <div className="pp-affix pre">
              <input
                id={`${id}-price`}
                className="pp-input"
                inputMode="decimal"
                value={priceText}
                aria-invalid={priceError !== null || undefined}
                aria-describedby={priceError === null ? undefined : `${id}-price-err`}
                onChange={(event) => {
                  setPriceText(event.target.value);
                  setPriceSuggested(false);
                }}
              />
              <span className="pp-suffix">€</span>
            </div>
            {priceError !== null && <FieldError id={`${id}-price-err`}>{priceError}</FieldError>}
          </div>
          {priceSuggested && priceText !== '' && (
            <span className="pp-money">
              <span className="pp-hint">{t('money.suggested')}</span>
            </span>
          )}
          <div className="pp-row">
            {markupPercent !== null && (
              <button
                type="button"
                className="pp-btn pp-btn-secondary"
                aria-disabled={
                  suggestion?.salePrice === null || suggestion?.salePrice === undefined
                }
                onClick={() => {
                  const value = suggestion?.salePrice;
                  if (value === null || value === undefined) return;
                  setPriceText(formatAmountInput(value));
                  setPriceSuggested(true);
                }}
              >
                {t('pay.suggest', { markup: markupPercent })}
              </button>
            )}
            <button
              type="button"
              className="pp-btn pp-btn-primary"
              disabled={busy !== null}
              aria-busy={busy === 'price'}
              onClick={() => void savePrice()}
            >
              {busy === 'price' && <span className="pp-spin" aria-hidden="true" />}
              {t('common.save')}
            </button>
          </div>
        </>
      )}

      {!settled && remaining !== null && remaining > 0 && (
        <>
          <hr className="sep" />
          <div className="pp-field">
            <label htmlFor={`${id}-paid`}>{t('pay.amountPaid')}</label>
            <div className="pp-affix pre">
              <input
                id={`${id}-paid`}
                className="pp-input"
                inputMode="decimal"
                value={amountText}
                aria-invalid={amountError !== null || undefined}
                aria-describedby={amountError === null ? undefined : `${id}-paid-err`}
                onChange={(event) => {
                  setAmountText(event.target.value);
                }}
              />
              <span className="pp-suffix">€</span>
            </div>
            {amountError !== null && <FieldError id={`${id}-paid-err`}>{amountError}</FieldError>}
          </div>
          <div className="pp-row">
            <button
              type="button"
              className="pp-btn pp-btn-primary"
              disabled={busy !== null}
              aria-busy={busy === 'pay'}
              onClick={() => void pay()}
            >
              {busy === 'pay' ? (
                <span className="pp-spin" aria-hidden="true" />
              ) : (
                <CircleCheck className="pp-ico" aria-hidden="true" />
              )}
              {t('pay.markPaid')}
            </button>
            {order.status === 'partial' && (
              <button
                type="button"
                className="pp-btn pp-btn-danger"
                onClick={() => {
                  setConfirm('writeOff');
                }}
              >
                {t('pay.writeOff')}
              </button>
            )}
          </div>
        </>
      )}

      {order.status === 'open' && order.price !== null && (
        <div className="pp-row pp-gap-2">
          <PaymentBadge status="open" />
        </div>
      )}

      {isAdmin && order.status === 'paid' && active.length > 0 && (
        <>
          <button
            type="button"
            className="pp-btn pp-btn-ghost pp-start"
            onClick={() => {
              setConfirm('undoPayment');
            }}
          >
            <RotateCcw className="pp-ico" aria-hidden="true" />
            {t('pay.undo')}
          </button>
          <span className="pp-help">{t('pay.adminOnly')}</span>
        </>
      )}
      {isAdmin && order.status === 'writtenOff' && (
        <>
          <button
            type="button"
            className="pp-btn pp-btn-ghost pp-start"
            onClick={() => {
              setConfirm('undoWriteOff');
            }}
          >
            <RotateCcw className="pp-ico" aria-hidden="true" />
            {t('pay.undoWriteOff')}
          </button>
          <span className="pp-help">{t('pay.adminOnly')}</span>
        </>
      )}

      {confirm === 'writeOff' && remaining !== null && (
        <WriteOffDialog
          printName={printName}
          remaining={remaining}
          paid={paid}
          onConfirm={actions.writeOff}
          onClose={() => {
            setConfirm(null);
          }}
        />
      )}
      <ConfirmDialog
        open={confirm === 'undoPayment'}
        title={t('confirm.undoPayment')}
        confirmLabel={t('pay.undo')}
        destructive
        onConfirm={actions.undoPayment}
        onClose={() => {
          setConfirm(null);
        }}
      />
      <ConfirmDialog
        open={confirm === 'undoWriteOff'}
        title={t('confirm.undoWriteOff')}
        confirmLabel={t('pay.undoWriteOff')}
        destructive
        onConfirm={actions.undoWriteOff}
        onClose={() => {
          setConfirm(null);
        }}
      />
    </section>
  );
}
