import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleCheck, Clock, FileText } from 'lucide-react';
import { useId, useState } from 'react';
import { useCurrentUser } from '../auth/context';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/toast-context';
import { formatMoney } from '../i18n/format';
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
const LATE_AFTER_DAYS = 14;

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
            {/* pp-text-2xl is not in bundle.css yet (GAP-039). */}
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

  return (
    <section className="pp-card pp-group" aria-labelledby={titleId}>
      <header>
        <h3 id={titleId}>{group.customer}</h3>
        <span className="pp-muted pp-text-sm">
          {t('outstanding.groupMeta', { count: group.count, days: group.oldestDays })}
        </span>
        {/* pp-text-lg is not in bundle.css yet (GAP-039). */}
        <span className="pp-money pp-text-lg">{formatMoney(group.total)}</span>
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
      </header>
      <ul className="pp-plain">
        {group.lines.map((line) => (
          <li key={line.orderId} className="pp-line">
            <div>
              <b className="pp-strong">{line.printName}</b>
              <div className="pp-muted">
                {line.project === null ? group.customer : `${group.customer} · ${line.project}`}
              </div>
            </div>
            <span className="pp-row pp-gap-1">
              <span
                className={line.daysOpen > LATE_AFTER_DAYS ? 'pp-badge unpaid' : 'pp-badge neutral'}
              >
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
      {/* The amount question waits for GAP-041 (owner decision): the remainder, after a confirm. */}
      <ConfirmDialog
        open={paying !== null}
        title={t('confirm.bulkMarkPaid', { count: 1 })}
        confirmLabel={t('pay.markPaid')}
        onConfirm={async () => {
          if (paying !== null)
            await run(paying.orderId, () => addPayment(paying.orderId, paying.remaining));
        }}
        onClose={() => {
          setPaying(null);
        }}
      />
      {writingOff !== null && (
        <WriteOffDialog
          printName={writingOff.printName}
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
    </section>
  );
}
