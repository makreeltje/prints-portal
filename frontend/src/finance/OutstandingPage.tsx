import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, CircleCheck, Clock, FileText } from 'lucide-react';
import { useId, useState } from 'react';
import { useCurrentUser } from '../auth/context';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Dialog } from '../components/Dialog';
import { FieldError, GenericError } from '../components/FieldError';
import { useToast } from '../components/toast-context';
import { formatAmountInput, formatMoney, parseAmount } from '../i18n/format';
import { t } from '../i18n/nl';
import { ErrorState, LoadingRows } from '../pages/ErrorState';
import { keys } from '../prints/api';
import { StatusBadge } from '../prints/bits';
import { addPayment, writeOff } from './api';
import {
  billingKeys,
  fetchOutstanding,
  markCustomerPaid,
  reminderUrl,
  type Outstanding,
  type OutstandingGroup,
  type OutstandingLine,
} from './billing-api';
import { WriteOffDialog } from './WriteOffDialog';

/** Days open from which the badge turns `unpaid` (OutstandingGroup). */
/**
 * The three age steps of OutstandingGroup 1.9 (GAP-080). Measured on a real
 * library these put most lines in the oldest step; the thresholds are the
 * design system's, so they stay until it revises them.
 */
const AGE_WARNING_AFTER_DAYS = 30;
const AGE_LATE_AFTER_DAYS = 90;

const ageTone = (days: number): string =>
  days > AGE_LATE_AFTER_DAYS ? 'unpaid' : days > AGE_WARNING_AFTER_DAYS ? 'warning' : 'neutral';

/** At most ten lines before "Toon alle {n} regels". */
const LINES_BEFORE_MORE = 10;

/**
 * ScreenOutstanding (`/openstaand`): three StatTiles, then one
 * OutstandingGroup per klant, oldest open item first. Remainders only;
 * written-off orders and niet-factureren klanten never appear. Admins and
 * Editors collect, write off and send reminders; Users read their own
 * klanten only (owner decision).
 */
export function OutstandingPage() {
  const user = useCurrentUser();
  const canManage = user.role === 'Admin' || user.role === 'Editor';
  const data = useQuery({ queryKey: billingKeys.outstanding, queryFn: fetchOutstanding });

  return (
    <>
      <div className="pp-ph">
        <h1>{t('nav.outstanding')}</h1>
      </div>
      {data.isPending ? (
        <LoadingRows rows={4} />
      ) : data.isError ? (
        <ErrorState body={t('system.errorBody')} onRetry={() => void data.refetch()} />
      ) : data.data.groups.length === 0 ? (
        <div className="pp-empty">
          <div className="pp-illus">
            <CircleCheck className="pp-ico pp-ico-24" aria-hidden="true" />
          </div>
          <h3>{t('outstanding.empty')}</h3>
          <p>{t('outstanding.emptyHint')}</p>
        </div>
      ) : (
        <>
          <Stats data={data.data} />
          {data.data.groups.map((group) => (
            <Group key={group.customer} group={group} canManage={canManage} />
          ))}
        </>
      )}
    </>
  );
}

