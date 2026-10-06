Popover shows a small interactive panel anchored to a trigger, such as the spool picker, the tag editor or a menu. It floats above the page content, including positioned cards and the Viewer3D.

**Anatomy.** Wrap trigger and panel in `.pp-anchor` (`position:relative`). The panel `pp-pop` (`surface`, `border`, `radius-lg`, `shadow-md`) is `position:absolute` under the trigger with an 8px offset and `z-index: var(--z-popover)` (30), so it paints above `.pp-print`, the viewer and every other positioned element in the page; the sticky bars stay below it (`z-sticky` 10) and drawers, sheets and dialogs above it (`z-overlay` 50). Modifiers: `.pp-anchor.end` aligns the panel to the right edge, `.pp-anchor.up` opens it above. Max width 360px. At 480px and below the panel becomes a bottom sheet (fixed, full width, `z-overlay`). Apps never set a `z-index`; the only stacking values are the tokens `z-raised`, `z-sticky`, `z-popover`, `z-tooltip` and `z-overlay`.

**Tokens.** `surface`, `border`, `shadow-md`, `radius-lg`, `z-popover`, `z-overlay`, `space-2`.

**States.** Closed, open; opens on click/Enter, closes on Esc, outside click or selection. Flip with `.up` near the bottom edge.

**Accessibility.** Trigger has `aria-expanded` and `aria-haspopup`; focus moves into the panel on open and back to the trigger on close; Tab order follows the DOM, so put the panel right after its trigger.

**Dutch copy.** Kies een spoel | Tags bewerken
