import { createPortal } from 'react-dom';
import type { ReactNode, RefObject } from 'react';

/**
 * Renders children outside the stacking contexts between `from` and the page,
 * while staying inside whatever modal `from` sits in.
 *
 * A window-placed panel (`.pp-pop.at`, `.pp-tip.at`) escapes clipping because
 * it is `position: fixed`, but a fixed box is still painted inside its
 * ancestors' stacking contexts, and both wrappers the system offers carry one:
 * `.pp-anchor` and `.pp-lift` are `z-index: 1`. A panel left inside either is
 * compared at that level and loses to any later sibling at the same level —
 * which is how a klant tile's menu ended up under the next tile's Factuur
 * button.
 *
 * The target is the nearest open `<dialog>`, else the body. That distinction
 * is not optional: a modal dialog paints in the browser's top layer, so a
 * panel portalled all the way to the body would sit *behind the whole modal*
 * rather than above one button. Measured both ways — out of the dialog, every
 * sampled pixel of the menu was covered.
 */
export function Portal({
  from,
  children,
}: {
  /** An element in the tree the panel belongs to, used to find the modal. */
  from: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const target = from.current?.closest('dialog') ?? document.body;
  return createPortal(children, target);
}
