import { useEffect, useState, type ReactNode } from 'react';

/**
 * Tooltip: the design system's `pp-tip` bubble, shown on hover and dismissed
 * with Esc.
 *
 * Two deviations from the spec, both logged as GAP-110 and approved by the
 * owner: it appears immediately rather than after 400ms, and the system styles
 * `pp-tip` without saying where it goes inside an anchor, so `app-tip` places
 * it (tokens only).
 *
 * The bubble is `aria-hidden` on purpose. Its text repeats the trigger's own
 * accessible name, so exposing it as a description would make a screen reader
 * say the same sentence twice. It is a visual affordance for people who can see
 * the icons but do not know them yet; everyone else already has the sentence.
 */
export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span
      className="pp-anchor"
      onPointerEnter={() => {
        setOpen(true);
      }}
      onPointerLeave={() => {
        setOpen(false);
      }}
    >
      {children}
      {open && (
        // ds-gap: GAP-110
        <span className="pp-tip app-tip" role="tooltip" aria-hidden="true">
          {label}
        </span>
      )}
    </span>
  );
}
