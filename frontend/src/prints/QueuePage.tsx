import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
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
import { fetchQueue, linkRequest, queueKeys, type QueueGroup, type QueueRow } from './api-queue';
import { fetchPrints, keys } from './api';
import { AanvraagDialog } from './AanvraagDialog';
import { QueueStatusDialog } from './QueueStatusDialog';
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
  const [changing, setChanging] = useState<QueueRow | null>(null);
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
          <Group key={group.state} group={group} onLink={setLinking} onStatus={setChanging} />
        ))
      )}

      {adding && (
        <AanvraagDialog
          onClose={() => {
            setAdding(false);
          }}
          onDone={() => {
            setAdding(false);
            toast.success(t('queue.added'));
            void refresh();
          }}
        />
      )}
      {changing !== null && (
        <QueueStatusDialog
          row={changing}
          onClose={() => {
            setChanging(null);
          }}
          onDone={() => {
            setChanging(null);
            toast.success(t('toast.saved'));
            void refresh();
          }}
          onDeleted={() => {
            setChanging(null);
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
  onStatus,
}: {
  group: QueueGroup;
  onLink: (row: QueueRow) => void;
  onStatus: (row: QueueRow) => void;
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
          <Row key={row.id} row={row} onLink={onLink} onStatus={onStatus} />
        ))}
      </div>
    </details>
  );
}

function Row({
  row,
  onLink,
  onStatus,
}: {
  row: QueueRow;
  onLink: (row: QueueRow) => void;
  onStatus: (row: QueueRow) => void;
}) {
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
          Two ghost buttons and no more (ScreenQueue 2.14, GAP-159). 2.13 and
          the owner's decision had put a third here, "Uit de wachtrij halen",
          which wrote the same null the detail page writes; 2.14 refused it,
          because absence is a value and not an operation (GAP-138). The act
          now lives inside this dialog, where a fileless request can also be
          thrown away — the only ending that does not leave it invisible.
        */}
        <button
          type="button"
          className="pp-btn pp-btn-ghost pp-btn-sm"
          onClick={() => {
            onStatus(row);
          }}
        >
          {t('queue.changeStatus')}
        </button>
      </div>
    </div>
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
