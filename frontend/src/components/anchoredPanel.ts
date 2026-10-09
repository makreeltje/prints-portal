import { useLayoutEffect, type RefObject } from 'react';

/** The room a panel needs before it stops being a panel (design system 2.2). */
const SHEET_FLOOR = 240;
/** `space-4`: the margin the system keeps between a panel and the window. */
const GUTTER = 16;

/**
 * Place a window-placed panel (`.pp-pop.at`, design system 2.3).
 *
 * The app decides the side per axis from the trigger's rect and the panel's own
 * height, passes the trigger's edges as `--pp-pop-x` / `--pp-pop-y` and the room
 * it has as `--pp-pop-max`, and falls back to the sheet form when neither side
 * can show a list. Every length stays in `bundle.css`; what crosses the line is
 * a measurement.
 *
 * 2.2 placed the panel inside its `.pp-anchor`, which the cards it opens in
 * clipped — `.pp-flush`, `.pp-print` and `.pp-group` are all `overflow: hidden`.
 * A fixed box escapes that, and the price of the form is this: it does not
 * follow the page, so an open panel is re-measured on scroll and resize and
 * closed when its trigger leaves the window. One listener per open panel.
 *
 * Note for anyone moving things around: any ancestor of the trigger with a
 * `transform`, `filter` or `backdrop-filter` becomes the containing block of a
 * fixed box and clips it again.
 *
 * The modifiers and the measurements go straight onto the panel rather than
 * through state: this reads what the browser just laid out, and feeding it back
 * would render the panel twice to reach the same pixels.
 */
export function useAnchoredPanel(
  panel: RefObject<HTMLElement | null>,
  trigger: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
): void {
  useLayoutEffect(() => {
    const panelElement = panel.current;
    const triggerElement = trigger.current;
    if (!open || panelElement === null || triggerElement === null) return;

    const place = () => {
      const triggerBox = triggerElement.getBoundingClientRect();
      // Scrolled out of sight: a fixed panel would hang there on its own.
      if (triggerBox.bottom < 0 || triggerBox.top > window.innerHeight) {
        onClose();
        return;
      }
      const panelBox = panelElement.getBoundingClientRect();
      const below = window.innerHeight - triggerBox.bottom - GUTTER;
      const above = triggerBox.top - GUTTER;
      const up = panelBox.height > below && above > below;
      const room = Math.round(Math.max(up ? above : below, 0));
      // Neither side can show a list: the sheet is better than a sliver.
      const sheet = room < SHEET_FLOOR;
      const end = triggerBox.left + panelBox.width > window.innerWidth - GUTTER;

      panelElement.classList.toggle('up', up && !sheet);
      panelElement.classList.toggle('end', end && !sheet);
      panelElement.classList.toggle('sheet', sheet);
      if (sheet) {
        for (const name of ['--pp-pop-max', '--pp-pop-x', '--pp-pop-y']) {
          panelElement.style.removeProperty(name);
        }
        return;
      }
      panelElement.style.setProperty('--pp-pop-max', `${String(room)}px`);
      panelElement.style.setProperty(
        '--pp-pop-x',
        `${String(Math.round(end ? triggerBox.right : triggerBox.left))}px`,
      );
      panelElement.style.setProperty(
        '--pp-pop-y',
        `${String(Math.round(up ? triggerBox.top : triggerBox.bottom))}px`,
      );
    };

    place();
    // `true`: a scroll inside any container moves the trigger too, and those
    // events do not bubble.
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
      panelElement.classList.remove('up', 'end', 'sheet');
      for (const name of ['--pp-pop-max', '--pp-pop-x', '--pp-pop-y']) {
        panelElement.style.removeProperty(name);
      }
    };
  }, [panel, trigger, open, onClose]);
}
