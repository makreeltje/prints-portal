import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';

/**
 * Dialog from design-system/components/Dialog on a native <dialog>: the
 * browser traps focus, makes the page inert and handles Esc; focus moves to
 * the element marked data-autofocus and returns to the trigger on close. `busy` blocks closing while a request runs.
 */
export function Dialog({
  open,
  title,
  onClose,
  children,
  footer,
  busy = false,
  alert = false,
  icon,
  describedBy,
  closeLabel,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children?: ReactNode;
  footer: ReactNode;
  busy?: boolean;
  /** role="alertdialog" for destructive confirmations. */
  alert?: boolean;
  icon?: ReactNode;
  describedBy?: string;
  /** aria-label for a close button in the header; omitted when not given. */
  closeLabel?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;
    if (open && !dialog.open) {
      returnFocus.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      // Initial focus: the element marked data-autofocus (e.g. Annuleren), else the browser's choice.
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    }
    if (!open && dialog.open) {
      dialog.close();
      returnFocus.current?.focus();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="app-dialog"
      role={alert ? 'alertdialog' : undefined}
      aria-labelledby={titleId}
      aria-describedby={describedBy}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      {open && (
        <div className="pp-dialog">
          <header>
            {icon}
            <h2 id={titleId}>{title}</h2>
            {closeLabel !== undefined && (
              <button
                type="button"
                className="pp-btn pp-btn-ghost pp-btn-icon pp-btn-sm"
                aria-label={closeLabel}
                disabled={busy}
                onClick={onClose}
              >
                <X className="pp-ico" aria-hidden="true" />
              </button>
            )}
          </header>
          {children !== undefined && <div className="pp-body pp-col">{children}</div>}
          <footer>{footer}</footer>
        </div>
      )}
    </dialog>
  );
}
