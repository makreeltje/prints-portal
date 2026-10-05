# Design gaps

The log of everything the design system does not (yet) cover. Claude Code adds entries here and stops work on the affected UI. You take the open entries to Claude's Design System (see `FEEDBACK_PROMPT.md`), export a new version, and Claude Code resolves them.

**Status** goes in the heading so scripts can read it:
- `[open]`: waiting for the design system;
- `[resolved in vX.Y]`: implemented from that version;
- `[wontfix]`: decided not to do it.

Only `[open]` gaps may be referenced with a `ds-gap: GAP-###` comment in code.

---

## Template (copy below this line; don't fill in the template itself)

```
## GAP-### [open] <short title>
- **Type:** missing token | missing component | missing state | missing screen | unclear spec | conflict | suspected design bug | improvement idea
- **Found while:** <task / screen / component>
- **Where needed:** <screen(s), component(s), file(s)>
- **What is missing or wrong:** <precise description; include the exact value or behaviour needed>
- **Why it matters:** <user impact: e.g. contrast fails AA, state not designed, layout breaks at 360 px>
- **Proposal:** <what Claude Code would suggest, using existing tokens where possible>
- **Blocked:** <what can't be built until this is resolved>
- **Temporary placeholder approved:** no | yes (by <name>, <date>), lines marked `ds-gap: GAP-###`
- **Design system version:** <value of design-system/VERSION when found>
```

---

## Entries

<!-- Newest at the bottom. Never renumber. -->

## GAP-001 [open] No screen designs, screen copy or invoice layout
- **Type:** missing screen
- **Found while:** importing design system v1.0
- **Where needed:** every page: Login, app shell, Dashboard, Print detail, invoice export dialog, Openstaand, Deel-links, Toegang, Gebruikers, Instellingen, API-docs, public share page, the A4 invoice and reminder PDF, and system states (error, 403, offline, first run).
- **What is missing or wrong:** the export has no `screens/` folder. `copy-deck.md` says "Component copy only; screen copy is added with the screens". There is no design for the PDF invoice or reminder.
- **Why it matters:** without them, page layouts, page-level Dutch copy and the invoice would have to be improvised.
- **Proposal:** export the screens (light/dark × phone/desktop), the screen copy and the invoice/reminder layout as v1.1.
- **Blocked:** page layouts and the invoice PDF. Components, tokens and all backend work can go ahead.
- **Temporary placeholder approved:** no
- **Design system version:** 1.0

## GAP-002 [resolved by checker change] User-chosen colours and component variables conflict with the checker
- **Type:** conflict
- **Found while:** importing design system v1.0
- **Where needed:** TagChip (`--tag`, `--tag-ink`), SpoolSwatch, PrintCard thumbnail, AssetListItem, SpoolPicker (`--c1`, `--c2`); controls using `--pp-control-h` and `--pp-tap`.
- **What is missing or wrong:**
  - The components take the user's tag and spool colours through per-element custom properties set in a `style` attribute (e.g. `style="--tag:#e0a3ff;--tag-ink:#141a33"`). `scripts/check-design-tokens.sh` rejects every inline `style={{…}}`.
  - `--pp-control-h`, `--pp-tap`, `--tag-border` are defined in `components/bundle.css`, not `tokens.css`, so the checker would report them as unknown tokens if app code uses them.
- **Why it matters:** tags and spool colours (the "only decoration" principle) can't be built without breaking the checker.
- **Proposal:** a checker change, which only the user may make (CLAUDE.md forbids Claude Code from editing it):
  1. allow `style={{ … }}` when it only sets `--tag`, `--tag-ink`, `--c1` or `--c2`;
  2. read known tokens from both `tokens.css` and `components/bundle.css`.
- **Blocked:** TagChip, SpoolSwatch, SpoolPicker, PrintCard/PrintRow colour tinting.
- **Temporary placeholder approved:** no
- **Design system version:** 1.0

## GAP-003 [resolved: tokens.css authoritative] README contradicts tokens.css about the prefers-color-scheme fallback
- **Type:** unclear spec
- **Found while:** importing design system v1.0
- **Where needed:** theme handling (app shell)
- **What is missing or wrong:** `README.md` (Colour) says "The consuming app must provide this fallback block; the generated tokens.css only has the [data-theme] blocks". But `tokens.css` already contains `@media (prefers-color-scheme: light) { :root:not([data-theme]) { … } }`.
- **Why it matters:** if the app adds its own fallback block, it would define tokens outside `tokens.css` (forbidden) and duplicate values.
- **Proposal:** treat `tokens.css` as authoritative (no app-side fallback block), and correct the README sentence in v1.1.
- **Blocked:** nothing, if the proposal is accepted.
- **Temporary placeholder approved:** no
- **Design system version:** 1.0

## GAP-004 [open] No "partially paid" payment status
- **Type:** missing state
- **Found while:** clarifying payment rules (decision: a partially paid print stays open for the remainder)
- **Where needed:** StatusBadge (payment), PaymentPanel, PrintCard, PrintRow, OutstandingGroup lines, share page, invoice/overview PDF status column.
- **What is missing or wrong:** StatusBadge defines only Betaald, Open and Afgeschreven. A print with `0 < amountPaid < price` is neither fully paid nor unpaid, and has no badge, copy or PaymentPanel state. The paid summary in PaymentPanel also has no way to show "paid € X of € Y, € Z remaining", and OutstandingGroup lines have no layout for a remaining amount next to the full price.
- **Why it matters:** showing a partially paid print as plain "Open" hides the payment that was made; showing it as "Betaald" hides money still owed.
- **Proposal:** a payment badge "Deels betaald" built from existing tokens (`unpaid` on `unpaid-tint` with a distinct Lucide icon, e.g. `circle-dashed`), copy keys `status.partiallyPaid` ("Deels betaald") and `status.remaining` ("Nog {amount} open"), a PaymentPanel state that shows paid amount, date and remaining amount, and an OutstandingGroup line variant that shows the remaining amount as the line total.
- **Blocked:** the visual for partially paid prints in all listed components. Backend logic (remaining amount, outstanding totals) is not blocked.
- **Temporary placeholder approved:** no
- **Design system version:** 1.0
