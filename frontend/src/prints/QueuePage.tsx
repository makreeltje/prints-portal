import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown,
  CircleAlert,
  Clock,
  Link as LinkIcon,
  Plus,
  TriangleAlert,
} from 'lucide-react';
import { useId, useState } from 'react';
import { Dialog } from '../components/Dialog';
import { GenericError } from '../components/FieldError';
import { t, type MessageKey } from '../i18n/nl';
import { formatMoney } from '../i18n/format';
import { ErrorState, LoadingRows } from '../pages/ErrorState';
import { useToast } from '../components/toast-context';
import {
  addRequest,
  fetchQueue,
  linkRequest,
  queueKeys,
  type QueueGroup,
  type QueueRow,
} from './api-queue';
import { fetchCustomers, fetchPrints, keys } from './api';
import { placeOf } from './filter';
import type { PrintFilter } from './types';

/*
  The same three age steps as Openstaand, and the same caveat: the thresholds
  are the design system's and unmeasured for a queue (GAP-145). A request
  sitting 30 days may already be bad where 30 days of an unpaid invoice is not.
  The app picks the class, so they move without a design change.
*/
const AGE_WARNING_AFTER_DAYS = 30;
const AGE_LATE_AFTER_DAYS = 90;

const ageTone = (days: number): string =>
  days > AGE_LATE_AFTER_DAYS ? 'unpaid' : days > AGE_WARNING_AFTER_DAYS ? 'warning' : 'neutral';

const AgeIcon = ({ days }: { days: number }) =>
  days > AGE_LATE_AFTER_DAYS ? (
    <CircleAlert className="pp-ico" aria-hidden="true" />
  ) : days > AGE_WARNING_AFTER_DAYS ? (
    <TriangleAlert className="pp-ico" aria-hidden="true" />
  ) : (
    <Clock className="pp-ico" aria-hidden="true" />
  );

const GROUP_LABEL: Record<QueueGroup['state'], MessageKey> = {
  undecided: 'queue.group.notDecided',
  inProgress: 'queue.group.inProgress',
};

/**
 * Wachtrij (`/wachtrij`): work asked for and not finished — the jobs the owner
 * is otherwise holding in his head (ScreenQueue 2.10).
 *
 * It is a page rather than a dashboard block on his own numbers: about four
 * open requests normally and regularly above ten, and the state that costs him
 * is the one where ten are invisible.
 *
 * A record with no files appears here and nowhere else (GAP-123); the backend
 * enforces that, so this page needs no filter of its own.
 */
export function QueuePage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [linking, setLinking] = useState<QueueRow | null>(null);
  const queue = useQuery({ queryKey: queueKeys.all, queryFn: fetchQueue });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queueKeys.all });
    await queryClient.invalidateQueries({ queryKey: keys.all });
  };

  if (queue.isPending) return <LoadingRows />;
  if (queue.isError)
    return <ErrorState body={t('error.generic')} onRetry={() => void queue.refetch()} />;

  const groups = queue.data.groups;
  return (
    <>
      <div className="pp-ph">
        <h1>{t('queue.title')}</h1>
        <button
          type="button"
          className="pp-btn pp-btn-primary"
          onClick={() => {
            setAdding(true);
          }}
        >
          <Plus className="pp-ico" aria-hidden="true" />
          {t('queue.add')}
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="pp-empty">
          <h3>{t('queue.empty')}</h3>
          <p>{t('queue.emptyBody')}</p>
        </div>
      ) : (
        groups.map((group) => <Group key={group.state} group={group} onLink={setLinking} />)
      )}

      {adding && (
        <AddRequestDialog
          onClose={() => {
            setAdding(false);
          }}
          onDone={() => {
            setAdding(false);
            void refresh();
          }}
        />
      )}
      {linking !== null && (
        <LinkFilesDialog
          row={linking}
          onClose={() => {
            setLinking(null);
          }}
          onDone={() => {
            setLinking(null);
            toast.success(t('toast.saved'));
            void refresh();
          }}
        />
      )}
    </>
  );
}

/** One state's group, in OutstandingGroup's form; both are open by default. */
function Group({ group, onLink }: { group: QueueGroup; onLink: (row: QueueRow) => void }) {
  const titleId = useId();
  return (
    <details className="pp-card pp-group pp-ogrp" open>
      <summary>
        <span className="ttl">
          <h3 id={titleId}>{t(GROUP_LABEL[group.state])}</h3>
          <span className="pp-muted pp-text-sm">
            {t('queue.groupMeta', { count: group.rows.length })}
          </span>
        </span>
        {/*
          The age badge belongs here — the preview has drawn it since 2.10 and
          `outstanding.oldestDays` exists for it since 2.11 — but it is held
          back on this screen until GAP-155 is settled, by the owner's
          decision. `.pp-ogrp > summary`'s phone rule pairs `.age` with
          `.amt`, which was written for Openstaand where `.amt` is money; here
          it is a sentence, and at 360px the two overprint by 10px while the
          group heading is squeezed onto two lines. The age is on every row
          below, so nothing is lost by waiting. Openstaand renders the badge
          today: there the slot is clear in all eleven groups.
        */}
        <span className="age" />
        {/*
          The one figure that answers "how much of my own labour is queued",
          without a second state and without a second assertion (GAP-143).
        */}
        <span className="amt pp-muted pp-text-sm">
          {group.withoutFiles === 0
            ? null
            : t('queue.ofWhichWithoutFiles', { count: group.withoutFiles })}
        </span>
        <span className="chev">
          <ChevronDown className="pp-ico" aria-hidden="true" />
        </span>
      </summary>
      <div className="pp-ogrp-list">
        {group.rows.map((row) => (
          <Row key={row.id} row={row} onLink={onLink} />
        ))}
      </div>
    </details>
  );
}

