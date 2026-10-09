import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { placeTip } from './tipPlacement';

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
    const element = bubble.current;
    if (trigger === undefined || element === null) return;
    placeTip(element, trigger);
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
        `.pp-lift`, not `.pp-anchor`: a window-placed `.at` bubble may not sit
        inside an anchor (2.3), and what this wrapper actually needs from the
        anchor is only to sit above the stretched card link that would otherwise
        swallow the hover.
      */
      className="pp-lift"
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
