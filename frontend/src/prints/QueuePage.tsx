import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  ChevronDown,
  CircleAlert,
  Clock,
  ExternalLink,
  Link as LinkIcon,
  Plus,
  StickyNote,
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
import { fetchCustomers, fetchPrints, keys, setPrintNote, setPrintSource } from './api';
import { runBulk } from '../finance/api';
import { isHttpUrl } from '../core/url';
import { MAX_NOTE_LENGTH } from './notes';
import { placeOf } from './filter';
import { SourceLink } from './PrintSource';
import type { PrintFilter } from './types';

/*
  The same three age steps as Openstaand, with the owner's own numbers rather
  than money's (GAP-145, settled 2026-10-18). Openstaand borrowed 30 and 90
  from an unpaid invoice, and a job waiting is not an invoice waiting: "een
  print die drie weken ligt voelt anders dan een factuur die drie weken
  openstaat". The app picks the class, so they moved without a design change.
*/
const AGE_WARNING_AFTER_DAYS = 7;
const AGE_LATE_AFTER_DAYS = 21;

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
        groups.map((group) => (
          <Group
            key={group.state}
            group={group}
            onLink={setLinking}
            onDone={async (row) => {
              await runBulk([row.id], { action: 'setRequestState', state: null });
              toast.success(t('toast.saved'));
              await refresh();
            }}
          />
        ))
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
function Group({
  group,
  onLink,
  onDone,
}: {
  group: QueueGroup;
  onLink: (row: QueueRow) => void;
  onDone: (row: QueueRow) => Promise<void>;
}) {
  const titleId = useId();
  const oldestDays = Math.max(...group.rows.map((row) => row.waitingDays));
  return (
    <details className="pp-card pp-group pp-ogrp" open>
      <summary>
        <span className="ttl">
          <h3 id={titleId}>{t(GROUP_LABEL[group.state])}</h3>
          <span className="pp-muted pp-text-sm">
            {t('queue.groupMeta', { count: group.rows.length })}
          </span>
          {/*
            "How much of my own labour is queued", answered without a second
            state and without a second assertion (GAP-143). It is a fact about
            what the group contains, like the count above it, so it is `.ttl`'s
            second muted line — not `.amt`, where 2.10 put it: `.amt` is one
            `auto` track for both rows of the phone grid, so a 181px sentence
            in it left the heading 109px and two lines (GAP-155, 2.12).
          */}
          {group.withoutFiles > 0 && (
            <span className="pp-muted pp-text-sm">
              {t('queue.ofWhichWithoutFiles', { count: group.withoutFiles })}
            </span>
          )}
        </span>
        <span className={`age pp-badge ${ageTone(oldestDays)}`}>
          <AgeIcon days={oldestDays} />
          {t('outstanding.oldestDays', { days: oldestDays })}
        </span>
        {/*
          Empty on this screen and kept in the markup, as `.pp-right` is kept
          on a line with no price: it holds the summary's four tracks so the
          chevron keeps its own and no CSS has to know which screen it draws
          (OutstandingGroup, *The slots*).
        */}
        <span className="amt" />
        <span className="chev">
          <ChevronDown className="pp-ico" aria-hidden="true" />
        </span>
      </summary>
      <div className="pp-ogrp-list">
        {group.rows.map((row) => (
          <Row key={row.id} row={row} onLink={onLink} onDone={onDone} />
        ))}
      </div>
    </details>
  );
}

