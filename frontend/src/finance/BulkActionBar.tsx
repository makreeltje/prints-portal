import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, CircleCheck, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/toast-context';
import { t } from '../i18n/nl';
import { keys } from '../prints/api';
import { TagPopover, type TagState } from '../prints/TagEditor';
import type { PrintSummary } from '../prints/types';
import { fetchMarkup, fetchSpoolmanStatus, financeKeys, runBulk, type BulkAction } from './api';
import { BulkPriceDialog, BulkSpoolDialog, BulkStateDialog } from './BulkDialogs';
import { reasonOf, type BulkFailure } from './bulk-results';

type Dialog = 'markPaid' | 'delete' | 'spool' | 'price' | 'state' | null;

/**
 * BulkActionBar: "{n} geselecteerd", Spoel toewijzen, Prijs instellen,
 * Markeer als betaald, Tags, Verwijderen and Selectie wissen. Spoel and
 * prijs open BulkDialogs; mark-all and delete confirm with the count; Tags
 * opens the tri-state tag popover. Every action reports per print: a toast
 * "{ok} van {totaal} bijgewerkt" and, for failures, the alert above the
 * grid (`onFailures`). On phones the actions sit behind "Acties". Esc
 * clears the selection.
 */
export function BulkActionBar({
  selected,
  onClear,
  onFailures,
}: {
  selected: readonly PrintSummary[];
  onClear: () => void;
  onFailures: (failures: BulkFailure[] | null) => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [tagsFrom, setTagsFrom] = useState<'wide' | 'phone' | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const tagsButton = useRef<HTMLButtonElement>(null);
  const actionsButton = useRef<HTMLButtonElement>(null);
  const count = selected.length;
  const spoolman = useQuery({
    queryKey: financeKeys.spoolman,
    queryFn: fetchSpoolmanStatus,
    staleTime: 60_000,
  });
  const markup = useQuery({ queryKey: financeKeys.markup, queryFn: fetchMarkup });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && document.querySelector('dialog[open]') === null) onClear();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [onClear]);

  /** Runs one action for every selected print; a failed request throws for the dialog. */
  const run = async (action: BulkAction, options: { quietSuccess?: boolean } = {}) => {
    setBusy(true);
    try {
      const { results } = await runBulk(
        selected.map((print) => print.id),
        action,
      );
      const ok = results.filter((result) => result.ok).length;
      const failures = results
        .filter((result) => !result.ok)
        .map((result) => ({
          id: result.id,
          name: selected.find((print) => print.id === result.id)?.name ?? result.id,
          reason: reasonOf(result),
        }));
      if (ok > 0 && options.quietSuccess !== true) {
        toast.success(t('bulk.result', { ok, total: results.length }));
      }
      onFailures(failures.length === 0 ? null : failures);
      if (failures.length === 0 && options.quietSuccess !== true) onClear();
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

  const open = (next: Dialog) => {
    setMenuOpen(false);
    setDialog(next);
  };
  const spoolOn = spoolman.data?.configured === true;

  const actions = (where: 'wide' | 'phone') => (
    <>
      {spoolOn && (
        <button
          type="button"
          className="pp-btn pp-btn-secondary"
          disabled={busy}
          onClick={() => {
            open('spool');
          }}
        >
          {t('bulk.assignSpool')}
        </button>
      )}
      <button
        type="button"
        className="pp-btn pp-btn-secondary"
        disabled={busy}
        onClick={() => {
          open('price');
        }}
      >
        {t('bulk.setPrice')}
      </button>
      {/* Beside the price, because both are set in the same pass (2.8). */}
      <button
        type="button"
        className="pp-btn pp-btn-secondary"
        disabled={busy}
        onClick={() => {
          open('state');
        }}
      >
        {t('request.set')}
      </button>
      <button
        type="button"
        className="pp-btn pp-btn-secondary"
        disabled={busy}
        onClick={() => {
          open('markPaid');
        }}
      >
        <CircleCheck className="pp-ico" aria-hidden="true" />
        {t('pay.markPaid')}
      </button>
      <button
        ref={where === 'wide' ? tagsButton : undefined}
        type="button"
        className="pp-btn pp-btn-secondary"
        aria-haspopup="dialog"
        aria-expanded={tagsFrom === where}
        disabled={busy}
        onClick={() => {
          setMenuOpen(false);
          setTagsFrom(tagsFrom === where ? null : where);
        }}
      >
        {t('tags.label')}
      </button>
      <button
        type="button"
        className="pp-btn pp-btn-danger"
        disabled={busy}
        onClick={() => {
          open('delete');
        }}
      >
        <Trash2 className="pp-ico" aria-hidden="true" />
        {t('common.delete')}
      </button>
    </>
  );

  const applyTags = async ({ add, remove }: { add: string[]; remove: string[] }) => {
    if (add.length > 0) await run({ action: 'addTags', tagIds: add }, { quietSuccess: true });
    if (remove.length > 0) {
      await run({ action: 'removeTags', tagIds: remove }, { quietSuccess: true });
    }
  };
  const closeTags = () => {
    (tagsFrom === 'phone' ? actionsButton : tagsButton).current?.focus();
    setTagsFrom(null);
  };

  return (
    <div className="pp-bulk" role="region" aria-label={t('bulk.region')}>
      <span className="count" aria-live="polite">
        {t('bulk.selected', { count })}
      </span>
      {busy && <span className="pp-spin" aria-hidden="true" />}
      <div className="pp-only-wide">
        <div className="pp-row pp-gap-2">
          {actions('wide')}
          {tagsFrom === 'wide' && (
            <span className="pp-anchor up">
              <TagPopover
                stateOf={stateOf}
                apply={applyTags}
                trigger={tagsButton}
                onClose={closeTags}
              />
            </span>
          )}
        </div>
      </div>
      <div className="pp-only-phone">
        <span className="pp-anchor up">
          <button
            ref={actionsButton}
            type="button"
            className="pp-btn pp-btn-secondary"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            onClick={() => {
              setTagsFrom(null);
              setMenuOpen((value) => !value);
            }}
          >
            {t('bulk.actions')}
            <ChevronDown className="pp-ico" aria-hidden="true" />
          </button>
          {menuOpen && <div className="pp-pop pp-col pp-p3">{actions('phone')}</div>}
          {tagsFrom === 'phone' && (
            <TagPopover
              stateOf={stateOf}
              apply={applyTags}
              trigger={actionsButton}
              onClose={closeTags}
            />
          )}
        </span>
      </div>
      <button
        type="button"
        className="pp-btn pp-btn-ghost pp-btn-icon"
        aria-label={t('common.clearSelection')}
        onClick={onClear}
      >
        <X className="pp-ico" aria-hidden="true" />
      </button>
      <ConfirmDialog
        open={dialog === 'markPaid'}
        title={t('confirm.bulkMarkPaid', { count })}
        confirmLabel={t('pay.markPaid')}
        onConfirm={() => run({ action: 'markPaid' })}
        onClose={() => {
          setDialog(null);
        }}
      />
      <ConfirmDialog
        open={dialog === 'delete'}
        title={t('confirm.bulkDelete', { count })}
        body={t('confirm.deletePrintBody')}
        confirmLabel={t('common.delete')}
        destructive
        onConfirm={() => run({ action: 'delete' })}
        onClose={() => {
          setDialog(null);
        }}
      />
      {dialog === 'spool' && (
        <BulkSpoolDialog
          count={count}
          onApply={(spoolId) => run({ action: 'assignSpool', spoolId })}
          onClose={() => {
            setDialog(null);
          }}
        />
      )}
      {dialog === 'state' && (
        <BulkStateDialog
          count={count}
          onApply={(state) => run({ action: 'setRequestState', state })}
          onClose={() => {
            setDialog(null);
          }}
        />
      )}
      {dialog === 'price' && (
        <BulkPriceDialog
          count={count}
          markupPercent={markup.data?.defaultMarkupPercent ?? null}
          onApply={(choice) =>
            run(
              'suggested' in choice
                ? { action: 'setPrice', suggested: true }
                : { action: 'setPrice', salePrice: choice.salePrice },
            )
          }
          onClose={() => {
            setDialog(null);
          }}
        />
      )}
    </div>
  );
}
