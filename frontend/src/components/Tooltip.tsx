import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

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
  const bubble = useRef<HTMLSpanElement>(null);

  /*
    The same problem as GAP-112, but sideways: a bubble hung from its trigger's
    left edge runs off the window on every card in the last column. This is a
    horizontal measurement, so it is not useFlipAbove — that one weighs the room
    above against the room below. The class goes on the element directly, since
    feeding a measurement back as state renders the bubble twice to land on the
    same pixels.
    ds-gap: GAP-110
  */
  useLayoutEffect(() => {
    const element = bubble.current;
    if (!open || element === null) return;
    const box = element.getBoundingClientRect();
    element.classList.toggle('app-tip-end', box.right > window.innerWidth);
    return () => {
      element.classList.remove('app-tip-end');
    };
  }, [open]);

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
        <span ref={bubble} className="pp-tip app-tip" role="tooltip" aria-hidden="true">
          {label}
        </span>
      )}
    </span>
  );
}
