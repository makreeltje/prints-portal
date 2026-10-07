import { TriangleAlert } from 'lucide-react';
import { useId, useState } from 'react';
import { t } from '../i18n/nl';
import { Dialog } from './Dialog';

/**
 * ConfirmDialog: names the object, Annuleren has initial focus, the confirm
 * button spins while the action runs, and a failure keeps the dialog open
 * with an inline error.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  /** The consequence sentence; omitted where the design system has no copy yet. */
  body?: string;
  confirmLabel: string;
  /** Default "Annuleren". */
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const bodyId = useId();

  const close = () => {
    setFailed(false);
    onClose();
  };

  async function confirm() {
    setBusy(true);
    setFailed(false);
    try {
      await onConfirm();
      setBusy(false);
      close();
    } catch {
      setBusy(false);
      setFailed(true);
    }
  }

  return (
    <Dialog
      open={open}
      title={title}
      onClose={close}
      busy={busy}
      size="sm"
      alert={destructive}
      describedBy={body === undefined ? undefined : bodyId}
      icon={
        destructive ? (
          <span className="app-confirm-icon">
            <TriangleAlert className="pp-ico pp-ico-20" aria-hidden="true" />
          </span>
        ) : undefined
      }
      footer={
        <>
          <button
            type="button"
            className="pp-btn pp-btn-secondary"
            disabled={busy}
            onClick={close}
            // Initial focus on the safe choice.
            data-autofocus
          >
            {cancelLabel ?? t('common.cancel')}
          </button>
          <button
            type="button"
            className={`pp-btn ${destructive ? 'pp-btn-danger-solid' : 'pp-btn-primary'}`}
            disabled={busy}
            aria-busy={busy}
            onClick={() => void confirm()}
          >
            {busy && <span className="pp-spin" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      {body !== undefined || failed ? (
        <>
          {body !== undefined && <div id={bodyId}>{body}</div>}
          {failed && (
            <div className="pp-alert unpaid" role="alert">
              <TriangleAlert className="pp-ico" aria-hidden="true" />
              <div>{t('error.generic')}</div>
            </div>
          )}
        </>
      ) : undefined}
    </Dialog>
  );
}
