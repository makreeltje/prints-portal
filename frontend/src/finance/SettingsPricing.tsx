import { useQueryClient } from '@tanstack/react-query';
import { Trash2, X } from 'lucide-react';
import { useId, useState, type KeyboardEvent } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FieldError } from '../components/FieldError';
import { useToast } from '../components/toast-context';
import { formatAmountInput, parseAmount } from '../i18n/format';
import { t } from '../i18n/nl';
import { saveSettings, type PrinterProfile, type Settings } from './api';

interface MaterialRow {
  key: number;
  name: string;
  price: string;
}

/**
 * Prijzen (ScreenSettings 1.4): Standaardmarge, Stroomtarief and the
 * Materiaalprijzen table (unique names, "Materiaal toevoegen"), saved
 * together with one Opslaan.
 */
export function PricingSection({ pricing }: { pricing: Settings['pricing'] }) {
  const id = useId();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [markup, setMarkup] = useState(
    pricing.defaultMarkupPercent === null
      ? ''
      : String(pricing.defaultMarkupPercent).replace('.', ','),
  );
  const [tariff, setTariff] = useState(
    pricing.tariffEurPerKwh === null ? '' : formatAmountInput(pricing.tariffEurPerKwh),
  );
  const [rows, setRows] = useState<MaterialRow[]>(() =>
    Object.entries(pricing.materialPricesPerKg).map(([name, price], key) => ({
      key,
      name,
      price: formatAmountInput(price),
    })),
  );
  const [nextKey, setNextKey] = useState(rows.length);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const found: Record<string, string> = {};
    const optional = (text: string) => (text.trim() === '' ? null : parseAmount(text));
    const markupValue = optional(markup);
    if (markup.trim() !== '' && (markupValue === null || markupValue < 0)) {
      found.markup = t('error.invalidAmount');
    }
    const tariffValue = optional(tariff);
    if (tariff.trim() !== '' && (tariffValue === null || tariffValue < 0 || tariffValue > 10)) {
      found.tariff = t('error.invalidTariff');
    }
    const prices: Record<string, number> = {};
    const seen = new Set<string>();
    for (const row of rows) {
      const name = row.name.trim();
      if (name === '') continue;
      if (seen.has(name.toLowerCase()))
        found[`name-${String(row.key)}`] = t('error.materialExists');
      seen.add(name.toLowerCase());
      const price = parseAmount(row.price);
      if (price === null || price < 0) found[`price-${String(row.key)}`] = t('error.invalidAmount');
      else prices[name] = price;
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setBusy(true);
    try {
      await saveSettings('pricing', {
        defaultMarkupPercent: markupValue,
        tariffEurPerKwh: tariffValue,
        materialPricesPerKg: prices,
      });
      await queryClient.invalidateQueries();
    } catch {
      toast.error(t('error.saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const described = (key: string, help?: string) =>
    [errors[key] === undefined ? null : `${id}-${key}-err`, help ?? null]
      .filter((part) => part !== null)
      .join(' ') || undefined;
  const error = (key: string) =>
    errors[key] === undefined ? null : (
      <FieldError id={`${id}-${key}-err`}>{errors[key]}</FieldError>
    );

  return (
    <section className="pp-card pp-sec" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{t('settings.pricing')}</h2>
      <form
        className="pp-col pp-gap-3"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="pp-field">
          <label htmlFor={`${id}-markup`}>{t('settings.defaultMarkup')}</label>
          <div className="pp-affix pp-w-200">
            <input
              id={`${id}-markup`}
              className="pp-input"
              inputMode="decimal"
              value={markup}
              aria-invalid={errors.markup !== undefined || undefined}
              aria-describedby={described('markup', `${id}-markup-help`)}
              onChange={(event) => {
                setMarkup(event.target.value);
              }}
            />
            <span className="pp-suffix">%</span>
          </div>
          <span id={`${id}-markup-help`} className="pp-help">
            {t('settings.defaultMarkupHelp')}
          </span>
          {error('markup')}
        </div>
        <div className="pp-field">
          <label htmlFor={`${id}-tariff`}>{t('settings.electricityTariff')}</label>
          <div className="pp-affix pp-w-200">
            <input
              id={`${id}-tariff`}
              className="pp-input"
              inputMode="decimal"
              value={tariff}
              aria-invalid={errors.tariff !== undefined || undefined}
              aria-describedby={described('tariff', `${id}-tariff-help`)}
              onChange={(event) => {
                setTariff(event.target.value);
              }}
            />
            <span className="pp-suffix">€/kWh</span>
          </div>
          {errors.tariff === undefined ? (
            <span id={`${id}-tariff-help`} className="pp-help">
              {t('settings.electricityTariffHelp')}
            </span>
          ) : (
            error('tariff')
          )}
        </div>
        <div className="pp-field">
          <span id={`${id}-materials`} className="pp-label">
            {t('settings.materialPrices')}
          </span>
          <table className="pp-mprices" aria-labelledby={`${id}-materials`}>
            <thead>
              <tr>
                <th scope="col">{t('settings.material')}</th>
                <th scope="col">{t('settings.pricePerKg')}</th>
                <th scope="col">
                  <span className="pp-sr">{t('common.delete')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const nameKey = `name-${String(row.key)}`;
                const priceKey = `price-${String(row.key)}`;
                return (
                  <tr key={row.key}>
                    <td>
                      <input
                        className="pp-input"
                        value={row.name}
                        aria-label={t('settings.material')}
                        aria-invalid={errors[nameKey] !== undefined || undefined}
                        aria-describedby={described(nameKey)}
                        onChange={(event) => {
                          setRows(
                            rows.map((r) =>
                              r.key === row.key ? { ...r, name: event.target.value } : r,
                            ),
                          );
                        }}
                      />
                      {error(nameKey)}
                    </td>
                    <td>
                      <div className="pp-affix pp-w-160">
                        <input
                          className="pp-input"
                          inputMode="decimal"
                          value={row.price}
                          aria-label={`${t('settings.pricePerKg')}: ${row.name}`}
                          aria-invalid={errors[priceKey] !== undefined || undefined}
                          aria-describedby={described(priceKey)}
                          onChange={(event) => {
                            setRows(
                              rows.map((r) =>
                                r.key === row.key ? { ...r, price: event.target.value } : r,
                              ),
                            );
                          }}
                        />
                        <span className="pp-suffix">€/kg</span>
                      </div>
                      {error(priceKey)}
                    </td>
                    <td className="r">
                      <button
                        type="button"
                        className="pp-btn pp-btn-ghost pp-btn-sm pp-btn-icon"
                        aria-label={t('tags.remove', { tag: row.name })}
                        onClick={() => {
                          setRows(rows.filter((r) => r.key !== row.key));
                        }}
                      >
                        <Trash2 className="pp-ico" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="pp-row">
            <button
              type="button"
              className="pp-btn pp-btn-secondary pp-btn-sm"
              onClick={() => {
                setRows([...rows, { key: nextKey, name: '', price: '' }]);
                setNextKey(nextKey + 1);
              }}
            >
              {t('settings.addMaterial')}
            </button>
          </div>
          <span className="pp-help">{t('settings.materialPricesHelp')}</span>
        </div>
        <div className="pp-row">
          <button type="submit" className="pp-btn pp-btn-primary" disabled={busy} aria-busy={busy}>
            {busy && <span className="pp-spin" aria-hidden="true" />}
            {t('common.save')}
          </button>
        </div>
      </form>
    </section>
  );
}

interface PrinterDraft {
  key: string;
  displayName: string;
  watts: string;
  aliases: string[];
  videoPrefixes: string[];
}

const toDraft = (profile: PrinterProfile): PrinterDraft => ({
  key: profile.key,
  displayName: profile.displayName,
  watts: profile.watts === null ? '' : String(profile.watts),
  aliases: [...profile.aliases],
  videoPrefixes: [...profile.videoPrefixes],
});

/** A stable key for a new profile: the name as a slug, unique among the others. */
function keyFor(name: string, taken: ReadonlySet<string>): string {
  const base =
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 48) || 'printer';
  let key = base;
  for (let n = 2; taken.has(key); n += 1) key = `${base}${String(n)}`;
  return key;
}

/**
 * Printers (ScreenSettings 1.4): one `pp-printer` card per profile with
 * Naam, Vermogen, Aliassen and Timelapse-voorvoegsels as chips; "Printer
 * toevoegen" adds an empty card, Opslaan saves the section, "Printer
 * verwijderen" confirms and saves at once.
 */
export function PrintersSection({ printers }: { printers: PrinterProfile[] }) {
  const id = useId();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<PrinterDraft[]>(() => printers.map(toDraft));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<PrinterDraft | null>(null);

  const validate = (list: readonly PrinterDraft[]): PrinterProfile[] | null => {
    const found: Record<string, string> = {};
    const taken = new Set<string>();
    const result: PrinterProfile[] = [];
    list.forEach((draft, index) => {
      const name = draft.displayName.trim();
      if (name === '') found[`name-${String(index)}`] = t('error.required');
      const watts = draft.watts.trim() === '' ? null : Number(draft.watts.trim());
      if (watts !== null && (!Number.isInteger(watts) || watts < 0 || watts > 10_000)) {
        found[`watts-${String(index)}`] = t('error.invalidWatts');
      }
      const key = draft.key === '' ? keyFor(name, taken) : draft.key;
      taken.add(key.toLowerCase());
      result.push({
        key,
        displayName: name,
        aliases: draft.aliases,
        videoPrefixes: draft.videoPrefixes,
        watts,
      });
    });
    setErrors(found);
    return Object.keys(found).length > 0 ? null : result;
  };

  const persist = async (list: readonly PrinterDraft[]) => {
    const profiles = validate(list);
    if (profiles === null) return;
    setBusy(true);
    try {
      const saved = await saveSettings('printers', profiles);
      setDrafts(saved.printers.map(toDraft));
      await queryClient.invalidateQueries();
    } catch {
      toast.error(t('error.saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const update = (index: number, change: Partial<PrinterDraft>) => {
    setDrafts(drafts.map((draft, i) => (i === index ? { ...draft, ...change } : draft)));
  };

  return (
    /*
      Printers takes both columns (ScreenSettings 2.0): a printer card has a
      two-field row of its own and two chip lists, which wrap badly in a 320px
      column. It is the only section the spec names for this.
    */
    <section className="pp-card pp-sec span-2" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{t('settings.printers')}</h2>
      <span className="pp-help">{t('settings.printersHelp')}</span>
      {drafts.length === 0 && <span className="pp-muted">{t('settings.printersEmpty')}</span>}
      {drafts.map((draft, index) => {
        const nameKey = `name-${String(index)}`;
        const wattsKey = `watts-${String(index)}`;
        const field = `${id}-${String(index)}`;
        return (
          <div key={draft.key === '' ? `new-${String(index)}` : draft.key} className="pp-printer">
            <div className="fields">
              <div className="pp-field">
                <label htmlFor={`${field}-name`}>{t('settings.printerName')}</label>
                <input
                  id={`${field}-name`}
                  className="pp-input"
                  value={draft.displayName}
                  aria-invalid={errors[nameKey] !== undefined || undefined}
                  aria-describedby={errors[nameKey] === undefined ? undefined : `${field}-name-err`}
                  onChange={(event) => {
                    update(index, { displayName: event.target.value });
                  }}
                />
                {errors[nameKey] !== undefined && (
                  <FieldError id={`${field}-name-err`}>{errors[nameKey]}</FieldError>
                )}
              </div>
              <div className="pp-field">
                <label htmlFor={`${field}-watts`}>{t('settings.printerWatts')}</label>
                <div className="pp-affix">
                  <input
                    id={`${field}-watts`}
                    className="pp-input"
                    inputMode="decimal"
                    value={draft.watts}
                    aria-invalid={errors[wattsKey] !== undefined || undefined}
                    aria-describedby={
                      errors[wattsKey] === undefined ? undefined : `${field}-watts-err`
                    }
                    onChange={(event) => {
                      update(index, { watts: event.target.value });
                    }}
                  />
                  <span className="pp-suffix">W</span>
                </div>
                {errors[wattsKey] !== undefined && (
                  <FieldError id={`${field}-watts-err`}>{errors[wattsKey]}</FieldError>
                )}
              </div>
            </div>
            <ChipField
              label={t('settings.printerAliases')}
              help={t('settings.printerAliasesHelp')}
              addLabel={t('settings.addAlias')}
              values={draft.aliases}
              onChange={(aliases) => {
                update(index, { aliases });
              }}
            />
            <ChipField
              label={t('settings.printerPrefixes')}
              help={t('settings.printerPrefixesHelp')}
              addLabel={t('settings.addPrefix')}
              values={draft.videoPrefixes}
              onChange={(videoPrefixes) => {
                update(index, { videoPrefixes });
              }}
            />
            <div className="pp-row pp-end">
              <button
                type="button"
                className="pp-btn pp-btn-ghost pp-btn-sm"
                onClick={() => {
                  if (draft.key === '') setDrafts(drafts.filter((_, i) => i !== index));
                  else setRemoving(draft);
                }}
              >
                <Trash2 className="pp-ico" aria-hidden="true" />
                {t('settings.deletePrinter')}
              </button>
            </div>
          </div>
        );
      })}
      <div className="pp-row">
        <button
          type="button"
          className="pp-btn pp-btn-secondary"
          onClick={() => {
            setDrafts([
              ...drafts,
              { key: '', displayName: '', watts: '', aliases: [], videoPrefixes: [] },
            ]);
          }}
        >
          {t('settings.addPrinter')}
        </button>
        <button
          type="button"
          className="pp-btn pp-btn-primary"
          disabled={busy}
          aria-busy={busy}
          onClick={() => void persist(drafts)}
        >
          {busy && <span className="pp-spin" aria-hidden="true" />}
          {t('common.save')}
        </button>
      </div>
      <ConfirmDialog
        open={removing !== null}
        title={t('confirm.deletePrinter', { name: removing?.displayName ?? '' })}
        body={t('confirm.deletePrinterBody')}
        confirmLabel={t('common.delete')}
        destructive
        onConfirm={async () => {
          await persist(drafts.filter((draft) => draft !== removing));
        }}
        onClose={() => {
          setRemoving(null);
        }}
      />
    </section>
  );
}

/** Removable chips plus a small input; Enter adds the typed value. */
function ChipField({
  label,
  help,
  addLabel,
  values,
  onChange,
}: {
  label: string;
  help: string;
  addLabel: string;
  values: readonly string[];
  onChange: (values: string[]) => void;
}) {
  const id = useId();
  const [text, setText] = useState('');
  const add = () => {
    const value = text.trim();
    if (value !== '' && !values.some((v) => v.toLowerCase() === value.toLowerCase())) {
      onChange([...values, value]);
    }
    setText('');
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      add();
    }
  };
  return (
    <div className="pp-field" role="group" aria-labelledby={`${id}-label`}>
      <span id={`${id}-label`} className="pp-label">
        {label}
      </span>
      <div className="chips">
        {values.map((value) => (
          <span key={value} className="pp-tag">
            {value}
            <button
              type="button"
              aria-label={t('tags.remove', { tag: value })}
              onClick={() => {
                onChange(values.filter((v) => v !== value));
              }}
            >
              <X className="pp-ico" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          className="pp-input pp-w-160"
          aria-label={addLabel}
          aria-describedby={`${id}-help`}
          placeholder={t('settings.addPlaceholder')}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
          }}
          onKeyDown={onKeyDown}
          onBlur={add}
        />
      </div>
      <span id={`${id}-help`} className="pp-help">
        {help}
      </span>
    </div>
  );
}
