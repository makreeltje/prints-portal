import { ChevronDown, LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Dialog } from '../components/Dialog';
import { t } from '../i18n/nl';
import { TagChip } from './bits';
import { isFiltered, type ViewMode } from './filter';
import type { Customer, PrintFilter, TagWithCount } from './types';

interface FilterBarProps {
  filter: PrintFilter;
  onChange: (filter: PrintFilter) => void;
  customers: readonly Customer[];
  tags: readonly TagWithCount[];
  view: ViewMode;
  onView: (view: ViewMode) => void;
  showDeletedOption: boolean;
  /** Prints shown and in total, for "12 van 61 prints". */
  shown: number;
  total: number | null;
}

const CLEARED: Pick<PrintFilter, 'customer' | 'tagIds' | 'search'> = {
  customer: null,
  tagIds: [],
  search: '',
};

/**
 * FilterBar: klant, tags (AND), search, Kaarten/Lijst, Gearchiveerd tonen,
 * Toon verwijderde (Admins) and Filters wissen. At 480px and below the
 * controls other than search and view move into a "Filters" sheet.
 */
export function FilterBar(props: FilterBarProps) {
  const { filter, onChange, tags } = props;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const activeTags = tags.filter((tag) => filter.tagIds.includes(tag.id));

  const removeTag = (tag: TagWithCount) => {
    onChange({ ...filter, tagIds: filter.tagIds.filter((id) => id !== tag.id) });
    setAnnouncement(t('tags.removedFromFilter', { tag: tag.name }));
  };

  return (
    <div className="pp-col app-filter-block">
      <div className="pp-only-wide">
        <div className="pp-filters" role="search">
          <CustomerSelect {...props} />
          <TagPicker {...props} />
          <SearchField filter={filter} onChange={onChange} />
          <ViewToggle view={props.view} onView={props.onView} />
          <RecordToggles {...props} />
          {isFiltered(filter) && (
            <ClearButton
              onClick={() => {
                onChange({ ...filter, ...CLEARED, archived: false, deleted: false });
              }}
            />
          )}
        </div>
      </div>
      <div className="pp-only-phone">
        <div className="pp-col app-filter-phone" role="search">
          <SearchField filter={filter} onChange={onChange} />
          <div className="pp-row app-filter-phone-row">
            <button
              type="button"
              className="pp-btn pp-btn-secondary"
              aria-haspopup="dialog"
              onClick={() => {
                setSheetOpen(true);
              }}
            >
              <SlidersHorizontal className="pp-ico" aria-hidden="true" />
              {t('filters.button')}
            </button>
            <ViewToggle view={props.view} onView={props.onView} iconsOnly />
          </div>
        </div>
      </div>

      {(activeTags.length > 0 || props.total !== null) && (
        <div className="pp-row app-filter-summary">
          {activeTags.map((tag) => (
            <TagChip
              key={tag.id}
              tag={tag}
              onRemove={() => {
                removeTag(tag);
              }}
            />
          ))}
          {activeTags.length > 0 && <span className="pp-chip-and">{t('tags.andHint')}</span>}
          {props.total !== null && (
            <span className="pp-muted app-filter-count" aria-live="polite">
              {t('common.count', { shown: props.shown, total: props.total })}
            </span>
          )}
        </div>
      )}
      <span className="pp-sr" role="status">
        {announcement}
      </span>

      <Dialog
        open={sheetOpen}
        title={t('filters.button')}
        onClose={() => {
          setSheetOpen(false);
        }}
        closeLabel={t('common.close')}
        footer={
          isFiltered(filter) ? (
            <ClearButton
              onClick={() => {
                onChange({ ...filter, ...CLEARED, archived: false, deleted: false });
              }}
            />
          ) : (
            <span />
          )
        }
      >
        <CustomerSelect {...props} />
        <fieldset className="pp-col app-fieldset">
          <legend className="pp-label">{t('tags.label')}</legend>
          <TagCheckboxes {...props} />
        </fieldset>
        <RecordToggles {...props} />
      </Dialog>
    </div>
  );
}

function CustomerSelect({ filter, onChange, customers }: FilterBarProps) {
  return (
    <div className="pp-iwrap">
      <select
        className="pp-input pp-select"
        aria-label={t('filters.customer')}
        value={filter.customer ?? ''}
        onChange={(event) => {
          onChange({ ...filter, customer: event.target.value === '' ? null : event.target.value });
        }}
      >
        <option value="">{t('filters.allCustomers')}</option>
        {customers.map((customer) => (
          <option key={customer.folder} value={customer.folder}>
            {customer.folder}
          </option>
        ))}
      </select>
      <ChevronDown className="pp-ico r" aria-hidden="true" />
    </div>
  );
}

