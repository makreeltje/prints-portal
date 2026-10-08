import { useLayoutEffect, useState, type RefObject } from 'react';

/**
 * Whether a popover should hang above its trigger instead of below it.
 *
 * The design system places every popover below its trigger and never flips, so
 * a panel opened low on the page is drawn past the bottom of the window — the
 * spool picker loses 233px of itself that way, which is most of its list. This
 * measures the panel once it is up and says when to flip.
 *
 * It prefers below: it only flips when there is genuinely less room below than
 * the panel needs *and* more room above, so a panel near the top of the page
 * does not flip into the same problem upwards.
 *
 * ds-gap: GAP-112
 */
export function useFlipAbove(panel: RefObject<HTMLElement | null>, open: boolean): boolean {
  const [above, setAbove] = useState(false);

  useLayoutEffect(() => {
    if (!open) {
      setAbove(false);
      return;
    }
    const element = panel.current;
    if (element === null) return;
    const box = element.getBoundingClientRect();
    // The trigger's edge: the panel sits a gap below it, so its own top is the
    // best proxy we have without reaching for the trigger.
    const roomBelow = window.innerHeight - box.top;
    const roomAbove = box.top;
    setAbove(box.height > roomBelow && roomAbove > roomBelow);
  }, [panel, open]);

  return above;
}
