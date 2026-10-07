import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { formatDate } from '../i18n/format';
import { t } from '../i18n/nl';
import { FieldError } from './FieldError';

const MONTH_NAMES = [
  'januari',
  'februari',
  'maart',
  'april',
  'mei',
  'juni',
  'juli',
  'augustus',
  'september',
  'oktober',
  'november',
  'december',
];
const WEEKDAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

/** Calendar dates as `YYYY-MM-DD`, computed in UTC so no time zone shifts a day. */
const iso = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
const partsOf = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return { year: y ?? 1970, month: (m ?? 1) - 1, day: d ?? 1 };
};
const addDays = (value: string, days: number) => {
  const { year, month, day } = partsOf(value);
  return iso(year, month, day + days);
};
const addMonths = (value: string, months: number) => {
  const { year, month, day } = partsOf(value);
  const last = new Date(Date.UTC(year, month + months + 1, 0)).getUTCDate();
  return iso(year, month + months, Math.min(day, last));
};
const show = (value: string) => formatDate(`${value}T12:00:00Z`);
const longLabel = (value: string) => {
  const { year, month, day } = partsOf(value);
  return `${String(day)} ${MONTH_NAMES[month] ?? ''} ${String(year)}`;
};

/** `d-m-jjjj` (also with / or .), else `null`. */
function parseTypedDate(text: string): string | null {
  const match = /^\s*(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\s*$/.exec(text);
  if (match === null) return null;
  const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const value = iso(year, month - 1, day);
  return partsOf(value).day === day ? value : null;
}

function todayIso(): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Amsterdam',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value]),
  );
  return iso(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
}

/**
 * DatePicker: a field that shows `5 okt 2026` and accepts `d-m-jjjj`, with
 * a calendar popover (`pp-calpop`, a bottom sheet on phones). A click opens
 * the calendar and keeps focus in the field so typing still works; Alt+Down
 * or Down moves into the grid. The value is a `YYYY-MM-DD` string or null.
 * Days outside `min`…`max` are disabled.
 */
