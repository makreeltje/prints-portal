import { useLayoutEffect, type RefObject } from 'react';

/** The room a panel needs before it stops being a panel (design system 2.2). */
const SHEET_FLOOR = 240;
/** `space-4`: the margin the system keeps between a panel and the window. */
const GUTTER = 16;

/**
 * Place an anchored panel (design system 2.2, *Floating panels*).
 *
 * The app decides the side per axis from the trigger's rect and the panel's own
 * height, passes the room it has as `--pp-pop-max` so the panel caps itself,
 * and falls back to the sheet form when neither side can show a list. Every
 * length stays in `bundle.css`; what crosses the line is a measurement.
 *
 * The modifiers and the measurement go straight onto the anchor rather than
 * through state: this reads what the browser just laid out, and feeding it back
 * would render the panel twice to reach the same pixels.
 */
export function useAnchoredPanel(
  anchor: RefObject<HTMLElement | null>,
  panel: RefObject<HTMLElement | null>,
  trigger: RefObject<HTMLElement | null>,
  open: boolean,
): void {
  useLayoutEffect(() => {
    const anchorElement = anchor.current;
    const panelBox = panel.current?.getBoundingClientRect();
    const triggerBox = trigger.current?.getBoundingClientRect();
    if (!open || anchorElement === null || panelBox === undefined || triggerBox === undefined) {
      return;
    }

    const below = window.innerHeight - triggerBox.bottom - GUTTER;
    const above = triggerBox.top - GUTTER;
    const up = panelBox.height > below && above > below;
    const room = Math.round(Math.max(up ? above : below, 0));
    // Neither side can show a list: the sheet is better than a sliver.
    const sheet = room < SHEET_FLOOR;
    const end = triggerBox.left + panelBox.width > window.innerWidth - GUTTER;

    anchorElement.classList.toggle('up', up && !sheet);
    anchorElement.classList.toggle('end', end && !sheet);
    anchorElement.classList.toggle('sheet', sheet);
    if (sheet) anchorElement.style.removeProperty('--pp-pop-max');
    else anchorElement.style.setProperty('--pp-pop-max', `${String(room)}px`);

    return () => {
      anchorElement.classList.remove('up', 'end', 'sheet');
      anchorElement.style.removeProperty('--pp-pop-max');
    };
  }, [anchor, panel, trigger, open]);
}
