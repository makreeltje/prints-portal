import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { ApiError } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FieldError, GenericError } from '../components/FieldError';
import { t, type MessageKey } from '../i18n/nl';
import { ErrorState, LoadingRows } from '../pages/ErrorState';
import { createTag, deleteTag, fetchTags, keys, updateTag } from './api';
import { TagChip } from './bits';
import {
  isPaletteKey,
  normalizeTagName,
  TAG_PALETTE,
  tagKey,
  tagNameTooLong,
  type TagPaletteKey,
} from './tag-palette';
import type { TagWithCount } from './types';

/** The row being edited: an existing tag, or a new one from "Tag maken". */
type Editing = { kind: 'existing'; tag: TagWithCount } | { kind: 'new' } | null;

/**
 * ScreenTags (`/tags`, Admin and Editor): every tag with its chip and print
 * count; rename and recolour in place (palette of ten plus "Geen kleur"),
 * create with "Tag maken", delete with a confirmation. Names are unique
 * regardless of case and at most 64 characters.
 */
export function TagsPage() {
  const queryClient = useQueryClient();
  const tags = useQuery({ queryKey: keys.tags, queryFn: fetchTags });
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<TagWithCount | null>(null);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.tags }),
      queryClient.invalidateQueries({ queryKey: keys.all }),
    ]);
  };

  const createButton = (
    <button
      type="button"
      className="pp-btn pp-btn-primary"
      onClick={() => {
        setEditing({ kind: 'new' });
      }}
    >
      <Plus className="pp-ico" aria-hidden="true" />
      {t('tags.createButton')}
    </button>
  );
  const header = (
    <>
      <div className="pp-ph">
        <h1>{t('tags.settingsTitle')}</h1>
        {tags.isSuccess && createButton}
      </div>
      <span className="pp-help">{t('tags.settingsHelp')}</span>
    </>
  );

  if (tags.isPending) {
    return (
      <>
        {header}
        <LoadingRows />
      </>
    );
  }
  if (tags.isError) {
    return (
      <>
        {header}
        <ErrorState body={t('system.errorBody')} onRetry={() => void tags.refetch()} />
      </>
    );
  }

  const all = tags.data.tags;
  const close = () => {
    setEditing(null);
  };
  const editor = (tag: TagWithCount | null) => (
    <TagEditRow
      key={tag?.id ?? 'new'}
      tag={tag}
      others={all.filter((other) => other.id !== tag?.id)}
      onSave={async (name, colour) => {
        if (tag === null) {
          await createTag(name, colour ?? null);
        } else {
          await updateTag(tag.id, colour === undefined ? { name } : { name, colour });
        }
        await refresh();
        close();
      }}
      onCancel={close}
    />
  );

  return (
    <>
      {header}
      {all.length === 0 && editing?.kind !== 'new' ? (
        <div className="pp-empty">
          <p>{t('tags.empty')}</p>
          {createButton}
        </div>
      ) : (
        <div className="pp-card pp-flush">
          {editing?.kind === 'new' && editor(null)}
          {all.map((tag) =>
            editing?.kind === 'existing' && editing.tag.id === tag.id ? (
              editor(tag)
            ) : (
              <div key={tag.id} className="pp-tagrow">
                <span>
                  <TagChip tag={tag} />
                </span>
                <span className="cnt">{t('tags.useCount', { count: tag.printCount })}</span>
                <span className="acts">
                  <button
                    type="button"
                    className="pp-btn pp-btn-ghost pp-btn-icon"
                    aria-label={t('tags.rename', { name: tag.name })}
                    onClick={() => {
                      setEditing({ kind: 'existing', tag });
                    }}
                  >
                    <Pencil className="pp-ico" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="pp-btn pp-btn-ghost pp-btn-icon"
                    aria-label={t('tags.remove', { tag: tag.name })}
                    onClick={() => {
                      setDeleting(tag);
                    }}
                  >
                    <Trash2 className="pp-ico" aria-hidden="true" />
                  </button>
                </span>
              </div>
            ),
          )}
        </div>
      )}
      <ConfirmDialog
        open={deleting !== null}
        title={t('confirm.deleteTag', { name: deleting?.name ?? '' })}
        body={t('confirm.deleteTagBody', { count: deleting?.printCount ?? 0 })}
        confirmLabel={t('common.delete')}
        destructive
        onConfirm={async () => {
          if (deleting === null) return;
          await deleteTag(deleting.id);
          await refresh();
        }}
        onClose={() => {
          setDeleting(null);
        }}
      />
    </>
  );
}

