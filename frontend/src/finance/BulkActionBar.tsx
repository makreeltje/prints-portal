import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, CircleCheck, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/toast-context';
import { t } from '../i18n/nl';
import { keys } from '../prints/api';
import { TagPopover, type TagState } from '../prints/TagEditor';
import type { PrintSummary } from '../prints/types';
import { runBulk, type BulkAction } from './api';

/**
 * BulkActionBar: "{n} geselecteerd", Markeer als betaald, Tags, Verwijderen
 * and Selectie wissen. Spoel toewijzen and Prijs instellen wait for their
 * dialogs (GAP-034). Destructive and mark-all actions confirm with the
 * count; failures keep the selection and show a toast. On phones the
 * actions sit behind "Acties". Esc clears the selection.
 */
export function BulkActionBar({
  selected,
  onClear,
}: {
  selected: readonly PrintSummary[];
  onClear: () => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState<'markPaid' | 'delete' | null>(null);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const tagsButton = useRef<HTMLButtonElement>(null);
  const count = selected.length;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && document.querySelector('dialog[open]') === null) onClear();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [onClear]);

  const run = async (action: BulkAction, clearOnSuccess = true) => {
    setBusy(true);
    try {
      const { results } = await runBulk(
        selected.map((print) => print.id),
        action,
      );
      if (results.some((result) => !result.ok)) toast.error(t('error.generic'));
      else if (clearOnSuccess) onClear();
    } finally {
      setBusy(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: keys.all }),
        queryClient.invalidateQueries({ queryKey: keys.tags }),
      ]);
    }
  };

  const stateOf = (tagId: string): TagState => {
    const having = selected.filter((print) => print.tags.some((tag) => tag.id === tagId)).length;
    return having === 0 ? 'off' : having === count ? 'on' : 'mixed';
  };

  const actions = (
    <>
      <button
        type="button"
        className="pp-btn pp-btn-secondary"
        disabled={busy}
        onClick={() => {
          setConfirm('markPaid');
        }}
      >
        <CircleCheck className="pp-ico" aria-hidden="true" />
        {t('pay.markPaid')}
      </button>
      <button
        ref={tagsButton}
        type="button"
        className="pp-btn pp-btn-secondary"
        aria-haspopup="dialog"
        aria-expanded={tagsOpen}
        disabled={busy}
        onClick={() => {
          setTagsOpen((open) => !open);
        }}
      >
        {t('tags.label')}
      </button>
      <button
        type="button"
        className="pp-btn pp-btn-danger"
        disabled={busy}
        onClick={() => {
          setConfirm('delete');
        }}
      >
        <Trash2 className="pp-ico" aria-hidden="true" />
        {t('common.delete')}
      </button>
    </>
  );

  return (
    <div className="pp-bulk" role="region" aria-label={t('bulk.region')}>
      <span className="count" aria-live="polite">
        {t('bulk.selected', { count })}
      </span>
      {busy && <span className="pp-spin" aria-hidden="true" />}
      <div className="pp-only-wide">
        <div className="pp-row pp-gap-2">{actions}</div>
      </div>
      <div className="pp-only-phone">
        <button
          type="button"
          className="pp-btn pp-btn-secondary"
          aria-expanded={menuOpen}
          onClick={() => {
            setMenuOpen((open) => !open);
          }}
        >
          {t('bulk.actions')}
          <ChevronDown className="pp-ico" aria-hidden="true" />
        </button>
      </div>
      <button
        type="button"
        className="pp-btn pp-btn-ghost pp-btn-icon"
        aria-label={t('common.clearSelection')}
        onClick={onClear}
      >
        <X className="pp-ico" aria-hidden="true" />
      </button>
      {menuOpen && (
        <div className="pp-only-phone app-tagpop-line">
          <div className="pp-col pp-gap-2">{actions}</div>
        </div>
      )}
      {tagsOpen && (
        <div className="app-tagpop-line">
          <TagPopover
            stateOf={stateOf}
            apply={async ({ add, remove }) => {
              if (add.length > 0) await run({ action: 'addTags', tagIds: add }, false);
              if (remove.length > 0) await run({ action: 'removeTags', tagIds: remove }, false);
            }}
            trigger={tagsButton}
            onClose={() => {
              setTagsOpen(false);
            }}
          />
        </div>
      )}
      <ConfirmDialog
        open={confirm === 'markPaid'}
        title={t('confirm.bulkMarkPaid', { count })}
        confirmLabel={t('pay.markPaid')}
        onConfirm={() => run({ action: 'markPaid' })}
        onClose={() => {
          setConfirm(null);
        }}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        title={t('confirm.bulkDelete', { count })}
        body={t('confirm.deletePrintBody')}
        confirmLabel={t('common.delete')}
        destructive
        onConfirm={() => run({ action: 'delete' })}
        onClose={() => {
          setConfirm(null);
        }}
      />
    </div>
  );
}
