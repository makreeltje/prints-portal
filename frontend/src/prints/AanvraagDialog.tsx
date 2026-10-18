import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Search, TriangleAlert, User } from 'lucide-react';
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { Dialog } from '../components/Dialog';
import { isHttpUrl } from '../core/url';
import { t } from '../i18n/nl';
import { addRequest } from './api-queue';
import { fetchCustomers, keys, setPrintNote, setPrintSource } from './api';
import { MAX_NOTE_LENGTH } from './notes';
import type { Customer } from './types';

/** The two queue states, in the order AanvraagDialog lists them. */
const STATES = ['undecided', 'inProgress'] as const;
type QueueState = (typeof STATES)[number];

/**
 * AanvraagDialog (2.14, GAP-157): what "Aanvraag toevoegen" opens.
 *
 * Five fields in the order the component gives them — Naam (which holds
 * focus), Klant, Status, and the optional Bron and Notitie that PrintSource
 * and PrintNote have pointed at this dialog since 2.11. Deliberately absent:
 * **Project** (a folder level the indexer reads, with nothing to compare
 * against before files land), **a price** (a quote, which this system has no
 * concept of) and the two values a fileless record may not hold at birth,
 * "Niet doorgegaan" and "Geen status" — either would leave the new record in
 * no list on any screen.
 *
 * The klant is a combobox rather than a Select, and that is the field's whole
 * point: requests are taken at other people's houses, so a klant who is not a
 * folder yet is the normal case. The portal never writes `/prints` (rule 7),
 * so the record keeps the typed name until "Bestanden koppelen" points it at
 * a folder that exists by then.
 */
