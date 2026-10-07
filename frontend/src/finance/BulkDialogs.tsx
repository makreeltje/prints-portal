import { TriangleAlert } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Dialog } from '../components/Dialog';
import { FieldError, GenericError } from '../components/FieldError';
import { parseAmount } from '../i18n/format';
import { t } from '../i18n/nl';
import type { BulkFailure } from './bulk-results';
import { SpoolPopover } from './SpoolPicker';

/**
 * The `warning` alert above the grid after a bulk action with failures:
 * "{n} prints niet bijgewerkt" and one `.pp-results` line per print. It
 * takes focus when it appears (BulkDialogs accessibility).
 */
export function BulkFailures({ failures }: { failures: readonly BulkFailure[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, [failures]);
  return (
    <div ref={ref} className="pp-alert warning" role="alert" tabIndex={-1}>
      <TriangleAlert className="pp-ico" aria-hidden="true" />
      <div>
        <b>{t('bulk.failedTitle', { count: failures.length })}</b>
        <ul className="pp-results">
          {failures.map((failure) => (
            <li key={failure.id}>
              <span>{failure.name}</span>
              <span className="why">{failure.reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Footer({ busy, label, onClose }: { busy: boolean; label: string; onClose: () => void }) {
  return (
    <>
      <button type="button" className="pp-btn pp-btn-secondary" disabled={busy} onClick={onClose}>
        {t('common.cancel')}
      </button>
      <button type="submit" className="pp-btn pp-btn-primary" disabled={busy} aria-busy={busy}>
        {busy && <span className="pp-spin" aria-hidden="true" />}
        {label}
      </button>
    </>
  );
}

/** "Spoel toewijzen aan {n} prints": the spool for the whole print on every selected print. */
export function BulkSpoolDialog({
  count,
  onApply,
  onClose,
}: {
  count: number;
  onApply: (spoolId: number | null) => Promise<void>;
  onClose: () => void;
}) {
  const [spoolId, setSpoolId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const submit = async () => {
    setBusy(true);
    setFailed(false);
    try {
      await onApply(spoolId);
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
      title={t('bulk.spoolTitle', { count })}
      onClose={onClose}
      busy={busy}
      onSubmit={() => void submit()}
      footer={<Footer busy={busy} label={t('bulk.assign')} onClose={onClose} />}
    >
      <div className="pp-col">
        {failed && <GenericError />}
        <span className="pp-muted">{t('bulk.spoolIntro')}</span>
        <SpoolPopover selected={spoolId} onPick={setSpoolId} inline />
        <span className="pp-help">{t('bulk.spoolKeep')}</span>
      </div>
    </Dialog>
  );
}

/**
 * "Prijs instellen voor {n} prints": one price for every print, or each
 * print's own "Voorstel uit marge". It goes on the newest order.
 */
export function BulkPriceDialog({
  count,
  markupPercent,
  onApply,
  onClose,
}: {
  count: number;
  markupPercent: number | null;
  onApply: (choice: { salePrice: number } | { suggested: true }) => Promise<void>;
  onClose: () => void;
}) {
  const id = useId();
  const [mode, setMode] = useState<'same' | 'suggested'>('same');
  const [text, setText] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const submit = async () => {
    let choice: { salePrice: number } | { suggested: true };
    if (mode === 'same') {
      const value = parseAmount(text);
      if (value === null || value < 0) {
        setInvalid(true);
        return;
      }
      choice = { salePrice: value };
    } else choice = { suggested: true };
    setInvalid(false);
    setBusy(true);
    setFailed(false);
    try {
      await onApply(choice);
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
      title={t('bulk.priceTitle', { count })}
      onClose={onClose}
      busy={busy}
      onSubmit={() => void submit()}
      footer={<Footer busy={busy} label={t('bulk.setPrice')} onClose={onClose} />}
    >
      <div className="pp-col">
        {failed && <GenericError />}
        <span className="pp-muted">{t('bulk.priceIntro')}</span>
        <label className="pp-opt">
          <input
            type="radio"
            className="pp-radio"
            name={`${id}-mode`}
            checked={mode === 'same'}
            onChange={() => {
              setMode('same');
            }}
          />
          {t('bulk.priceSame')}
        </label>
        <div className="pp-field">
          <label htmlFor={`${id}-price`}>{t('pay.salePrice')}</label>
          <div className="pp-affix pre">
            <input
              id={`${id}-price`}
              className="pp-input"
              inputMode="decimal"
              data-autofocus
              value={text}
              disabled={mode !== 'same'}
              aria-invalid={invalid || undefined}
              aria-describedby={invalid ? `${id}-err` : undefined}
              onChange={(event) => {
                setText(event.target.value);
              }}
            />
            <span className="pp-suffix">€</span>
          </div>
          {invalid && <FieldError id={`${id}-err`}>{t('error.invalidAmount')}</FieldError>}
        </div>
        {markupPercent !== null && (
          <>
            <label className="pp-opt">
              <input
                type="radio"
                className="pp-radio"
                name={`${id}-mode`}
                checked={mode === 'suggested'}
                aria-describedby={`${id}-skip`}
                onChange={() => {
                  setMode('suggested');
                }}
              />
              {t('bulk.priceSuggested', { margin: markupPercent })}
            </label>
            <span id={`${id}-skip`} className="pp-help">
              {t('bulk.priceSkipNoCost')}
            </span>
          </>
        )}
      </div>
    </Dialog>
  );
}
