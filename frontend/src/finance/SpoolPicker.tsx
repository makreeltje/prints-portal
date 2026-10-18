import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, RotateCw, Search, TriangleAlert } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { useAnchoredPanel } from '../components/anchoredPanel';
import { Portal } from '../components/Portal';
import { formatMoney } from '../i18n/format';
import { t } from '../i18n/nl';
import type { Spool } from '../prints/types';
import { fetchSpools, financeKeys, refreshSpoolman } from './api';
import { splitSpoolName } from './spoolLabel';
import { SpoolSwatch } from './money';

/** The trigger's name in `.pp-fname`'s two halves, in the button's own face. */
function SpoolName({ name }: { name: string }) {
  const { head, tail } = splitSpoolName(name);
  return (
    <span className="nm pp-fname sans">
      <span className="a">{head}</span>
      <span className="b">{tail}</span>
    </span>
  );
}

/**
 * "294 g over", "leeg" at zero, or nothing when Spoolman does not say
 * (SpoolPicker 2.13, GAP-161). The weight is what tells two otherwise
 * identical spools apart, and it is what you choose on.
 */
function remainingLabel(spool: Spool): string | null {
  const grams = spool.remainingWeight;
  if (grams === null || grams === undefined) return null;
  return t('spool.remaining', { grams: Math.round(grams) });
}

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
  inherited = null,
}: {
  value: Spool | null;
  onChange: (spoolId: number | null) => Promise<void>;
  disabled?: boolean;
  /** Accessible name of the trigger when it says only the spool name. */
  label?: string;
  /** Id of a help text, e.g. why the picker is disabled. */
  describedBy?: string;
  /**
   * The spool in force when this control has none of its own — the whole-print
   * spool that is costing the slot. A control that can override a value must
   * state the value it is overriding (2.3, GAP-115): measured here, the total
   * moved from EUR 7,05 to EUR 5,13 and back while the trigger said "Kies een
   * spoel" throughout.
   */
  inherited?: Spool | null;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
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
  // What the trigger states: its own value, or the one in force.
  const shown = value ?? inherited;
  // Where the panel goes, how tall it may be, and when it has to give up
  // (design system 2.3). `.pp-lift` rather than `.pp-anchor`: the panel is
  // window-placed, so an offset parent is exactly what it must not have.
  useAnchoredPanel(panelRef, trigger, open, close);
  return (
    /*
      Bare `pp-lift` again since 2.15 (GAP-168): `.pp-lift` now carries
      `min-width: 0` itself, which is where the floor belonged. GAP-163's rules
      name `.pp-asset .acts .pp-spoolbtn`, but the flex item in that band is
      this wrapper (required since 2.13 for a window-placed panel), and a flex
      item at its content width cannot let its child shrink — so the fix landed
      nowhere and the trigger stayed 28px outside the card. Our `pp-minw-0`
      here was the right fix with the wrong owner: every window-placed panel in
      the system has a `.pp-lift` wrapper by rule 9, so they all had the floor.
    */
    <span className="pp-lift">
      <button
        ref={trigger}
        type="button"
        className="pp-btn pp-btn-secondary pp-btn-sm pp-spoolbtn pp-minw-200 pp-start"
        aria-haspopup="listbox"
        aria-expanded={open}
        /*
          The name is split across two spans now (GAP-163), and a split name
          is the one case the design system itself labels explicitly
          (ModelPicker does the same for a file name): name computation joins
          element children without the space that is inside them, so
          "Creality Rainbow Wild Blossom Hyper" would be announced as one
          word. The label is the trigger's own visible words and nothing
          else — the archived chip included, so the qualification stays in
          the name as well as on screen (SpoolPicker 2.13, GAP-161).
        */
        aria-label={
          shown !== null && value === null
            ? t('asset.spoolFromPrint.aria', { naam: shown.name })
            : label === undefined
              ? [
                  shown?.name ?? t('spool.choose'),
                  shown?.archived === true ? t('spool.archived') : null,
                ]
                  .filter((part) => part !== null)
                  .join(' ')
              : `${label}: ${value?.name ?? t('spool.choose')}`
        }
        aria-busy={busy}
        aria-describedby={describedBy}
        disabled={disabled || busy}
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        {busy ? <span className="pp-spin" aria-hidden="true" /> : <SpoolSwatch spool={shown} />}
        {/*
          The name takes the middle cut (SpoolPicker 2.14, GAP-163): at 360px
          the trigger's 200px floor is lifted inside a file row's band, so the
          name shrinks instead of being painted outside the card and clipped
          there. The app splits the string and CSS does the cutting; `.b` is
          the last word, because that is where a spool's colour lives.
        */}
        <SpoolName name={shown?.name ?? t('spool.choose')} />
        {/*
          The chip sits on the trigger, not in the cell beside it: a hint chip
          qualifies the value it sits on, so it belongs on the control that can
          override that value (2.3, and the bounds written down in 2.13).
        */}
        {shown !== null && value === null && (
          <span className="pp-hintchip">{t('asset.spoolFromPrint')}</span>
        )}
        {/*
          A qualification travels with the value into the trigger, or the row
          is lying by omission (SpoolPicker 2.13, GAP-161): an archived spool
          that is the one in force says so here too, not only in the list.
        */}
        {shown?.archived === true && (
          <span className="pp-hintchip" title={t('spool.archived.title')}>
            {t('spool.archived')}
          </span>
        )}
        <span className="end">
          <ChevronDown className="pp-ico" aria-hidden="true" />
        </span>
      </button>
      {open && (
        /*
          The panel leaves `.pp-lift` entirely: a window-placed panel is a
          child of the nearest open `<dialog>`, else of `<body>` (README
          *Floating panels* rule 9, 2.13; GAP-146 resolved). `.pp-lift`
          is `z-index: 1`, so the panel's own z-index 30 is compared only
          inside that wrapper — and every later row's trigger, at the same
          level, wins on DOM order and paints over the open list. Measured on
          a print with four files: two triggers covered 200x32 of the panel
          each. `position: fixed` does not help; a fixed box escapes clipping,
          not its ancestors' stacking contexts. Same fault, and the same
          placeholder, as the klant tile's menu.
        */
        <Portal from={trigger}>
          <SpoolPopover
            panelRef={panelRef}
            selected={value?.id ?? null}
            trigger={trigger}
            onPick={(id) => void pick(id)}
            onClose={close}
          />
        </Portal>
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
  panelRef,
}: {
  selected: number | null;
  trigger?: RefObject<HTMLButtonElement | null>;
  onPick: (spoolId: number | null) => void;
  onClose?: () => void;
  inline?: boolean;
  /** The parent measures this panel to place it (design system 2.2). */
  panelRef?: RefObject<HTMLDivElement | null>;
}) {
  const id = useId();
  const queryClient = useQueryClient();
  const spools = useQuery({ queryKey: financeKeys.spools, queryFn: fetchSpools, retry: false });
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const ownPanel = useRef<HTMLDivElement>(null);
  const panel = panelRef ?? ownPanel;
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
  }, [trigger, inline, panel]);

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
      // So "archief" finds them: the word is on screen, it should be typeable.
      spool.archived === true ? t('spool.archived') : '',
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
    <div ref={panel} className={inline ? 'pp-pop pp-picker pp-fill' : 'pp-pop pp-picker at'}>
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
              {/*
                The option's meta line is three parts, "{materiaal} ·
                {leverancier} · {rest}" (SpoolPicker 2.13, GAP-161). Two
                physical spools of the same filament are one name and one
                colour in Spoolman, so the grams are the only thing that tells
                them apart — and they are what you choose on anyway: a small
                print goes on the spool that is nearly empty. "archief" is a
                hint chip: a qualification of the value, with nothing to do
                about it, and never the only carrier — the word is real text,
                the archived spools sort last, and typing it finds them.
              */}
              {spool !== null && (
                <small>
                  {/*
                    A row inside the line, because `.pp-picker li small` is
                    `display: block` and a chip glued to the text has no gap.
                  */}
                  <span className="pp-row pp-gap-1">
                    {[spool.material, spool.vendor, remainingLabel(spool)]
                      .filter((part) => part !== null && part !== '')
                      .join(' · ')}
                    {spool.archived === true && (
                      <span className="pp-hintchip" title={t('spool.archived.title')}>
                        {t('spool.archived')}
                      </span>
                    )}
                  </span>
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