function Row({
  row,
  onLink,
  onDone,
}: {
  row: QueueRow;
  onLink: (row: QueueRow) => void;
  onDone: (row: QueueRow) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
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
        {/*
          A bron only where there are no files — with files on disk the row's
          job is done and the link is noise (PrintSource). The note shows on
          any row, because the work outlives the arrival of the files
          (PrintNote). Order inside the block is fixed by the spec: name,
          klant, "Nog geen bestanden", bron, notitie, each one line.
        */}
        {row.source !== null && (
          <div className="pp-reason one pp-row pp-gap-1">
            <ExternalLink className="pp-ico" aria-hidden="true" />
            <SourceLink source={{ ...row.source, fileName: null }} />
            {row.sourceCount > 1 && (
              <span className="n pp-muted">
                {t('print.source.more', { count: row.sourceCount - 1 })}
              </span>
            )}
          </div>
        )}
        {row.note !== null && (
          <div className="pp-reason one pp-row pp-gap-1">
            <StickyNote className="pp-ico" aria-hidden="true" />
            <span>{row.note}</span>
          </div>
        )}
      </div>
      <span className={`pp-badge ${ageTone(row.waitingDays)}`}>
        <AgeIcon days={row.waitingDays} />
        {t('queue.waiting', { count: row.waitingDays })}
      </span>
      <span className="pp-right">
        {row.price === null ? null : <span className="pp-money">{formatMoney(row.price)}</span>}
      </span>
      <div className="pp-row acts pp-gap-1">
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
        {/*
          The act every finished job needs, with a word for it (ds-gap:
          GAP-159, the owner's decision). It writes the same null the detail
          page's "Geen status" writes — nothing new is stored — but on the
          detail page that value means undo, and here it means done. The one
          surface where a job is finished should not ask the owner to say
          "this has no status". It is a third action on a row the design
          system drew with two; that cost is in the gap.
        */}
        <button
          type="button"
          className="pp-btn pp-btn-ghost pp-btn-sm"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void onDone(row).finally(() => {
              setBusy(false);
            });
          }}
        >
          {busy ? (
            <span className="pp-spin" aria-hidden="true" />
          ) : (
            <Check className="pp-ico" aria-hidden="true" />
          )}
          {t('queue.done')}
        </button>
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
  const [source, setSource] = useState('');
  const [note, setNote] = useState('');
  const [invalidSource, setInvalidSource] = useState(false);
  const customers = useQuery({
    queryKey: keys.customers(false, false),
    queryFn: () => fetchCustomers(false, false),
  });
  const save = useMutation({
    mutationFn: async () => {
      const id = (await addRequest(customer, name)).id;
      // Two more calls rather than three fields on one route: the two are
      // fields of a print, and a request is a print (PrintSource, PrintNote).
      const trimmed = source.trim();
      if (trimmed !== '') await setPrintSource(id, trimmed);
      if (note.trim() !== '') await setPrintNote(id, note);
    },
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
        if (!ready) return;
        // The same single rule the print detail and the backend apply.
        if (source.trim() !== '' && !isHttpUrl(source.trim())) {
          setInvalidSource(true);
          return;
        }
        save.mutate();
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
              className="pp-input pp-select"
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
            <ChevronDown className="pp-ico r" aria-hidden="true" />
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
        {/*
          Bron and notitie, which PrintSource and PrintNote both say this
          dialog carries — "when it is designed". Its anatomy still is not
          (ds-gap: GAP-157), so these reuse the two fields above rather than
          inventing a shape. They are why the dialog is worth having on a
          phone at all: a request arrives with a link, and asking the owner to
          save it and then go and find the print to paste it would undo the
          capture this whole page exists for.
        */}
        {/*
          `for`/`id` rather than a wrapping label (FormField): help and error
          text belong to `aria-describedby`, and inside a label they would be
          read as part of the field's name instead.
        */}
        <div className="pp-field">
          <label className="pp-label" htmlFor={`${id}-src`}>
            {t('print.source')}
          </label>
          <input
            id={`${id}-src`}
            className="pp-input"
            type="url"
            inputMode="url"
            value={source}
            placeholder={t('print.source.placeholder')}
            aria-invalid={invalidSource ? 'true' : undefined}
            aria-describedby={invalidSource ? `${id}-src-err` : undefined}
            onChange={(event) => {
              setSource(event.target.value);
              setInvalidSource(false);
            }}
          />
          {invalidSource && (
            <span className="pp-err" id={`${id}-src-err`} role="alert">
              {t('print.source.invalid')}
            </span>
          )}
        </div>
        <div className="pp-field">
          <label className="pp-label" htmlFor={`${id}-note`}>
            {t('print.note')}
          </label>
          <textarea
            id={`${id}-note`}
            className="pp-input"
            rows={2}
            maxLength={MAX_NOTE_LENGTH}
            value={note}
            placeholder={t('print.note.placeholder')}
            aria-describedby={`${id}-note-help`}
            onChange={(event) => {
              setNote(event.target.value);
            }}
          />
          <span className="pp-help" id={`${id}-note-help`}>
            {t('print.note.internal')}
          </span>
        </div>
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
              className="pp-input pp-select"
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
            <ChevronDown className="pp-ico r" aria-hidden="true" />
          </div>
        </label>
      </div>
    </Dialog>
  );
}
