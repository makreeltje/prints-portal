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

**Measured, and what is still unexercised (2.2).** Panel heights in the app: the 30-spool picker **302px**, the tag editor with this library's two tags **136px**, Toegang's column menu **96px**. On the smallest window available (**760px** of viewport) a picker low in a print detail is offered **348px** on its chosen side, which holds the 302px panel: part 1 and part 2 of the rule carry every case this machine can produce, and that is where the bug was. **Part 3, the 240px sheet floor, is therefore specified but unexercised** — it would first bite around 560px of viewport height, or a phone in landscape, neither of which has been seen. Treat it as the backstop it is: if you ever meet it and it behaves badly, that is a gap and not a surprise. Do not drop it on the grounds that it never fires here; a short laptop window is an ordinary thing and 2.1 shipped a rule that had never been tried either.

**2.3.** (2026-10-08) **The panel gets the window-placed form the tooltip has (GAP-114, resolved).** Measured: `.pp-pop` is `position: absolute` and the cards it opens inside clip — `.pp-flush`, `.pp-print`, `.pp-group` and `.pp-ogrp` are all `overflow: hidden` — so the spool picker in the print's file list was cut off at the card's edge. 2.2 gave the tooltip `.at` for exactly this reason and gave the popover nothing; that was an oversight, not a judgement.

**"Why can it not simply be on top?" Because `overflow: hidden` does not care what `z-index` says** — the same thing GAP-098 ran into with a sticky cell. Stacking cannot get a box out of a clip; only leaving the clip's flow can.

- **New: `.pp-pop.at`**, the same vocabulary as `.pp-tip.at`. The app passes the trigger's rect as `--pp-pop-x` / `--pp-pop-y` (left and bottom by default, right with `.end`, top with `.up`) and the room on the chosen side as `--pp-pop-max`, exactly as for the anchored form. Every length — the 8px offset, the 360px cap, the sheet's height, the radius — stays in `bundle.css`. Side, height and sheet floor are decided by *Where it goes* above, unchanged: `.at` changes where the box is, not how it is placed.
- **`.at` is required whenever an ancestor of the trigger clips or scrolls**, and forbidden inside a `.pp-anchor` (see Tooltip's 2.3 note: an anchor is an offset parent, which a window-placed panel does not have). The anchored form stays the normal one for a trigger in plain page flow and for the previews.
- **While an `.at` panel is open the app re-measures it on scroll and resize, and closes it when its trigger leaves the window.** A fixed box does not follow the page, so this is the cost of the form and it is not optional; it is one listener on the open panel, not on every trigger.
- **One trap to know:** an ancestor with a `transform`, `filter` or `backdrop-filter` becomes the containing block of a fixed box and would clip the panel again. Do not put one above a trigger. (`.pp-art`'s filter is on the picture itself, which never has a panel inside it.)

**Rejected: "a card must not clip an open panel."** It is the cheaper rule exactly once — in the card where the bug was found — and after that it is an obligation on every card in the system, including the ones that clip on purpose: `.pp-flush` exists so a full-bleed table keeps the card's rounded corners. It also fails the moment a panel is taller than its card, which is the ordinary case for a 302px picker in a file row. A panel's placement is the panel's problem. The placeholder (the card stops clipping while a panel is open) can go when `.at` lands.

**Drawn:** the picker as `.pp-pop.at` escaping a clipping `pp-card pp-flush`, in the preview.

**2.13.** (2026-10-18) **A window-placed panel leaves its wrapper, and this is the rule for all of
them (GAP-146, resolved).** Three components have taken the same placeholder one at a time — the
klant tile's OverflowMenu (2.7), the Tooltip, and this week the SpoolPicker, where the owner saw an
open spool list with the rows' own buttons drawn across it. Measured before the fix, on a print with
four files: opening row 2's picker left **two triggers painting over the panel, 200 × 32 each**, and
the panel lost every probe; rows 3 and 4 the same. The cause is one sentence: **`.pp-lift` is
`position: relative; z-index: var(--z-raised)`, so it is a stacking context, and a panel inside it
is compared only against its siblings *inside that wrapper*.** `z-popover` (30) never meets the
later rows at all; whichever lifted element comes last in the DOM wins.

**The rule, as rule 9 of *Floating panels* in `README.md`:** a panel in the `.at` form is rendered
**as a child of the nearest open `<dialog>`, else of `<body>`** — never inside its trigger's
wrapper. Nothing else may be its parent.

- **`.at` alone is not enough, and the app proved it by building it.** A fixed box escapes
  **clipping**, not its ancestors' **stacking contexts**. Those are two different failures with one
  symptom, and 2.3 only named the first.
- **Portalling all the way to the body is also wrong.** A modal `<dialog>` paints in the top layer,
  so a panel outside it lands beneath the whole modal. Measured over a grid of 575 points per menu:
  anchored **1 of 11** menus clear, portalled to the body **0 of 11**, portalled to the nearest open
  `<dialog>` **11 of 11**. The rule names the dialog because the measurement does.
- **Rejected: taking the `z-index` off `.pp-lift`.** It would fix this case — with no stacking
  context the panel's 30 competes globally — and it is the cheaper line of CSS. It is rejected
  because `.pp-lift` exists *for* that z-index: it puts a trigger above a stretched card or row link
  (`.pp-cust-name::after`, inset 0). Without it, whether the trigger is above the hit area depends
  on DOM order between the two, which differs per component and fails silently — a worse version of
  the bug being fixed. And it would fix only the wrapper we own: a card with `overflow: hidden`, a
  `transform`, a `filter` or a `mask` above the trigger brings the panel back under or inside
  something. **A panel's placement is the panel's problem**, which is the rule this system has
  already taken twice (2.2 for the window, 2.3 for clipping).
- **`.pp-lift` is unchanged**, and it joins the list of things in rule 8 that confine a panel. The
  list is now: `overflow` that clips or scrolls, `transform`, `filter`, `backdrop-filter`, `mask` —
  and **any stacking context, `.pp-lift` included**. A trigger inside one of those takes `.at`; a
  trigger in plain page flow keeps the anchored form, which is what the previews draw.
- **The trade this rule makes, said out loud: a portalled panel is not next to its trigger in the
  DOM, so Tab order cannot carry it.** The Accessibility paragraph above says "put the panel right
  after its trigger"; for an `.at` panel that is impossible. So an `.at` panel is **focus-managed
  instead of DOM-ordered**: focus moves into the panel on open and back to the trigger on close, Esc
  closes, and focus leaving the panel closes it — the same contract OverflowMenu already states for
  its items. Its `aria-controls`/`aria-expanded` pair is what ties the two together for a screen
  reader, and it is no longer optional.
- **This is checkable, which matters more than the prose:** `.pp-pop` or `.pp-tip` without `.at`
  inside a `.pp-lift` or a `.pp-anchor` inside a `.pp-lift` is a violation a grep can find, and the
  three placeholders in the app are already the specified behaviour, so their `ds-gap` markers can
  go.

**A fault that needs a particular scroll position to appear is one verification keeps missing** —
the app's own note, and the argument for a rule rather than a fourth patch. The picker opened
*upward* on every screen it was tested on.

**No new class, no new token, no CSS change.** `.pp-pop.at` and `.pp-tip.at` are unchanged; what
changes is where the app puts them.
