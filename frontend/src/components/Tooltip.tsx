import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Tooltip: the design system's bubble, in its window-placed form.
 *
 * `.pp-tip.at` is required wherever an ancestor clips or scrolls, and this one
 * lives inside `.pp-print`, which is `overflow: hidden`. The app passes the
 * trigger's measured rect as `--pp-tip-x`/`--pp-tip-y` and picks the side per
 * axis; every length stays in `bundle.css` (design system 2.2, Floating panels).
 *
 * The bubble is `aria-hidden` because its text *is* the trigger's accessible
 * name rather than an addition to it, so there is deliberately no
 * `aria-describedby`: a screen reader should read the sentence once. The
 * trigger stays non-focusable on purpose — it is a graphic inside a stretched
 * card link, and its words live on the print detail.
 */
export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const trigger = anchor.current?.getBoundingClientRect();
    const box = bubble.current?.getBoundingClientRect();
    if (trigger === undefined || box === undefined) return;
    // Each axis on its own, as Popover does: hang from the right edge when a
    // left-aligned bubble would pass the window, and drop below when there is
    // no room above.
    const end = trigger.left + box.width > window.innerWidth;
    const down = trigger.top < box.height;
    const element = bubble.current;
    if (element === null) return;
    element.classList.toggle('end', end);
    element.classList.toggle('down', down);
    element.style.setProperty(
      '--pp-tip-x',
      `${String(Math.round(end ? trigger.right : trigger.left))}px`,
    );
    element.style.setProperty(
      '--pp-tip-y',
      `${String(Math.round(down ? trigger.bottom : trigger.top))}px`,
    );
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
      ref={anchor}
      /*
        Deliberately NOT .pp-anchor. A `.pp-tip.at` is window-placed, and the
        anchored rule `.pp-anchor > .pp-tip` sets `bottom`, which `.at` does not
        reset: both edges end up set at once and the bubble collapses to its own
        padding — 8px where its text needs 24.
        ds-gap: GAP-114
      */
      className="app-tipwrap"
      onPointerEnter={() => {
        setOpen(true);
      }}
      onPointerLeave={() => {
        setOpen(false);
      }}
    >
      {children}
      {open && (
        <span ref={bubble} className="pp-tip at" role="tooltip" aria-hidden="true">
          {label}
        </span>
      )}
    </span>
  );
}
