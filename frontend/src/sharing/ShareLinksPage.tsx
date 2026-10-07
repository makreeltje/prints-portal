import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, ChevronDown, CircleCheck, Clock, Link as LinkIcon, Plus } from 'lucide-react';
import { useId, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Dialog } from '../components/Dialog';
import { FieldError, GenericError } from '../components/FieldError';
import { formatDate } from '../i18n/format';
import { t } from '../i18n/nl';
import { ErrorState, LoadingRows } from '../pages/ErrorState';
import { fetchCustomers, keys } from '../prints/api';
import { calendarDays } from './days';
import {
  createShareLink,
  fetchShareLinks,
  revokeShareLink,
  shareKeys,
  type CreatedShareLink,
  type ExpiryDays,
  type ShareLink,
} from './share-api';
import { TokenReveal } from './TokenReveal';

/**
 * ScreenShareLinks (`/deel-links`, Admin): the links grouped per klant as
 * ShareLinkRow rows, "Deel-link maken" with Klant, Label and Verloopt, the
 * one-time TokenReveal and Intrekken with a confirmation.
 */
export function ShareLinksPage() {
  const links = useQuery({ queryKey: shareKeys.links, queryFn: fetchShareLinks });
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreatedShareLink | null>(null);

  const createButton = (
    <button
      type="button"
      className="pp-btn pp-btn-primary"
      onClick={() => {
        setCreating(true);
      }}
    >
      <Plus className="pp-ico" aria-hidden="true" />
      {t('share.create')}
    </button>
  );
  const groups = groupByCustomer(links.data?.links ?? []);

  return (
    <>
      <div className="pp-ph">
        <h1>{t('nav.shareLinks')}</h1>
        {groups.length > 0 && createButton}
      </div>
      {links.isPending ? (
        <LoadingRows rows={3} />
      ) : links.isError ? (
        <ErrorState body={t('system.errorBody')} onRetry={() => void links.refetch()} />
      ) : groups.length === 0 ? (
        <div className="pp-empty">
          <div className="pp-illus">
            <LinkIcon className="pp-ico pp-ico-24" aria-hidden="true" />
          </div>
          <h3>{t('share.empty')}</h3>
          {createButton}
        </div>
      ) : (
        groups.map(([customer, list]) => (
          <section key={customer} aria-label={customer} className="pp-col pp-gap-2">
            <div className="pp-label">{customer}</div>
            <ul className="pp-card pp-flush app-plain-list">
              {list.map((link, index) => (
                <li key={link.id}>
                  {index > 0 && <div className="pp-rule-t" />}
                  <ShareLinkRow link={link} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
      {creating && (
        <CreateDialog
          onCreated={(result) => {
            setCreating(false);
            setCreated(result);
          }}
          onClose={() => {
            setCreating(false);
          }}
        />
      )}
      {created !== null && (
        <TokenReveal
          url={created.url}
          onClose={() => {
            setCreated(null);
          }}
        />
      )}
    </>
  );
}

function groupByCustomer(links: readonly ShareLink[]): [string, ShareLink[]][] {
  const groups = new Map<string, ShareLink[]>();
  for (const link of links) {
    const list = groups.get(link.customer) ?? [];
    list.push(link);
    groups.set(link.customer, list);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, 'nl'));
}

/** "Over 30 dagen" or "3 dagen geleden" (0 and 1 day: GAP-051 placeholder copy). */
function relativeDays(expiresAt: string): string {
  const days = calendarDays(new Date(), expiresAt);
  if (days === 0) return t('date.today'); // ds-gap: GAP-051
  if (days > 0) return days === 1 ? t('share.expiresInOne') : t('share.expiresIn', { days });
  return days === -1 ? t('share.daysAgoOne') : t('share.daysAgo', { days: -days });
}

const STATUS = {
  active: { tone: 'paid', Icon: CircleCheck, label: 'share.active' },
  expired: { tone: 'neutral', Icon: Clock, label: 'share.expired' },
  revoked: { tone: 'neutral', Icon: Ban, label: 'share.revoked' },
} as const;

/** ShareLinkRow: label and klant, created, expiry, status and Intrekken while active. */
function ShareLinkRow({ link }: { link: ShareLink }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const status = STATUS[link.status];
  return (
    <div className="pp-share">
      <div>
        <b>{link.label}</b>
        <small>{link.customer}</small>
      </div>
      <div>
        {formatDate(link.createdAt)}
        <small>{t('share.createdOn')}</small>
      </div>
      {link.revokedAt !== null ? (
        <div>
          {t('share.revoked')}
          <small>{formatDate(link.revokedAt)}</small>
        </div>
      ) : link.expiresAt === null ? (
        <div className="never">
          {t('share.noExpiry')}
          <small />
        </div>
      ) : (
        <div title={formatDate(link.expiresAt)}>
          {relativeDays(link.expiresAt)}
          <small>{formatDate(link.expiresAt)}</small>
        </div>
      )}
      <div>
        <span className={`pp-badge ${status.tone}`}>
          <status.Icon className="pp-ico" aria-hidden="true" />
          {t(status.label)}
        </span>
      </div>
      {link.status === 'active' ? (
        <button
          type="button"
          className="pp-btn pp-btn-danger pp-btn-sm"
          onClick={() => {
            setConfirming(true);
          }}
        >
          {t('share.revoke')}
        </button>
      ) : (
        <span />
      )}
      <ConfirmDialog
        open={confirming}
        title={t('confirm.revokeLink', { label: link.label })}
        confirmLabel={t('share.revoke')}
        destructive
        onConfirm={async () => {
          await revokeShareLink(link.id);
          await queryClient.invalidateQueries({ queryKey: shareKeys.links });
        }}
        onClose={() => {
          setConfirming(false);
        }}
      />
    </div>
  );
}

const EXPIRY_CHOICES: { value: string; days: ExpiryDays }[] = [
  { value: '7', days: 7 },
  { value: '30', days: 30 },
  { value: '90', days: 90 },
  { value: 'never', days: null },
];
const DEFAULT_EXPIRY = { value: '30', days: 30 } as const;

/** "Deel-link maken": Klant, Label and Verloopt (Over 7, 30 or 90 dagen, or Nooit). */
function CreateDialog({
  onCreated,
  onClose,
}: {
  onCreated: (created: CreatedShareLink) => void;
  onClose: () => void;
}) {
  const id = useId();
  const queryClient = useQueryClient();
  const customers = useQuery({
    queryKey: keys.customers(true, false),
    queryFn: () => fetchCustomers(true, false),
  });
  const choices = (customers.data?.customers ?? []).filter((customer) => !customer.deleted);
  const [customer, setCustomer] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [expiry, setExpiry] = useState('30');
  const [labelError, setLabelError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const chosen = customer ?? choices[0]?.folder ?? '';
  const notBilled = choices.find((c) => c.folder === chosen)?.noBilling === true;

  const submit = async () => {
    if (label.trim() === '') {
      setLabelError(true);
      return;
    }
    setBusy(true);
    setFailed(false);
    try {
      const result = await createShareLink({
        customer: chosen,
        label: label.trim(),
        // Nooit is null, so no `??` fallback here.
        expiresInDays: (EXPIRY_CHOICES.find((choice) => choice.value === expiry) ?? DEFAULT_EXPIRY)
          .days,
      });
      await queryClient.invalidateQueries({ queryKey: shareKeys.links });
      onCreated(result);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      title={t('share.create')}
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
            disabled={busy || chosen === ''}
            aria-busy={busy}
          >
            {busy && <span className="pp-spin" aria-hidden="true" />}
            {t('common.create')}
          </button>
        </>
      }
    >
      <div className="pp-col">
        {failed && <GenericError />}
        <div className="pp-field">
          <label htmlFor={`${id}-customer`}>{t('share.customer')}</label>
          <div className="pp-iwrap">
            <select
              id={`${id}-customer`}
              className="pp-input pp-select"
              value={chosen}
              data-autofocus
              aria-describedby={notBilled ? `${id}-customer-help` : undefined}
              onChange={(event) => {
                setCustomer(event.target.value);
              }}
            >
              {choices.map((c) => (
                <option key={c.folder} value={c.folder}>
                  {c.folder}
                </option>
              ))}
            </select>
            <ChevronDown className="pp-ico r" aria-hidden="true" />
          </div>
          {notBilled && (
            <span id={`${id}-customer-help`} className="pp-help">
              {t('share.notBilledHint')}
            </span>
          )}
        </div>
        <div className="pp-field">
          <label htmlFor={`${id}-label`}>{t('share.label')}</label>
          <input
            id={`${id}-label`}
            className="pp-input"
            value={label}
            maxLength={120}
            aria-invalid={labelError || undefined}
            aria-describedby={labelError ? `${id}-label-err` : undefined}
            onChange={(event) => {
              setLabel(event.target.value);
              setLabelError(false);
            }}
          />
          {labelError && <FieldError id={`${id}-label-err`}>{t('error.required')}</FieldError>}
        </div>
        <div className="pp-field">
          <label htmlFor={`${id}-expiry`}>{t('share.expires')}</label>
          <div className="pp-iwrap">
            <select
              id={`${id}-expiry`}
              className="pp-input pp-select"
              value={expiry}
              aria-describedby={expiry === 'never' ? `${id}-expiry-help` : undefined}
              onChange={(event) => {
                setExpiry(event.target.value);
              }}
            >
              {EXPIRY_CHOICES.map((choice) => (
                <option key={choice.value} value={choice.value}>
                  {choice.days === null
                    ? t('share.expiresNever')
                    : t('share.expiresIn', { days: choice.days })}
                </option>
              ))}
            </select>
            <ChevronDown className="pp-ico r" aria-hidden="true" />
          </div>
          {expiry === 'never' && (
            <span id={`${id}-expiry-help`} className="pp-help">
              {t('share.neverHelp')}
            </span>
          )}
        </div>
      </div>
    </Dialog>
  );
}