export function DatePicker({
  label,
  value,
  onChange,
  min = null,
  max = null,
  error = null,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  min?: string | null;
  max?: string | null;
  error?: string | null;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(value === null ? '' : show(value));
  const [shownValue, setShownValue] = useState(value);
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(value ?? todayIso());
  /** Set when the keyboard asks for the grid; a click leaves focus in the field for typing. */
  const enterGrid = useRef(false);
  if (shownValue !== value) {
    setShownValue(value);
    setText(value === null ? '' : show(value));
  }
  const today = todayIso();
  const outOfRange = (day: string) => (min !== null && day < min) || (max !== null && day > max);

  useEffect(() => {
    if (!open || grid.current === null) return;
    if (!enterGrid.current && !grid.current.contains(document.activeElement)) return;
    enterGrid.current = false;
    grid.current.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus();
  }, [open, focus]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!anchor.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    input.current?.focus();
  };
  const pick = (day: string | null) => {
    onChange(day);
    close();
  };
  /** Typed `d-m-jjjj` becomes the value; anything unreadable goes back to the last value. */
  const commitTyped = () => {
    if (text.trim() === '') {
      if (value !== null) onChange(null);
      return;
    }
    const parsed = parseTypedDate(text);
    if (parsed === null) {
      setText(value === null ? '' : show(value));
      return;
    }
    onChange(parsed);
  };

  const { year, month } = partsOf(focus);
  const first = iso(year, month, 1);
  const lead = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const onGridKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const weekday = (new Date(`${focus}T00:00:00Z`).getUTCDay() + 6) % 7;
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      PageUp: () => addMonths(focus, -1),
      PageDown: () => addMonths(focus, 1),
      Home: () => addDays(focus, -weekday),
      End: () => addDays(focus, 6 - weekday),
    };
    const move = moves[event.key];
    if (move !== undefined) {
      event.preventDefault();
      // A move into another month remounts the grid, so ask for focus explicitly.
      enterGrid.current = true;
      setFocus(move());
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  };

  const errorText = error;
  const monthLabel = `${MONTH_NAMES[month] ?? ''} ${String(year)}`;

  return (
    <div
      ref={anchor}
      className="pp-anchor pp-grow"
      onBlur={(event) => {
        if (!anchor.current?.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <div className="pp-field">
        <label htmlFor={`${id}-input`}>{label}</label>
        <div className="pp-iwrap">
          <input
            ref={input}
            id={`${id}-input`}
            className="pp-input nl has-r"
            value={text}
            aria-invalid={errorText !== null || undefined}
            aria-describedby={errorText === null ? undefined : `${id}-err`}
            aria-haspopup="dialog"
            aria-expanded={open}
            onChange={(event) => {
              setText(event.target.value);
            }}
            onBlur={commitTyped}
            onClick={() => {
              if (open) return;
              setFocus(value ?? today);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commitTyped();
                setOpen(false);
              } else if (event.key === 'ArrowDown' && (event.altKey || open)) {
                event.preventDefault();
                enterGrid.current = true;
                if (!open) setFocus(value ?? today);
                setOpen(true);
                if (open) {
                  grid.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus();
                }
              } else if (event.key === 'Escape' && open) {
                event.stopPropagation();
                setOpen(false);
              }
            }}
          />
          <CalendarDays className="pp-ico r" aria-hidden="true" />
        </div>
        {errorText !== null && <FieldError id={`${id}-err`}>{errorText}</FieldError>}
      </div>
      {open && (
        <div className="pp-pop pp-calpop" role="dialog" aria-label={t('date.pick')}>
          <div className="pp-cal-hd">
            <button
              type="button"
              className="pp-btn pp-btn-ghost pp-btn-icon"
              aria-label={t('date.prev')}
              onClick={() => {
                setFocus(addMonths(focus, -1));
              }}
            >
              <ChevronLeft className="pp-ico" aria-hidden="true" />
            </button>
            <b aria-live="polite">{monthLabel}</b>
            <button
              type="button"
              className="pp-btn pp-btn-ghost pp-btn-icon"
              aria-label={t('date.next')}
              onClick={() => {
                setFocus(addMonths(focus, 1));
              }}
            >
              <ChevronRight className="pp-ico" aria-hidden="true" />
            </button>
          </div>
          <div
            ref={grid}
            className="pp-cal"
            role="grid"
            aria-label={monthLabel}
            onKeyDown={onGridKey}
          >
            {WEEKDAYS.map((name) => (
              <span key={name} className="h" role="columnheader">
                {name}
              </span>
            ))}
            {Array.from({ length: lead }, (_, index) => (
              <span key={`blank-${String(index)}`} />
            ))}
            {Array.from({ length: days }, (_, index) => {
              const day = iso(year, month, index + 1);
              const classes = ['d', day === value ? 's' : '', day === today ? 't' : '']
                .filter((name) => name !== '')
                .join(' ');
              return (
                <button
                  key={day}
                  type="button"
                  className={classes}
                  role="gridcell"
                  aria-label={longLabel(day)}
                  aria-selected={day === value || undefined}
                  aria-current={day === today ? 'date' : undefined}
                  disabled={outOfRange(day)}
                  tabIndex={day === focus ? 0 : -1}
                  onClick={() => {
                    pick(day);
                  }}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          <div className="pp-cal-ft">
            <button
              type="button"
              className="pp-btn pp-btn-ghost pp-btn-sm"
              disabled={outOfRange(today)}
              onClick={() => {
                pick(today);
              }}
            >
              {t('date.today')}
            </button>
            <button
              type="button"
              className="pp-btn pp-btn-ghost pp-btn-sm"
              onClick={() => {
                pick(null);
              }}
            >
              {t('date.clear')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