export function AanvraagDialog({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const id = useId();
  const [name, setName] = useState('');
  const [customer, setCustomer] = useState('');
  const [state, setState] = useState<QueueState>('undecided');
  const [source, setSource] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ name: boolean; customer: boolean; source: boolean }>({
    name: false,
    customer: false,
    source: false,
  });
  const customers = useQuery({
    queryKey: keys.customers(false, false),
    queryFn: () => fetchCustomers(false, false),
  });

  const save = useMutation({
    mutationFn: async () => {
      const made = await addRequest(customer.trim(), name.trim(), state);
      /*
        Two more calls rather than three fields on one route: bron and notitie
        are fields of a print, and a request is a print (PrintSource,
        PrintNote). The dialog's failed state keeps everything typed, so a
        half-written request can be finished by pressing Toevoegen again.
      */
      const link = source.trim();
      if (link !== '') await setPrintSource(made.id, link);
      if (note.trim() !== '') await setPrintNote(made.id, note);
    },
    onSuccess: onDone,
  });

  const submit = () => {
    const next = {
      name: name.trim() === '',
      customer: customer.trim() === '',
      source: source.trim() !== '' && !isHttpUrl(source.trim()),
    };
    setErrors(next);
    if (next.name || next.customer || next.source) return;
    save.mutate();
  };

  return (
    <Dialog
      open
      title={t('queue.add')}
      onClose={onClose}
      closeLabel={t('common.close')}
      busy={save.isPending}
      onSubmit={submit}
      footer={
        <>
          <button
            type="button"
            className="pp-btn pp-btn-secondary"
            disabled={save.isPending}
            onClick={onClose}
          >
            {t('common.cancel')}
          </button>
          <button type="submit" className="pp-btn pp-btn-primary" disabled={save.isPending}>
            {save.isPending && <span className="pp-spin" aria-hidden="true" />}
            {t('queue.add.submit')}
          </button>
        </>
      }
    >
      {/*
        Failed: an alert at the top of the body and every field untouched, so
        nothing that was typed on a phone in somebody else's kitchen is lost.
      */}
      {save.isError && (
        <div className="pp-alert unpaid" role="alert">
          <TriangleAlert className="pp-ico" aria-hidden="true" />
          <div>{t('queue.add.error')}</div>
        </div>
      )}

      <div className="pp-field">
        <label className="pp-label" htmlFor={`${id}-name`}>
          {t('queue.add.name')}
        </label>
        <input
          id={`${id}-name`}
          className="pp-input"
          data-autofocus
          value={name}
          placeholder={t('queue.add.namePlaceholder')}
          aria-invalid={errors.name ? 'true' : undefined}
          aria-describedby={errors.name ? `${id}-name-err` : undefined}
          onChange={(event) => {
            setName(event.target.value);
            setErrors((current) => ({ ...current, name: false }));
          }}
        />
        {errors.name && (
          <span className="pp-err" id={`${id}-name-err`} role="alert">
            <TriangleAlert className="pp-ico" aria-hidden="true" />
            {t('queue.add.nameError')}
          </span>
        )}
      </div>

      <CustomerField
        id={`${id}-customer`}
        value={customer}
        customers={customers.data?.customers ?? []}
        invalid={errors.customer}
        onChange={(next) => {
          setCustomer(next);
          setErrors((current) => ({ ...current, customer: false }));
        }}
      />

      <div className="pp-field" role="group" aria-labelledby={`${id}-state`}>
        <span className="pp-flabel" id={`${id}-state`}>
          {t('queue.add.status')}
        </span>
        <div className="pp-col pp-gap-1">
          {STATES.map((option) => (
            <label className="pp-opt" key={option}>
              <input
                type="radio"
                className="pp-radio"
                name={`${id}-state-radio`}
                checked={state === option}
                onChange={() => {
                  setState(option);
                }}
              />
              {t(`request.${option}`)}
            </label>
          ))}
        </div>
      </div>

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
          aria-invalid={errors.source ? 'true' : undefined}
          aria-describedby={errors.source ? `${id}-src-err` : undefined}
          onChange={(event) => {
            setSource(event.target.value);
            setErrors((current) => ({ ...current, source: false }));
          }}
        />
        {errors.source && (
          <span className="pp-err" id={`${id}-src-err`} role="alert">
            <TriangleAlert className="pp-ico" aria-hidden="true" />
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
    </Dialog>
  );
}

/**
 * The klant: a combobox over the klanten the library knows, with the typed
 * name as the **last** option (AanvraagDialog, SpoolPicker's pattern). The
 * meta line is `customers.printCount` with its zero arm, which is how "Joey"
 * is told from "Joey Bouwhuis".
 */
function CustomerField({
  id,
  value,
  customers,
  invalid,
  onChange,
}: {
  id: string;
  value: string;
  customers: readonly Customer[];
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const needle = value.trim().toLocaleLowerCase('nl-NL');
  const matches = customers.filter(
    (one) => needle === '' || one.folder.toLocaleLowerCase('nl-NL').includes(needle),
  );
  const exact = customers.some(
    (one) => one.folder.toLocaleLowerCase('nl-NL') === needle && needle !== '',
  );
  /** The typed name last, and only while it is not already a folder. */
  const options: (Customer | null)[] = [...matches, ...(needle === '' || exact ? [] : [null])];
  const activeIndex = Math.min(active, Math.max(0, options.length - 1));
  const optionId = (index: number) => `${id}-option-${String(index)}`;

  const pick = (option: Customer | null) => {
    onChange(option === null ? value.trim() : option.folder);
    setOpen(false);
    input.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (options.length === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((activeIndex + step + options.length) % options.length);
    } else if (event.key === 'Enter' && open) {
      // Enter inside an open list picks; the form's submit waits for a closed one.
      event.preventDefault();
      const option = options[activeIndex];
      if (option !== undefined) pick(option);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div className="pp-field">
      <label className="pp-label" htmlFor={id}>
        {t('queue.add.customer')}
      </label>
      <span className="pp-anchor">
        <span className="pp-iwrap">
          <Search className="pp-ico" aria-hidden="true" />
          <input
            ref={input}
            id={id}
            className="pp-input"
            role="combobox"
            aria-expanded={open}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-activedescendant={open ? optionId(activeIndex) : undefined}
            aria-invalid={invalid ? 'true' : undefined}
            aria-describedby={invalid ? `${id}-err ${id}-help` : `${id}-help`}
            placeholder={t('queue.add.customerPlaceholder')}
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => {
              setOpen(true);
            }}
            onBlur={() => {
              setOpen(false);
            }}
            onKeyDown={onKeyDown}
          />
        </span>
        {open && options.length > 0 && (
          <div className="pp-pop pp-picker">
            <ul id={`${id}-list`} role="listbox" aria-label={t('queue.add.customer')}>
              {options.map((option, index) => (
                <li
                  key={option?.folder ?? 'new'}
                  id={optionId(index)}
                  role="option"
                  aria-selected={option !== null && option.folder === value}
                  className={index === activeIndex ? 'active' : undefined}
                  onMouseEnter={() => {
                    setActive(index);
                  }}
                  // Before blur, which would close the list first.
                  onMouseDown={(event) => {
                    event.preventDefault();
                    pick(option);
                  }}
                >
                  {option === null ? (
                    <Plus className="pp-ico" aria-hidden="true" />
                  ) : (
                    <User className="pp-ico" aria-hidden="true" />
                  )}
                  <span>
                    <b>
                      {option === null
                        ? t('queue.add.customerNew', { klant: value.trim() })
                        : option.folder}
                    </b>
                    <small>
                      {option === null
                        ? t('queue.add.customerHelp')
                        : t('customers.printCount', { count: option.printCount })}
                    </small>
                  </span>
                  <span />
                </li>
              ))}
            </ul>
          </div>
        )}
      </span>
      {invalid && (
        <span className="pp-err" id={`${id}-err`} role="alert">
          <TriangleAlert className="pp-ico" aria-hidden="true" />
          {t('queue.add.customerError')}
        </span>
      )}
      <span className="pp-help" id={`${id}-help`}>
        {t('queue.add.customerHelp')}
      </span>
    </div>
  );
}
