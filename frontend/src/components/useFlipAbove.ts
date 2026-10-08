import { useLayoutEffect, type RefObject } from 'react';

/**
 * Flip a popover above its trigger when it would not fit below.
 *
 * The design system places every popover below its trigger and never flips, so
 * a panel opened low on the page is drawn past the bottom of the window — the
 * spool picker loses 233px of itself that way, which is most of its list.
 *
 * It prefers below: it only flips when there is genuinely less room below than
 * the panel needs *and* more room above, so a panel near the top of the page
 * does not flip into the same problem upwards.
 *
 * The class goes straight onto the element rather than through state. This is
 * a measurement of what the browser just laid out, and feeding it back as
 * state would render the panel twice to reach the same pixels.
 *
 * ds-gap: GAP-112
 */
export function useFlipAbove(
  panel: RefObject<HTMLElement | null>,
  enabled: boolean,
  className = 'app-pop-above',
): void {
  useLayoutEffect(() => {
    const element = panel.current;
    if (!enabled || element === null) return;
    const box = element.getBoundingClientRect();
    const roomBelow = window.innerHeight - box.top;
    const roomAbove = box.top;
    element.classList.toggle(className, box.height > roomBelow && roomAbove > roomBelow);
    return () => {
      element.classList.remove(className);
    };
  }, [panel, enabled, className]);
}
