SegmentedControl toggles between two to four exclusive views, mainly Kaarten and Lijst on the dashboard.

**Anatomy.** Pill track (`surface-2`) with buttons; selected segment is a `surface` pill with `shadow-sm`. Icons plus labels; labels collapse to icons at 480px and below (keep `aria-label`).

**Tokens.** `surface-2`, `surface`, `text-strong`, `muted`, `radius-pill`, `shadow-sm`.

**States.** Default, hover, selected, focus-visible, disabled.

**Accessibility.** Group is `role="group"` with `aria-label`; each button uses `aria-pressed`. The choice is remembered per user.

**Dutch copy.** Kaarten, Lijst, "Weergave".

**2.15. The track is drawn in `border-strong` (GAP-169's system half).** The pill track was
`1px solid var(--border)`, which measures **1.37:1** on `surface` in dark and **1.42:1** in light —
and that hairline is the only thing that says where this control begins and ends. The selected
segment is a `surface` pill on a `surface-2` track, two grounds 1.13:1 apart, so without the track
there is no boundary at all; what carries the selection is the text (`text-strong` against `muted`,
both above 4.5:1) and the pill's `shadow-sm`. WCAG 1.4.11 asks 3:1 of the boundary that identifies a
control, so the track is now **`border-strong`** (3.75 dark / 4.29 light on `surface`). No other
token, size or state changes, and nothing in the markup moves.

**The segmented look on routes is one place, and it is not this component.** The guest head bar's two
destinations use the same idiom and must stay links — `<nav aria-label>` with
`<a aria-current="page">`, never `aria-pressed`, `role="group"` or `role="tablist"` — so they have
their own class, `.pp-guestnav` (AppShell 2.15, ScreenShareSession 2.15). **A SegmentedControl is
`aria-pressed` buttons that switch a view in place; a nav is links that change the URL.** If a third
place ever wants the look, ask for one shared class rather than copying either; do not lend the ARIA.