/** Edit row (`.pp-tagrow.edit`): Naam, Kleur (palette), Opslaan and Annuleren. */
function TagEditRow({
  tag,
  others,
  onSave,
  onCancel,
}: {
  tag: TagWithCount | null;
  others: readonly TagWithCount[];
  /** `colour` is undefined when it was not touched (keeps a free colour from before v1.3). */
  onSave: (name: string, colour: TagPaletteKey | null | undefined) => Promise<void>;
  onCancel: () => void;
}) {
  const id = useId();
  const [name, setName] = useState(tag?.name ?? '');
  const [colour, setColour] = useState<TagPaletteKey | null>(
    tag?.colour !== null && tag?.colour !== undefined && isPaletteKey(tag.colour)
      ? tag.colour
      : null,
  );
  const [colourTouched, setColourTouched] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const validate = (value: string): MessageKey | null => {
    if (tagNameTooLong(value)) return 'error.tagTooLong';
    const key = tagKey(value);
    if (others.some((other) => tagKey(other.name) === key)) return 'error.tagExists';
    return null;
  };

  const save = async () => {
    const normalized = normalizeTagName(name);
    if (normalized === '') return;
    const problem = validate(normalized);
    setError(problem);
    if (problem !== null) return;
    setBusy(true);
    setFailed(false);
    try {
      await onSave(normalized, colourTouched || tag === null ? colour : undefined);
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'tag_exists') setError('error.tagExists');
      else if (caught instanceof ApiError && caught.code === 'invalid_tag_name')
        setError('error.tagTooLong');
      else setFailed(true);
      setBusy(false);
    }
  };

  return (
    <form
      className="pp-tagrow edit"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCancel();
      }}
    >
      <div className="pp-col pp-gap-2">
        {failed && <GenericError />}
        <div className="pp-field">
          <label htmlFor={`${id}-name`}>{t('tags.name')}</label>
          <input
            id={`${id}-name`}
            className="pp-input"
            autoFocus
            autoComplete="off"
            value={name}
            aria-invalid={error !== null || undefined}
            aria-describedby={error === null ? undefined : `${id}-err`}
            onChange={(event) => {
              setName(event.target.value);
              setError(tagNameTooLong(event.target.value) ? 'error.tagTooLong' : null);
            }}
          />
          {error !== null && <FieldError id={`${id}-err`}>{t(error)}</FieldError>}
        </div>
        <div className="pp-label" id={`${id}-colour`}>
          {t('tags.color')}
        </div>
        <Palette
          labelledBy={`${id}-colour`}
          value={colour}
          onChange={(next) => {
            setColour(next);
            setColourTouched(true);
          }}
        />
        <div className="pp-row pp-gap-2">
          <button
            type="submit"
            className="pp-btn pp-btn-primary"
            disabled={busy || normalizeTagName(name) === ''}
            aria-busy={busy}
          >
            {busy && <span className="pp-spin" aria-hidden="true" />}
            {t('common.save')}
          </button>
          <button type="button" className="pp-btn pp-btn-ghost" onClick={onCancel}>
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </form>
  );
}

/**
 * Palette (`.pp-pal`): a radiogroup of the ten palette colours plus
 * "Geen kleur". Arrow keys move the choice; only the chosen swatch is a tab stop.
 */
function Palette({
  labelledBy,
  value,
  onChange,
}: {
  labelledBy: string;
  value: TagPaletteKey | null;
  onChange: (value: TagPaletteKey | null) => void;
}) {
  const options: (TagPaletteKey | null)[] = [...TAG_PALETTE, null];
  const group = useRef<HTMLDivElement>(null);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const index = options.indexOf(value);
    const next = (index + step + options.length) % options.length;
    onChange(options[next] ?? null);
    group.current?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus();
  };

  return (
    <div
      ref={group}
      className="pp-pal"
      role="radiogroup"
      aria-labelledby={labelledBy}
      onKeyDown={onKeyDown}
    >
      {options.map((option) => {
        const checked = option === value;
        return option === null ? (
          <button
            key="none"
            type="button"
            className="none"
            role="radio"
            aria-checked={checked}
            aria-label={t('tags.noColor')}
            tabIndex={checked ? 0 : -1}
            onClick={() => {
              onChange(null);
            }}
          >
            <X className="pp-ico" aria-hidden="true" />
          </button>
        ) : (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={t(`tags.colour.${option}`)}
            data-c={option}
            tabIndex={checked ? 0 : -1}
            onClick={() => {
              onChange(option);
            }}
          >
            {checked && <Check className="pp-ico" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}
