import { useMutation } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Dialog } from '../components/Dialog';
import { GenericError } from '../components/FieldError';
import { t } from '../i18n/nl';
import { runBulk } from '../finance/api';
import { deleteRequest, type QueueRow } from './api-queue';
import type { RequestState } from './types';

/** With files: the four values of the control. Without: the queue's own two. */
const WITH_FILES: (RequestState | null)[] = ['undecided', 'inProgress', 'declined', null];
const FILELESS: (RequestState | null)[] = ['undecided', 'inProgress'];

const labelFor = (state: RequestState | null) =>
  state === null ? t('request.none') : t(`request.${state}`);

/**
 * "Status wijzigen" on a queue row (ScreenQueue 2.14, GAP-159).
 *
 * 2.14 refused the third row action this app had improvised ("Uit de wachtrij
 * halen") — absence is a value, not an operation (GAP-138) — and wrote the
 * ending down here instead. What the dialog offers depends on one observed
 * fact, whether the record has files:
 *
 * - **with files**: the four values, as everywhere else. "Niet doorgegaan" and
 *   "Geen status" take the row off the queue and the print keeps its place on
 *   the dashboard, because the files are the record.
 * - **no files**: the two queue states only, with the help line that says why,
 *   and below a hairline the ghost "Aanvraag verwijderen". This page is the
 *   only place a fileless record appears, so either other value would leave it
 *   alive in the database and on no screen at all.
 */
export function QueueStatusDialog({
  row,
  onClose,
  onDone,
  onDeleted,
}: {
  row: QueueRow;
  onClose: () => void;
  onDone: () => void;
  onDeleted: () => void;
}) {
  const id = useId();
  const [state, setState] = useState<RequestState | null>(row.requestState);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const options = row.hasFiles ? WITH_FILES : FILELESS;

  const save = useMutation({
    mutationFn: () => runBulk([row.id], { action: 'setRequestState', state }),
    onSuccess: onDone,
  });
  const remove = useMutation({
    mutationFn: () => deleteRequest(row.id),
    onSuccess: onDeleted,
  });
  const busy = save.isPending || remove.isPending;

  return (
    <>
      <Dialog
        open={!confirmRemove}
        title={t('queue.changeStatus')}
        onClose={onClose}
        closeLabel={t('common.close')}
        busy={busy}
        onSubmit={() => {
          save.mutate();
        }}
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
            <button type="submit" className="pp-btn pp-btn-primary" disabled={busy}>
              {save.isPending && <span className="pp-spin" aria-hidden="true" />}
              {t('common.save')}
            </button>
          </>
        }
      >
        {save.isError && <GenericError />}
        <div className="pp-field" role="group" aria-labelledby={`${id}-label`}>
          <span className="pp-flabel" id={`${id}-label`}>
            {t('queue.add.status')}
          </span>
          <div className="pp-col pp-gap-1">
            {options.map((option) => (
              <label className="pp-opt" key={option ?? 'none'}>
                <input
                  type="radio"
                  className="pp-radio"
                  name={`${id}-state`}
                  checked={state === option}
                  disabled={busy}
                  onChange={() => {
                    setState(option);
                  }}
                />
                {labelFor(option)}
              </label>
            ))}
          </div>
          {!row.hasFiles && <span className="pp-help">{t('queue.statusHelp.fileless')}</span>}
        </div>
        {/*
          The ending, inside the dialog the row already has rather than as a
          third button on the row. A hairline separates it from the values: it
          is not one of them.
        */}
        {!row.hasFiles && (
          <>
            <hr className="pp-rule-t" />
            <div>
              <button
                type="button"
                className="pp-btn pp-btn-ghost"
                disabled={busy}
                onClick={() => {
                  setConfirmRemove(true);
                }}
              >
                <Trash2 className="pp-ico" aria-hidden="true" />
                {t('queue.remove')}
              </button>
            </div>
          </>
        )}
      </Dialog>
      <ConfirmDialog
        open={confirmRemove}
        title={t('queue.remove.confirm', { naam: row.name })}
        body={t('queue.remove.confirmBody')}
        confirmLabel={t('common.delete')}
        destructive
        onConfirm={async () => {
          await remove.mutateAsync();
        }}
        onClose={() => {
          setConfirmRemove(false);
        }}
      />
    </>
  );
}
