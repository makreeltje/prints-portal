/**
 * Place a `.pp-tip.at` bubble against a trigger's rect — each axis on its own,
 * as Popover does: hang from the right edge when a left-aligned bubble would
 * pass the window, and drop below when there is no room above.
 *
 * Exported because a bubble is not always a child of its trigger: in the model
 * strip it has to be a sibling of `.pp-models`, whose overflow mask would
 * otherwise fade it with the strip's edge (2.6).
 */
export function placeTip(element: HTMLElement, trigger: DOMRect): void {
  const box = element.getBoundingClientRect();
  const end = trigger.left + box.width > window.innerWidth;
  const down = trigger.top < box.height;
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
}
