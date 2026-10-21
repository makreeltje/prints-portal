Tooltip explains an icon-only button or a disabled action in one short line.

**Anatomy.** Inverted bubble (`text-strong` ground with `bg` text), 12px text, max 240px, **appears at once** on hover and on keyboard focus (2.2; the 400ms of 1.0 is withdrawn), never contains links or buttons and never takes pointer events.

**Tokens.** `text-strong`, `bg`, `shadow-md`, `radius-sm`, `z-tooltip`, `space-1`, `motion-fast`.

**States.** Hidden, visible; dismiss with Esc, on blur and on pointer leave. One bubble at a time.

**Accessibility.** Either the bubble describes the trigger or it *is* the trigger's name — never both; which one, and what that means for `aria-describedby`, is under *Name or description* below (2.2). In both cases the bubble is never the only place an essential instruction lives.

**Dutch copy.** "Downloaden", "Telt niet mee in kosten", "Voeg eerst een printerprofiel toe voor stroomkosten."

**Where it goes (2.2, GAP-110).** 2.1 styled `.pp-tip` and said nothing about where it is put: `.pp-anchor>.pp-pop` had a rule, `.pp-tip` had none, and the preview placed the bubble statically, so every consumer invented a placement and one of them ran 116px off the right edge of the window on every card in the last column. The bubble now has a place, and it is the same vocabulary as Popover:

- **Default: above the trigger**, left edges aligned, `space-1` of gap, `z-tooltip` (40).
- **`.end`** hangs it from its right edge — for a trigger in the last column, where a left-aligned bubble would pass the window's right edge.
- **`.down`** puts it below — for a trigger with no room above (a sticky top bar, the first row of a table).
- **`.pp-tip.at` is the required form whenever an ancestor clips or scrolls.** `.pp-print` is `overflow:hidden` and a wide table lives in `.pp-scroll`, so an absolutely positioned bubble is cut off or painted over (it is the sticky-cell problem of GAP-098 again). `.at` places the bubble in the window from the trigger's rect: the app passes `--pp-tip-x` and `--pp-tip-y` (the trigger's left/top, or its right/bottom with `.end`/`.down`) and every length — the offset, the flip, the maximum width — stays in `bundle.css`. The anchored form (`.pp-anchor>.pp-tip`) is for a trigger in plain page flow and for the previews.
- The app measures the same way Popover does and decides each axis on its own. A bubble is at most 240px wide, so on a 360px phone there is always a side that fits.

**No delay (2.2, GAP-110).** The system's tooltip exists to explain a glyph the reader does not know yet, and 400ms of nothing is 400ms of not knowing. It appears **immediately** on hover and on focus, and disappears immediately. An `opacity var(--motion-fast)` fade is allowed and must not delay the start; under `prefers-reduced-motion` the duration tokens are already 0ms. Hover intent is not our problem to solve: a tooltip that costs nothing to show costs nothing to show by accident.

**Name or description (2.2, GAP-110 — the implementer's question, confirmed).** The rule is which of the two the bubble is:

- **The bubble is the trigger's name.** An icon-only control or a graphic whose `aria-label` carries exactly what the bubble shows: the bubble is a second rendering of the name, so it is `aria-hidden="true"` and there is **no `aria-describedby`**. A screen reader reads the name once. This is the missing-file icons on a print card (`role="img"` with the sentence as `aria-label`) and most icon buttons. It also means the group drops the `title` attribute 2.1 gave it: a native `title` tooltip beside a real bubble is the same text twice, 400ms apart.
- **The bubble adds something the name does not.** "Voeg eerst een printerprofiel toe voor stroomkosten." on a control named "Stroomkosten": then `aria-describedby` points at the `role="tooltip"` bubble, which is **not** `aria-hidden`, and the bubble must not repeat the name.

Never both, and never a bubble that is neither (if the text is worth showing it is worth exposing). **A non-focusable trigger keeps its tooltip pointer-only, deliberately:** the missing-file group is a graphic, not a control, and we do not add a tab stop inside a stretched card link on every card that is missing a file. Its words live on the print detail — the worded chip and the sentence in "Deze print" — which is the path that teaches the icons anyway.

**2.3.** (2026-10-08) **`.at` resets the edges it does not use, and it does not live in an anchor (GAP-114, resolved).** Measured in the app: `.pp-anchor > .pp-tip` sets `bottom`, `.pp-tip.at` sets `position: fixed` with `top`, both selectors weighed two classes, so `bottom` survived — and a fixed box with both edges set is sized between them. The bubble collapsed to its own padding: **8px where its text needs 24.** My mistake, the same shape as the 302px panel squeezed to 18px in GAP-112, from the other side.

Two changes in `bundle.css`, because either alone leaves a hole:

- **`.pp-tip.at` now sets `right: auto; bottom: auto`.** A window-placed bubble is placed by two edges and must disown the other two.
- **The anchored rules are wrapped in `:where()`**, so they carry no specificity. `.pp-anchor.end > .pp-tip` weighed *three* classes and beat `.pp-tip.at` outright, so an `.at` bubble inside an `.end` or `.down` anchor lost its x or its y as well — resetting `bottom` would not have saved it.

**May an `.at` bubble sit inside a `.pp-anchor`? No.** The anchor exists to be a panel's offset parent, and a window-placed panel has no offset parent; the two forms are alternatives, never layers. The CSS no longer *depends* on that being obeyed, which is the point of fixing it twice.

**But the anchor was doing a second job, and that one is real.** Inside a stretched card or row link (`.pp-rowlink::after`, `.pp-cust-name::after` cover the whole tile) a trigger must be raised or it cannot be hovered or clicked at all — which is how the chip became unhoverable for one build when the anchor was taken away. That job now has its own name: **`.pp-lift`** (`position: relative`, `z-raised`) on the trigger or its wrapper. It is the general form of the `.pp-cust .end .pp-anchor` and `.pp-table td .pp-anchor` rules that were doing it by hand. The placeholder built around this gap is confirmed in substance: a plain wrapper that is not an anchor, lifted above the stretched link — it just gets a class instead of a local rule.

**Drawn:** the `.at.down` bubble crossing the edge of a clipping card, `.at.end` hanging from a right-hand trigger, and `.pp-lift` under a stretched card link — in the preview, inside a `.pp-device`, where the device frame is the window (`.pp-device .pp-tip.at` is `absolute`, so a preview measures against the frame instead of escaping to the page).