function Stats({ data }: { data: Outstanding }) {
  const lineCount = data.groups.reduce((total, group) => total + group.count, 0);
  const oldest = data.oldest;
  const oldestCustomer =
    oldest === null
      ? undefined
      : data.groups.find((group) => group.lines.some((line) => line.printName === oldest.printName))
          ?.customer;
  const days = oldest === null ? '—' : t('outstanding.days', { count: oldest.days });
  return (
    <>
      <div className="pp-only-wide">
        <div className="pp-stats">
          <div className="pp-card pp-stat">
            <span className="l">{t('outstanding.total')}</span>
            <span className="v">{formatMoney(data.total)}</span>
            <span className="d">{t('outstanding.totalDetail', { count: lineCount })}</span>
          </div>
          <div className="pp-card pp-stat">
            <span className="l">{t('outstanding.customers')}</span>
            <span className="v">{data.customers}</span>
            <span className="d">{t('outstanding.customersDetail')}</span>
          </div>
          <div className="pp-card pp-stat">
            <span className="l">{t('outstanding.oldest')}</span>
            <span className="v">{days}</span>
            {oldest !== null && (
              <span className="d">
                {oldestCustomer === undefined
                  ? oldest.printName
                  : `${oldest.printName} · ${oldestCustomer}`}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="pp-only-phone">
        <div className="pp-stats">
          <div className="pp-card pp-stat pp-minw-0">
            <span className="l">{t('outstanding.total')}</span>
            <span className="v pp-text-2xl">{formatMoney(data.total)}</span>
          </div>
          <div className="pp-card pp-stat pp-minw-0">
            <span className="l">{t('outstanding.oldestShort')}</span>
            <span className="v pp-text-2xl">{days}</span>
          </div>
        </div>
      </div>
    </>
  );
}

function Group({ group, canManage }: { group: OutstandingGroup; canManage: boolean }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [confirmAll, setConfirmAll] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [paying, setPaying] = useState<OutstandingLine | null>(null);
  const [writingOff, setWritingOff] = useState<OutstandingLine | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const titleId = useId();

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: billingKeys.outstanding }),
      queryClient.invalidateQueries({ queryKey: keys.all }),
    ]);
  const run = async (orderId: string | null, action: () => Promise<unknown>) => {
    setBusy(orderId ?? group.customer);
    try {
      await action();
    } catch (error) {
      toast.error(t('error.saveFailed'));
      throw error;
    } finally {
      setBusy(null);
      await refresh();
    }
  };

  const shownLines = showAll ? group.lines : group.lines.slice(0, LINES_BEFORE_MORE);

  return (
    <details className="pp-card pp-group pp-ogrp" aria-labelledby={titleId}>
      <summary
        aria-label={t('outstanding.groupLabel', {
          customer: group.customer,
          count: group.count,
          days: group.oldestDays,
          amount: formatMoney(group.total),
        })}
      >
        <span className="ttl">
          <h3 id={titleId}>{group.customer}</h3>
          <span className="pp-muted pp-text-sm">
            {t('outstanding.groupMeta', { count: group.count, days: group.oldestDays })}
          </span>
        </span>
        <span className={`age pp-badge ${ageTone(group.oldestDays)}`}>
          <Clock className="pp-ico" aria-hidden="true" />
          {t('status.daysOpen', { days: group.oldestDays })}
        </span>
        <span className="amt pp-money pp-text-lg">{formatMoney(group.total)}</span>
        <span className="chev">
          <ChevronDown className="pp-ico" aria-hidden="true" />
        </span>
      </summary>
      <div className="pp-ogrp-bar">
        {busy === group.customer && <span className="pp-spin" aria-hidden="true" />}
        {canManage && (
          <>
            <a
              className="pp-btn pp-btn-secondary pp-btn-sm"
              href={reminderUrl(group.customer)}
              download
            >
              <FileText className="pp-ico" aria-hidden="true" />
              {t('pay.reminderPdf')}
            </a>
            <button
              type="button"
              className="pp-btn pp-btn-primary pp-btn-sm"
              disabled={busy !== null}
              onClick={() => {
                setConfirmAll(true);
              }}
            >
              {t('pay.markAllPaid')}
            </button>
          </>
        )}
      </div>
      <ul className="pp-plain pp-ogrp-list">
        {shownLines.map((line) => (
          <li key={line.orderId} className="pp-line">
            <div>
              <b className="pp-strong">{lineName(line)}</b>
              <div className="pp-muted">
                {line.project === null ? group.customer : `${group.customer} · ${line.project}`}
              </div>
            </div>
            <span className="pp-row pp-gap-1">
              <span className={`pp-badge ${ageTone(line.daysOpen)}`}>
                <Clock className="pp-ico" aria-hidden="true" />
                {t('status.daysOpen', { days: line.daysOpen })}
              </span>
              {line.archived && <StatusBadge kind="archived" />}
            </span>
            <span className="pp-right">
              <span className="pp-money">{formatMoney(line.remaining)}</span>
              {line.status === 'partial' && (
                <>
                  <br />
                  <span className="pp-muted pp-text-xs">
                    {t('outstanding.of', { amount: formatMoney(line.price) })}
                  </span>
                  <br />
                  <span className="pp-remaining">
                    {t('status.remaining', { amount: formatMoney(line.remaining) })}
                  </span>
                </>
              )}
            </span>
            {canManage && (
              <div className="pp-row acts pp-gap-1 pp-nowrap">
                {busy === line.orderId && <span className="pp-spin" aria-hidden="true" />}
                <button
                  type="button"
                  className="pp-btn pp-btn-ghost pp-btn-sm"
                  disabled={busy !== null}
                  onClick={() => {
                    setPaying(line);
                  }}
                >
                  {t('pay.markPaid')}
                </button>
                <button
                  type="button"
                  className="pp-btn pp-btn-ghost pp-btn-sm"
                  disabled={busy !== null}
                  onClick={() => {
                    setWritingOff(line);
                  }}
                >
                  {t('pay.writeOff')}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {group.lines.length > shownLines.length && (
        <div className="pp-ogrp-more">
          <button
            type="button"
            className="pp-btn pp-btn-ghost pp-btn-sm"
            onClick={() => {
              setShowAll(true);
            }}
          >
            {t('outstanding.showAll', { n: group.lines.length })}
          </button>
        </div>
      )}
      <ConfirmDialog
        open={confirmAll}
        title={t('confirm.markAllPaid', { customer: group.customer, count: group.count })}
        body={t('outstanding.markAllBody', { amount: formatMoney(group.total) })}
        confirmLabel={t('pay.markAllPaid')}
        onConfirm={() => run(null, () => markCustomerPaid(group.customer))}
        onClose={() => {
          setConfirmAll(false);
        }}
      />
      {paying !== null && (
        <PayDialog
          line={paying}
          onPay={(amount) => run(paying.orderId, () => addPayment(paying.orderId, amount))}
          onClose={() => {
            setPaying(null);
          }}
        />
      )}
      {writingOff !== null && (
        <WriteOffDialog
          printName={lineName(writingOff)}
          remaining={writingOff.remaining}
          paid={writingOff.paid}
          onConfirm={(reason) =>
            run(writingOff.orderId, () => writeOff(writingOff.orderId, reason))
          }
          onClose={() => {
            setWritingOff(null);
          }}
        />
      )}
    </details>
  );
}

/** Bestelling 1 is the print; a Nabestelling reads "{print} (nabestelling {n})". */
function lineName(line: OutstandingLine): string {
  return line.orderNumber === 1
    ? line.printName
    : t('invoice.line.reorder', { print: line.printName, n: line.orderNumber });
}

/**
 * "Markeer als betaald" for one line: the amount, by default the remainder;
 * less is a partial payment, more is refused (ScreenOutstanding 1.5).
 */
function PayDialog({
  line,
  onPay,
  onClose,
}: {
  line: OutstandingLine;
  onPay: (amount: number) => Promise<void>;
  onClose: () => void;
}) {
  const id = useId();
  const [text, setText] = useState(formatAmountInput(line.remaining));
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const amount = parseAmount(text);
  const error =
    amount === null || amount <= 0
      ? t('error.invalidAmount')
      : Math.round(amount * 100) > Math.round(line.remaining * 100)
        ? t('error.overpay', { amount: formatMoney(line.remaining) })
        : null;
  const submit = async () => {
    if (error !== null || amount === null) return;
    setBusy(true);
    setFailed(false);
    try {
      await onPay(amount);
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
      size="sm"
      title={t('outstanding.line.pay')}
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
            aria-disabled={error !== null || undefined}
            disabled={busy}
            aria-busy={busy}
          >
            {busy && <span className="pp-spin" aria-hidden="true" />}
            {t('outstanding.line.pay')}
          </button>
        </>
      }
    >
      <div className="pp-col">
        {failed && <GenericError />}
        <span className="pp-strong">{lineName(line)}</span>
        <div className="pp-field">
          <label htmlFor={`${id}-amount`}>{t('pay.amountPaid')}</label>
          <div className="pp-affix pre">
            <input
              id={`${id}-amount`}
              className="pp-input"
              inputMode="decimal"
              data-autofocus
              value={text}
              aria-invalid={error !== null || undefined}
              aria-describedby={error === null ? `${id}-help` : `${id}-err`}
              onChange={(event) => {
                setText(event.target.value);
              }}
            />
            <span className="pp-suffix">€</span>
          </div>
          {error === null ? (
            <span id={`${id}-help`} className="pp-help">
              {t('outstanding.payHelp', { amount: formatMoney(line.remaining) })}
            </span>
          ) : (
            <FieldError id={`${id}-err`}>{error}</FieldError>
          )}
        </div>
      </div>
    </Dialog>
  );
}
