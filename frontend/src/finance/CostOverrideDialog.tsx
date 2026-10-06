import { useId, useState } from 'react';
import { FieldError, GenericError } from '../components/FieldError';
import { Dialog } from '../components/Dialog';
import { formatAmountInput, parseAmount } from '../i18n/format';
import { t } from '../i18n/nl';

export interface Overrides {
  pricePerKg: number | null;
  grams: number | null;
  printSeconds: number | null;
}

/**
 * CostOverrideDialog ("Kosten aanpassen") for an order: price per kg,
 * weight and print time by hand; empty means "niet overschrijven". When a
 * Spoolman spool gives the price, that field is disabled. "Terug naar
 * berekend" clears all three without asking.
 */
export function CostOverrideDialog({
  open,
  subject,
  initial,
  priceFromSpoolman,
  onSave,
  onClose,
}: {
  open: boolean;
  /** What is being adjusted (the print's name). */
  subject: string;
  initial: Overrides;
  priceFromSpoolman: boolean;
  onSave: (overrides: Overrides) => Promise<void>;
  onClose: () => void;
}) {
  const id = useId();
  const hoursOf = (s: number | null) => (s === null ? '' : String(Math.floor(s / 3600)));
  const minutesOf = (s: number | null) => (s === null ? '' : String(Math.round((s % 3600) / 60)));
  const [price, setPrice] = useState(
    initial.pricePerKg === null ? '' : formatAmountInput(initial.pricePerKg),
  );
  const [grams, setGrams] = useState(
    initial.grams === null ? '' : String(initial.grams).replace('.', ','),
  );
  const [hours, setHours] = useState(hoursOf(initial.printSeconds));
  const [minutes, setMinutes] = useState(minutesOf(initial.printSeconds));
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const run = async (values: Overrides) => {
    setBusy(true);
    setFailed(false);
    try {
      await onSave(values);
      setBusy(false);
      onClose();
    } catch {
      setBusy(false);
      setFailed(true);
    }
  };

  const save = () => {
    const bad = new Set<string>();
    const number = (field: string, text: string) => {
      if (text.trim() === '') return null;
      const value = parseAmount(text);
      if (value === null || value < 0) bad.add(field);
      return value;
    };
    const pricePerKg = priceFromSpoolman ? initial.pricePerKg : number('price', price);
    const gramsValue = number('grams', grams);
    const h = number('time', hours);
    const m = number('time', minutes);
    setInvalid(bad);
    if (bad.size > 0) return;
    const printSeconds =
      h === null && m === null ? null : Math.round(((h ?? 0) * 60 + (m ?? 0)) * 60);
    void run({ pricePerKg, grams: gramsValue, printSeconds });
  };

  const error = (field: string) =>
    invalid.has(field) ? (
      <FieldError id={`${id}-${field}-err`}>{t('error.invalidAmount')}</FieldError>
    ) : null;
  const described = (field: string, help?: string) =>
    [invalid.has(field) ? `${id}-${field}-err` : null, help ?? null]
      .filter((v) => v !== null)
      .join(' ') || undefined;

  return (
    <Dialog
      open={open}
      title={t('cost.adjustTitle')}
      onClose={onClose}
      busy={busy}
      size="sm"
      onSubmit={save}
      footer={
        <>
          <button
            type="button"
            className="pp-btn pp-btn-ghost pp-push"
            disabled={busy}
            onClick={() => void run({ pricePerKg: null, grams: null, printSeconds: null })}
          >
            {t('cost.resetToComputed')}
          </button>
          <button
            type="button"
            className="pp-btn pp-btn-secondary"
            disabled={busy}
            onClick={onClose}
          >
            {t('common.cancel')}
          </button>
          <button type="submit" className="pp-btn pp-btn-primary" disabled={busy} aria-busy={busy}>
            {busy && <span className="pp-spin" aria-hidden="true" />}
            {t('common.save')}
          </button>
        </>
      }
    >
      <div className="pp-col">
        {failed && <GenericError />}
        <span className="pp-muted pp-text-sm">{subject}</span>
        <div className="pp-field">
          <label htmlFor={`${id}-price`}>{t('cost.pricePerKg')}</label>
          <div className="pp-affix pre">
            <input
              id={`${id}-price`}
              className="pp-input"
              inputMode="decimal"
              value={price}
              disabled={priceFromSpoolman}
              aria-invalid={invalid.has('price') || undefined}
              aria-describedby={described(
                'price',
                priceFromSpoolman ? `${id}-spoolman` : undefined,
              )}
              onChange={(event) => {
                setPrice(event.target.value);
              }}
            />
            <span className="pp-suffix">€</span>
          </div>
          {priceFromSpoolman && (
            <span id={`${id}-spoolman`} className="pp-help">
              {t('cost.spoolmanPrice')}
            </span>
          )}
          {error('price')}
        </div>
        <div className="pp-field">
          <label htmlFor={`${id}-grams`}>{t('cost.weight')}</label>
          <div className="pp-affix">
            <input
              id={`${id}-grams`}
              className="pp-input"
              inputMode="decimal"
              value={grams}
              aria-invalid={invalid.has('grams') || undefined}
              aria-describedby={described('grams')}
              onChange={(event) => {
                setGrams(event.target.value);
              }}
            />
            <span className="pp-suffix">g</span>
          </div>
          {error('grams')}
        </div>
        <fieldset className="pp-field app-fieldset">
          <legend className="pp-label">{t('cost.printTime')}</legend>
          <div className="pp-row pp-gap-2 pp-nowrap">
            <div className="pp-affix pp-w-120">
              <input
                className="pp-input"
                inputMode="numeric"
                aria-label={`${t('cost.printTime')} (${t('cost.hours')})`}
                value={hours}
                aria-invalid={invalid.has('time') || undefined}
                onChange={(event) => {
                  setHours(event.target.value);
                }}
              />
              <span className="pp-suffix">{t('cost.hours')}</span>
            </div>
            <div className="pp-affix pp-w-120">
              <input
                className="pp-input"
                inputMode="numeric"
                aria-label={`${t('cost.printTime')} (${t('cost.minutes')})`}
                value={minutes}
                aria-invalid={invalid.has('time') || undefined}
                aria-describedby={described('time')}
                onChange={(event) => {
                  setMinutes(event.target.value);
                }}
              />
              <span className="pp-suffix">{t('cost.minutes')}</span>
            </div>
          </div>
          {error('time')}
        </fieldset>
        <span className="pp-help pp-info">{t('cost.manualSource')}</span>
      </div>
    </Dialog>
  );
}
