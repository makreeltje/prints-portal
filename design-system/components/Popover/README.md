Popover shows a small interactive panel anchored to a trigger, such as the spool picker, the tag editor or a menu. It floats above the page content, including positioned cards and the Viewer3D.

**Anatomy.** Wrap trigger and panel in `.pp-anchor` (`position:relative`). The panel `pp-pop` (`surface`, `border`, `radius-lg`, `shadow-md`) is `position:absolute` under the trigger with an 8px offset and `z-index: var(--z-popover)` (30), so it paints above `.pp-print`, the viewer and every other positioned element in the page; the sticky bars stay below it (`z-sticky` 10) and drawers, sheets and dialogs above it (`z-overlay` 50). Modifiers: `.pp-anchor.end` aligns the panel to the right edge, `.pp-anchor.up` opens it above, `.pp-anchor.sheet` forces the bottom-sheet form at any width (2.2). Max width 360px. At 480px and below the panel becomes a bottom sheet (fixed, full width, `z-overlay`). Apps never set a `z-index`; the only stacking values are the tokens `z-raised`, `z-sticky`, `z-popover`, `z-tooltip` and `z-overlay`.

**Tokens.** `surface`, `border`, `shadow-md`, `radius-lg`, `z-popover`, `z-overlay`, `space-2`.

**States.** Closed, open; opens on click/Enter, closes on Esc, outside click or selection. Which side it opens to, how tall it may be and when it becomes a sheet: *Where it goes* below (2.2). None of it is optional.

**Accessibility.** Trigger has `aria-expanded` and `aria-haspopup`; focus moves into the panel on open and back to the trigger on close; Tab order follows the DOM, so put the panel right after its trigger.

**Dutch copy.** Kies een spoel | Tags bewerken

**Phone (1.5).** At 480px and below every anchored panel is a bottom sheet, including `.pp-anchor.up` and `.pp-anchor.end`: both are reset to `bottom:0; left:0; right:0` so the sheet is always visible.

**Where it goes (2.2, GAP-112).** 2.1 said "flip with `.up` near the bottom edge" and left *near* to the consumer, so nothing flipped: `.pp-anchor>.pp-pop` opened downwards always, and a spool picker on a file row near the bottom of a long print detail (panel 320x302, trigger at y=831 in a 900px window) was drawn 233px below the fold — nothing clipped it, it simply was not on the screen. The same rule carries every menu and the tag editor, so this is the rule for all of them. **A panel is never drawn outside the window.** Three parts, in this order:

1. **Side.** Open below, left edges aligned. `.up` when the room below the trigger is less than the panel's height *and* the room above is more. `.end` when a left-aligned panel's right edge would pass the window's right edge less `space-4`. The app measures with the trigger's rect and the panel's own height and sets the modifiers before the first paint; both axes are decided independently.
2. **Height.** The app passes the room on the chosen side, less `space-4`, as `--pp-pop-max` (a new allowed inline data property, next to `--c1`). The panel never grows past it, and **the panel's own region scrolls, never the page**: `.pp-picker`'s listbox and `.pp-tagpop`'s list are the scroll region: they keep their 240px as the height they *prefer* and shrink below it when the panel is capped, so a panel with room is exactly as tall as before and the search field above the list stays put and in view. A panel with no designated region scrolls itself. Without `--pp-pop-max` the cap falls back to the window height less `space-7`, which is a backstop, not the rule.
3. **Floor.** Under **240px** of room on the better side the panel takes the **sheet** form at any width: `.pp-anchor.sheet` (fixed, full width, bottom, `z-overlay`, at most `min(70vh, 100vh - space-7)`), the same form phones get. 240px is the height of the list caps in `.pp-picker` and `.pp-tagpop`: below it a panel cannot show its list and squeezing it to 60px of scroller is worse than moving it. A short window (a laptop at 360px of viewport height, a phone in landscape) therefore gets the sheet instead of a sliver.

Max width is unchanged (`min(360px, 100vw - space-7)`), so the horizontal axis was already bounded; only the alignment needed a rule. Focus and Esc are unchanged: the panel is the same panel wherever it is put, and a panel that reopens after a scroll is measured again.

**Drawn:** the flipped case, the capped case with 30 spools, and the forced sheet, in the preview.