function TagCheckboxes({ filter, onChange, tags }: FilterBarProps) {
  return (
    <>
      {tags.map((tag) => (
        <label key={tag.id} className="pp-opt">
          <input
            type="checkbox"
            className="pp-check"
            checked={filter.tagIds.includes(tag.id)}
            onChange={(event) => {
              onChange({
                ...filter,
                tagIds: event.target.checked
                  ? [...filter.tagIds, tag.id]
                  : filter.tagIds.filter((id) => id !== tag.id),
              });
            }}
          />
          <TagChip tag={tag} />
        </label>
      ))}
    </>
  );
}

/** "Tags" button with a popover of checkboxes (Popover spec: Esc and outside click close). */
function TagPicker(props: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const count = props.filter.tagIds.length;

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>('input')?.focus();
    const onPointer = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  let menu: ReactNode = null;
  if (open) {
    menu = (
      <div
        ref={panel}
        className="pp-pop pp-col app-tag-pop"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            setOpen(false);
            trigger.current?.focus();
          }
        }}
      >
        <TagCheckboxes {...props} />
      </div>
    );
  }

  return (
    <div ref={wrapper} className="app-bulk">
      <button
        ref={trigger}
        type="button"
        className="pp-btn pp-btn-secondary"
        aria-haspopup="true"
        aria-expanded={open}
        disabled={props.tags.length === 0}
        onClick={() => {
          setOpen((value) => !value);
        }}
      >
        {count > 0 ? t('tags.labelCount', { count }) : t('tags.label')}
        <ChevronDown className="pp-ico" aria-hidden="true" />
      </button>
      {menu}
    </div>
  );
}

/**
 * SearchField: magnifier, input, clear button when filled, "/" hint when
 * empty; "/" focuses it unless another field has focus. Typing is debounced.
 */
function SearchField({
  filter,
  onChange,
}: {
  filter: PrintFilter;
  onChange: (filter: PrintFilter) => void;
}) {
  const [text, setText] = useState(filter.search);
  // The filter can change from elsewhere (Filters wissen): follow it.
  const [shownSearch, setShownSearch] = useState(filter.search);
  if (shownSearch !== filter.search) {
    setShownSearch(filter.search);
    setText(filter.search);
  }
  const input = useRef<HTMLInputElement>(null);
  const latest = useRef({ filter, onChange });
  useEffect(() => {
    latest.current = { filter, onChange };
  });

  useEffect(() => {
    if (text === latest.current.filter.search) return;
    const timer = window.setTimeout(() => {
      latest.current.onChange({ ...latest.current.filter, search: text });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [text]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      event.preventDefault();
      input.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="pp-iwrap grow">
      <Search className="pp-ico" aria-hidden="true" />
      <input
        ref={input}
        className="pp-input has-r"
        type="search"
        aria-label={t('common.search.label')}
        placeholder={t('common.search.placeholder')}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
        }}
      />
      {text === '' ? (
        <span className="pp-kbd" aria-hidden="true">
          /
        </span>
      ) : (
        <button
          type="button"
          className="pp-btn pp-btn-ghost pp-btn-icon pp-btn-sm app-search-clear"
          aria-label={t('common.search.clear')}
          onClick={() => {
            setText('');
            input.current?.focus();
          }}
        >
          <X className="pp-ico" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/** Search waits this long after the last keystroke. */
const SEARCH_DEBOUNCE_MS = 250;

function ViewToggle({
  view,
  onView,
  iconsOnly = false,
}: {
  view: ViewMode;
  onView: (view: ViewMode) => void;
  iconsOnly?: boolean;
}) {
  const option = (mode: ViewMode, Icon: typeof LayoutGrid, label: string) => (
    <button
      type="button"
      aria-pressed={view === mode}
      aria-label={iconsOnly ? label : undefined}
      onClick={() => {
        onView(mode);
      }}
    >
      <Icon className="pp-ico" aria-hidden="true" />
      {!iconsOnly && label}
    </button>
  );
  return (
    <div className="pp-seg" role="group" aria-label={t('view.label')}>
      {option('cards', LayoutGrid, t('view.cards'))}
      {option('list', List, t('view.list'))}
    </div>
  );
}

function RecordToggles({ filter, onChange, showDeletedOption }: FilterBarProps) {
  return (
    <>
      <label className="pp-opt">
        <input
          type="checkbox"
          className="pp-check"
          checked={filter.archived}
          onChange={(event) => {
            onChange({ ...filter, archived: event.target.checked });
          }}
        />
        {t('records.showArchived')}
      </label>
      {showDeletedOption && (
        <label className="pp-opt">
          <input
            type="checkbox"
            className="pp-check"
            checked={filter.deleted}
            onChange={(event) => {
              onChange({ ...filter, deleted: event.target.checked });
            }}
          />
          {t('records.showDeleted')}
        </label>
      )}
    </>
  );
}

function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="pp-btn pp-btn-ghost" onClick={onClick}>
      <X className="pp-ico" aria-hidden="true" />
      {t('common.clearFilters')}
    </button>
  );
}
