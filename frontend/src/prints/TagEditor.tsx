import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, TriangleAlert } from 'lucide-react';
import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import { useToast } from '../components/toast-context';
import { t } from '../i18n/nl';
import { createTag, fetchTags, keys, setPrintTags } from './api';
import { TagChip } from './bits';
import { normalizeTagName, tagKey, tagNameTooLong } from './tag-palette';
import type { Tag } from './types';

/**
 * "Tag toevoegen" chip plus the TagEditor popover (bottom sheet on phones,
 * from the design system's own media rule): search, one checkbox row per tag,
 * and "Tag 'x' maken" when the name is new. A name that already exists in
 * another case shows only that tag. Each change saves at once.
 */
export function TagEditor({ printId, current }: { printId: string; current: readonly Tag[] }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  return (
    <span className="pp-anchor">
      <button
        ref={trigger}
        type="button"
        className="pp-tag add"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => !value);
        }}
      >
        <Plus className="pp-ico" aria-hidden="true" />
        {t('tags.add')}
      </button>
      {open && (
        // Floats under the trigger (Popover, z-popover); a bottom sheet on phones.
        <TagPopover
          stateOf={(tagId) => (current.some((tag) => tag.id === tagId) ? 'on' : 'off')}
          apply={async ({ add, remove }) => {
            const next = new Set(current.map((tag) => tag.id));
            for (const tagId of add) next.add(tagId);
            for (const tagId of remove) next.delete(tagId);
            await setPrintTags(printId, [...next]);
          }}
          trigger={trigger}
          onClose={close}
        />
      )}
    </span>
  );
}

export type TagState = 'on' | 'off' | 'mixed';

/**
 * The TagEditor popover. `stateOf` says whether the print (or, in bulk,
 * every selected print) carries a tag: on, off or mixed (tri-state).
 */
export function TagPopover({
  stateOf,
  apply,
  trigger,
  onClose,
}: {
  stateOf: (tagId: string) => TagState;
  apply: (change: { add: string[]; remove: string[] }) => Promise<void>;
  trigger: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const id = useId();
  const toast = useToast();
  const queryClient = useQueryClient();
  const tags = useQuery({ queryKey: keys.tags, queryFn: fetchTags });
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const latestClose = useRef(onClose);
  useEffect(() => {
    latestClose.current = onClose;
  });

  useEffect(() => {
    panel.current?.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panel.current?.contains(target) || trigger.current?.contains(target)) return;
      latestClose.current();
    };
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [trigger]);

  const all = tags.data?.tags ?? [];
  const name = normalizeTagName(query);
  const key = name === '' ? '' : tagKey(name);
  const tooLong = tagNameTooLong(query);
  const shown = all.filter((tag) => key === '' || tagKey(tag.name).includes(key));
  const exists = all.some((tag) => tagKey(tag.name) === key);
  const canCreate = key !== '' && !exists && !tooLong && tags.isSuccess;

  const save = async (change: () => Promise<{ add: string[]; remove: string[] }>) => {
    setSaving(true);
    try {
      await apply(await change());
    } catch {
      toast.error(t('error.saveFailed'));
    } finally {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: keys.all }),
        queryClient.invalidateQueries({ queryKey: keys.tags }),
      ]);
      setSaving(false);
    }
  };
  // A mixed tag becomes "on" for every print when ticked.
  const toggle = (tag: Tag, checked: boolean) =>
    save(() =>
      Promise.resolve(checked ? { add: [tag.id], remove: [] } : { add: [], remove: [tag.id] }),
    );
  const create = () =>
    save(async () => {
      const tag = await createTag(name);
      setQuery('');
      return { add: [tag.id], remove: [] };
    });

  return (
    <div
      ref={panel}
      className="pp-pop pp-tagpop"
      role="dialog"
      aria-label={t('tags.edit')}
      aria-busy={saving}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="pp-iwrap">
        <Search className="pp-ico" aria-hidden="true" />
        <input
          className="pp-input"
          type="search"
          aria-label={t('tags.searchOrCreate')}
          placeholder={t('tags.searchOrCreate')}
          autoComplete="off"
          value={query}
          aria-invalid={tooLong || undefined}
          aria-describedby={tooLong ? `${id}-err` : undefined}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && canCreate && !saving) {
              event.preventDefault();
              void create();
            }
          }}
        />
      </div>
      {tooLong && (
        <span id={`${id}-err`} className="pp-err" role="alert">
          <TriangleAlert className="pp-ico" aria-hidden="true" />
          {t('error.tagTooLong')}
        </span>
      )}
      <div className="list">
        {tags.isPending && <span className="pp-spin" aria-hidden="true" />}
        {shown.map((tag) => {
          const state = stateOf(tag.id);
          return (
            <label key={tag.id} className="row">
              <input
                type="checkbox"
                className="pp-check"
                checked={state === 'on'}
                ref={(input) => {
                  if (input !== null) input.indeterminate = state === 'mixed';
                }}
                disabled={saving}
                onChange={() => {
                  void toggle(tag, state !== 'on');
                }}
              />
              <TagChip tag={tag} />
            </label>
          );
        })}
        {tags.isSuccess && shown.length === 0 && !canCreate && (
          <span className="empty">{t('tags.none')}</span>
        )}
        {canCreate && (
          <div
            className="row create"
            role="button"
            tabIndex={0}
            aria-disabled={saving || undefined}
            onClick={() => {
              if (!saving) void create();
            }}
            onKeyDown={(event) => {
              if ((event.key === 'Enter' || event.key === ' ') && !saving) {
                event.preventDefault();
                void create();
              }
            }}
          >
            <Plus className="pp-ico" aria-hidden="true" />
            {t('tags.create', { name })}
          </div>
        )}
      </div>
    </div>
  );
}
