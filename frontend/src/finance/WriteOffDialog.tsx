import { TriangleAlert } from 'lucide-react';
import { useId, useState } from 'react';
import { Dialog } from '../components/Dialog';
import { GenericError } from '../components/FieldError';
import { formatMoney } from '../i18n/format';
import { t } from '../i18n/nl';

/**
 * WriteOffDialog: writes off the open remainder (never the full price of a
 * partially paid print), with an optional reason. Annuleren has focus first.
 */
export function WriteOffDialog({
  printName,
  remaining,
  paid,
  onConfirm,
  onClose,
}: {
  printName: string;
  remaining: number;
  paid: number;
  onConfirm: (reason: string | null) => Promise<void>;
  onClose: () => void;
}) {
  const id = useId();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const amount = formatMoney(remaining);

  const confirm = async () => {
    setBusy(true);
    setFailed(false);
    try {
      await onConfirm(reason.trim() === '' ? null : reason.trim());
      setBusy(false);
      onClose();
    } catch {
      setBusy(false);
      setFailed(true);
    }
  };

  return (
    <Dialog
      open
      title={t('confirm.writeOff', { amount })}
      onClose={onClose}
      busy={busy}
      alert
      describedBy={`${id}-body`}
      icon={
        <span className="app-confirm-icon">
          <TriangleAlert className="pp-ico pp-ico-20" aria-hidden="true" />
        </span>
      }
      footer={
        <>
          <button
            type="button"
            className="pp-btn pp-btn-secondary"
            data-autofocus
            disabled={busy}
            onClick={onClose}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="pp-btn pp-btn-danger-solid"
            disabled={busy}
            aria-busy={busy}
            onClick={() => void confirm()}
          >
            {busy && <span className="pp-spin" aria-hidden="true" />}
            {t('pay.writeOff')}
          </button>
        </>
      }
    >
      <div className="pp-col">
        {failed && <GenericError />}
        <span id={`${id}-body`}>{t('confirm.writeOffBody', { name: printName, amount })}</span>
        {paid > 0 && (
          <span className="pp-muted">
            {t('confirm.writeOffPaid', { amount: formatMoney(paid) })}
          </span>
        )}
        <div className="pp-field">
          <label htmlFor={`${id}-reason`}>{t('pay.writeOffReason')}</label>
          <textarea
            id={`${id}-reason`}
            className="pp-input"
            maxLength={500}
            value={reason}
            aria-describedby={`${id}-help`}
            onChange={(event) => {
              setReason(event.target.value);
            }}
          />
          <span id={`${id}-help`} className="pp-help">
            {t('pay.writeOffReasonHelp')}
          </span>
        </div>
      </div>
    </Dialog>
  );
}
