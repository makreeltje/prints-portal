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
  size,
  panelClass,
  onSubmit,
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
  /** `sm`: the 380px panel for confirmations (pp-dialog sm); `lg`: 560px (pp-dialog lg). */
  size?: 'sm' | 'lg';
  /**
   * A dialog-wide class from the design system, e.g. `pp-allcust`. Those are
   * written as descendant selectors (`.pp-allcust .pp-body`), so the class has
   * to sit on the panel; on a child it matches nothing and fails silently.
   */
  panelClass?: string;
  /** Makes the panel a form, so Enter submits. */
  onSubmit?: () => void;
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
        <Panel size={size} panelClass={panelClass} onSubmit={onSubmit}>
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
        </Panel>
      )}
    </dialog>
  );
}

function Panel({
  size,
  panelClass,
  onSubmit,
  children,
}: {
  size?: 'sm' | 'lg';
  /**
   * A dialog-wide class from the design system, e.g. `pp-allcust`. It belongs
   * on this element and nowhere else: those classes are written as descendant
   * selectors (`.pp-allcust .pp-body`), so putting one on a child silently
   * matches nothing.
   */
  panelClass?: string;
  onSubmit?: () => void;
  children: ReactNode;
}) {
  // `sheet`: full width with top corners only at 480px and below (Dialog spec).
  const className = ['pp-dialog', size ?? '', 'sheet', panelClass ?? '']
    .filter((name) => name !== '')
    .join(' ');
  if (onSubmit === undefined) return <div className={className}>{children}</div>;
  return (
    <form
      className={className}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {children}
    </form>
  );
}