function Row({ row, onLink }: { row: QueueRow; onLink: (row: QueueRow) => void }) {
  return (
    <div className="pp-line">
      <div>
        <b className="pp-strong">{row.name}</b>
        <div className="pp-muted">
          {placeOf({
            customerFolder: row.customerFolder,
            projectFolder: row.projectFolder,
            name: row.name,
          })}
        </div>
        {/*
          The observation, never the inference: a print can lack files because
          nothing was downloaded yet, not only because it must be designed.
        */}
        {!row.hasFiles && <div className="pp-reason">{t('queue.noFiles')}</div>}
      </div>
      <span className={`pp-badge ${ageTone(row.waitingDays)}`}>
        <AgeIcon days={row.waitingDays} />
        {t('queue.waiting', { count: row.waitingDays })}
      </span>
      <span className="pp-right">
        {row.price === null ? null : <span className="pp-money">{formatMoney(row.price)}</span>}
      </span>
      <div className="pp-row acts pp-gap-1 pp-nowrap">
        {!row.hasFiles && (
          <button
            type="button"
            className="pp-btn pp-btn-ghost pp-btn-sm"
            onClick={() => {
              onLink(row);
            }}
          >
            <LinkIcon className="pp-ico" aria-hidden="true" />
            {t('queue.linkFiles')}
          </button>
        )}
        <a className="pp-btn pp-btn-ghost pp-btn-sm" href={`/prints/${row.id}`}>
          {t('queue.changeStatus')}
        </a>
      </div>
    </div>
  );
}

/** "Aanvraag toevoegen": klant and what was asked. No folder is made (rule 7). */
function AddRequestDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const id = useId();
  const [customer, setCustomer] = useState('');
  const [name, setName] = useState('');
  const customers = useQuery({
    queryKey: keys.customers(false, false),
    queryFn: () => fetchCustomers(false, false),
  });
  const save = useMutation({
    mutationFn: () => addRequest(customer, name),
    onSuccess: onDone,
  });
  const ready = customer !== '' && name.trim() !== '';
  return (
    <Dialog
      open
      title={t('queue.addTitle')}
      onClose={onClose}
      busy={save.isPending}
      onSubmit={() => {
        if (ready) save.mutate();
      }}
      footer={
        <>
          <button type="button" className="pp-btn pp-btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="pp-btn pp-btn-primary"
            disabled={!ready || save.isPending}
          >
            {save.isPending && <span className="pp-spin" aria-hidden="true" />}
            {t('queue.add')}
          </button>
        </>
      }
    >
      <div className="pp-col">
        {save.isError && <GenericError />}
        <label className="pp-field">
          <span className="pp-label" id={`${id}-klant`}>
            {t('queue.addKlant')}
          </span>
          <div className="pp-iwrap">
            <select
              className="pp-input"
              aria-labelledby={`${id}-klant`}
              value={customer}
              onChange={(event) => {
                setCustomer(event.target.value);
              }}
            >
              <option value="">—</option>
              {(customers.data?.customers ?? []).map((one) => (
                <option key={one.folder} value={one.folder}>
                  {one.folder}
                </option>
              ))}
            </select>
          </div>
        </label>
        <label className="pp-field">
          <span className="pp-label">{t('queue.addName')}</span>
          <input
            className="pp-input"
            value={name}
            data-autofocus
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
        </label>
      </div>
    </Dialog>
  );
}

/**
 * "Bestanden koppelen": point the request at a folder that already exists.
 * Nothing here creates one — `/prints` belongs to Nextcloud (rule 7).
 */
function LinkFilesDialog({
  row,
  onClose,
  onDone,
}: {
  row: QueueRow;
  onClose: () => void;
  onDone: () => void;
}) {
  const id = useId();
  const [printId, setPrintId] = useState('');
  /*
    Only this klant's prints: the folder the request belongs to is one of
    theirs, and a list of all 84 would be a worse control than a short one.
  */
  const filter: PrintFilter = {
    customer: row.customerFolder,
    tagIds: [],
    search: '',
    archived: false,
    deleted: false,
    sort: 'newest',
    status: null,
  };
  const prints = useQuery({
    queryKey: keys.list(filter),
    queryFn: () => fetchPrints(filter, 0),
  });
  const save = useMutation({
    mutationFn: () => linkRequest(row.id, printId),
    onSuccess: onDone,
  });
  return (
    <Dialog
      open
      title={t('queue.linkTitle', { naam: row.name })}
      onClose={onClose}
      busy={save.isPending}
      onSubmit={() => {
        if (printId !== '') save.mutate();
      }}
      footer={
        <>
          <button type="button" className="pp-btn pp-btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="pp-btn pp-btn-primary"
            disabled={printId === '' || save.isPending}
          >
            {save.isPending && <span className="pp-spin" aria-hidden="true" />}
            {t('queue.linkFiles')}
          </button>
        </>
      }
    >
      <div className="pp-col">
        {save.isError && <GenericError />}
        <span className="pp-muted">{t('queue.linkIntro')}</span>
        <label className="pp-field">
          <span className="pp-label" id={`${id}-print`}>
            {t('queue.linkPick')}
          </span>
          <div className="pp-iwrap">
            <select
              className="pp-input"
              aria-labelledby={`${id}-print`}
              data-autofocus
              value={printId}
              onChange={(event) => {
                setPrintId(event.target.value);
              }}
            >
              <option value="">—</option>
              {(prints.data?.items ?? []).map((print) => (
                <option key={print.id} value={print.id}>
                  {print.name}
                </option>
              ))}
            </select>
          </div>
        </label>
      </div>
    </Dialog>
  );
}
