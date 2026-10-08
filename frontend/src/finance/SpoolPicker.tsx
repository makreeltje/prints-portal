import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFlipAbove } from '../components/useFlipAbove';
import { ChevronDown, RotateCw, Search, TriangleAlert } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { formatMoney } from '../i18n/format';
import { t } from '../i18n/nl';
import type { Spool } from '../prints/types';
import { fetchSpools, financeKeys, refreshSpoolman } from './api';
import { SpoolSwatch } from './money';

/**
 * SpoolPicker: a trigger (swatch, name, chevron) and a popover with a search
 * field and a listbox of Spoolman spools, "Geen spoel" last. Combobox
 * keyboard: arrows move, Enter picks, Esc closes and returns focus. The
 * popover floats under the trigger in `.pp-anchor` (Popover, z-popover).
 */
export function SpoolPicker({
  value,
  onChange,
  disabled = false,
  label,
  describedBy,
}: {
  value: Spool | null;
  onChange: (spoolId: number | null) => Promise<void>;
  disabled?: boolean;
  /** Accessible name of the trigger when it says only the spool name. */
  label?: string;
  /** Id of a help text, e.g. why the picker is disabled. */
  describedBy?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  const pick = async (spoolId: number | null) => {
    setOpen(false);
    setBusy(true);
    try {
      await onChange(spoolId);
    } finally {
      setBusy(false);
      trigger.current?.focus();
    }
  };
  return (
    <span className="pp-anchor">
      <button
        ref={trigger}
        type="button"
        className="pp-btn pp-btn-secondary pp-btn-sm pp-spoolbtn pp-minw-200 pp-start"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={
          label === undefined ? undefined : `${label}: ${value?.name ?? t('spool.choose')}`
        }
        aria-busy={busy}
        aria-describedby={describedBy}
        disabled={disabled || busy}
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        {busy ? <span className="pp-spin" aria-hidden="true" /> : <SpoolSwatch spool={value} />}
        {value?.name ?? t('spool.choose')}
        <span className="end">
          <ChevronDown className="pp-ico" aria-hidden="true" />
        </span>
      </button>
      {open && (
        <SpoolPopover
          selected={value?.id ?? null}
          trigger={trigger}
          onPick={(id) => void pick(id)}
          onClose={close}
        />
      )}
    </span>
  );
}

/**
 * The search field and spool listbox. As a popover it closes on an outside
 * click and Esc; `inline` (BulkDialogs) keeps it in place inside a dialog,
 * where Esc belongs to the dialog.
 */
export function SpoolPopover({
  selected,
  trigger,
  onPick,
  onClose,
  inline = false,
}: {
  selected: number | null;
  trigger?: RefObject<HTMLButtonElement | null>;
  onPick: (spoolId: number | null) => void;
  onClose?: () => void;
  inline?: boolean;
}) {
  const id = useId();
  const queryClient = useQueryClient();
  const spools = useQuery({ queryKey: financeKeys.spools, queryFn: fetchSpools, retry: false });
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const above = useFlipAbove(panel, !inline);
  const input = useRef<HTMLInputElement>(null);
  const latestClose = useRef(onClose);
  useEffect(() => {
    latestClose.current = onClose;
  });

  useEffect(() => {
    if (inline) return;
    input.current?.focus();
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panel.current?.contains(target) || trigger?.current?.contains(target)) return;
      setTimeout(() => {
        latestClose.current?.();
      });
    };
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [trigger, inline]);

  const needle = query.trim().toLocaleLowerCase('nl-NL');
  const matches = (spools.data?.spools ?? []).filter((spool) => {
    if (needle === '') return true;
    const haystack = [
      spool.name,
      spool.material ?? '',
      spool.vendor ?? '',
      spool.colour ?? '',
      ...spool.colours,
      spool.pricePerKg === null ? '' : formatMoney(spool.pricePerKg),
    ]
      .join(' ')
      .toLocaleLowerCase('nl-NL');
    return haystack.includes(needle);
  });
  // The options: the matching spools, then "Geen spoel".
  const options: (Spool | null)[] = [...matches, null];
  const activeIndex = Math.min(active, options.length - 1);
  const optionId = (index: number) => `${id}-option-${String(index)}`;

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((activeIndex + step + options.length) % options.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const option = options[activeIndex];
      onPick(option === undefined || option === null ? null : option.id);
    } else if (event.key === 'Escape' && !inline) {
      event.preventDefault();
      event.stopPropagation();
      onClose?.();
    }
  };

  const unreachable = spools.isError;
  return (
    <div
      ref={panel}
      className={
        inline
          ? 'pp-pop pp-picker pp-fill'
          : // ds-gap: GAP-112
            `pp-pop pp-picker app-pop-fit${above ? ' app-pop-above' : ''}`
      }
    >
      <div className="pp-iwrap" role="search">
        <Search className="pp-ico" aria-hidden="true" />
        <input
          ref={input}
          className="pp-input"
          data-autofocus={inline ? true : undefined}
          role="combobox"
          aria-expanded="true"
          aria-controls={`${id}-list`}
          aria-activedescendant={optionId(activeIndex)}
          aria-autocomplete="list"
          aria-label={t('spool.searchLabel')}
          placeholder={t('spool.search')}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      {unreachable && (
        <div className="pp-alert warning" role="status">
          <TriangleAlert className="pp-ico" aria-hidden="true" />
          <div>
            <strong>{t('settings.spoolman')}</strong> {t('spool.unreachable')}
            <div>
              <button
                type="button"
                className="pp-btn pp-btn-ghost pp-btn-sm"
                onClick={() => {
                  void refreshSpoolman().then(() =>
                    queryClient.invalidateQueries({ queryKey: financeKeys.spools }),
                  );
                }}
              >
                <RotateCw className="pp-ico" aria-hidden="true" />
                {t('common.retry')}
              </button>
            </div>
          </div>
        </div>
      )}
      {spools.isPending && <span className="pp-spin" aria-hidden="true" />}
      <ul id={`${id}-list`} role="listbox" aria-label={t('spool.choose')}>
        {spools.isSuccess && matches.length === 0 && (
          <li role="presentation" className="pp-muted">
            {t('spool.empty')}
          </li>
        )}
        {options.map((spool, index) => (
          <li
            key={spool?.id ?? 'none'}
            id={optionId(index)}
            role="option"
            aria-selected={(spool?.id ?? null) === selected}
            className={index === activeIndex ? 'active' : undefined}
            onMouseEnter={() => {
              setActive(index);
            }}
            onClick={() => {
              onPick(spool?.id ?? null);
            }}
          >
            <SpoolSwatch spool={spool} large />
            <span>
              <b>{spool?.name ?? t('spool.none')}</b>
              {spool !== null && (
                <small>
                  {[spool.material, spool.vendor].filter((v) => v !== null).join(' · ')}
                </small>
              )}
            </span>
            <span className="pp-money">
              {spool?.pricePerKg === null || spool === null ? '' : formatMoney(spool.pricePerKg)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
