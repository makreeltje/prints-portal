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

## GAP-001 [resolved in v1.1] No screen designs, screen copy or invoice layout
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

## GAP-004 [resolved in v1.1] No "partially paid" payment status
- **Type:** missing state
- **Found while:** clarifying payment rules (decision: a partially paid print stays open for the remainder)
- **Where needed:** StatusBadge (payment), PaymentPanel, PrintCard, PrintRow, OutstandingGroup lines, share page, invoice/overview PDF status column.
- **What is missing or wrong:** StatusBadge defines only Betaald, Open and Afgeschreven. A print with `0 < amountPaid < price` is neither fully paid nor unpaid, and has no badge, copy or PaymentPanel state. The paid summary in PaymentPanel also has no way to show "paid € X of € Y, € Z remaining", and OutstandingGroup lines have no layout for a remaining amount next to the full price.
- **Why it matters:** showing a partially paid print as plain "Open" hides the payment that was made; showing it as "Betaald" hides money still owed.
- **Proposal:** a payment badge "Deels betaald" built from existing tokens (`unpaid` on `unpaid-tint` with a distinct Lucide icon, e.g. `circle-dashed`), copy keys `status.partiallyPaid` ("Deels betaald") and `status.remaining` ("Nog {amount} open"), a PaymentPanel state that shows paid amount, date and remaining amount, and an OutstandingGroup line variant that shows the remaining amount as the line total.
- **Blocked:** the visual for partially paid prints in all listed components. Backend logic (remaining amount, outstanding totals) is not blocked.
- **Temporary placeholder approved:** no
- **Design system version:** 1.0

## GAP-005 [resolved in v1.1] Per-slot filament usage (multi-colour prints)
- **Type:** missing state
- **Found while:** clarifying requirements before milestone planning
- **Where needed:** AssetListItem, SpoolPicker trigger, CostBreakdown sub-rows, PrintCard/PrintRow thumbnail tint, SpoolSwatch
- **What is missing or wrong:** A multi-colour G-code (e.g. 1.65 g from slot 2 and 1.38 g from slot 4) uses several spools. AssetListItem has exactly one spool per file. There is no layout for several slot rows (slot number, grams, slicer colour, spool per slot). SpoolSwatch says colours come from Spoolman; there is no rule for showing the slicer's slot colour when no spool is assigned, which is also the agreed thumbnail tint fallback.
- **Why it matters:** Multi-colour prints are common since the user started using the CFS; one spool per file gives wrong material cost.
- **Proposal:** Under each G-code/plate in AssetListItem, one indented sub-row per used slot: "Slot 2", grams, a SpoolSwatch (slicer colour shown as a swatch with a "slicer" hint when no spool is assigned) and its own SpoolPicker trigger. Single-slot files keep the current one-line layout. CostBreakdown already allows indented sub-rows.
- **Blocked:** Per-slot UI in the asset list and the slicer-colour swatch. Backend per-slot data and cost are not blocked.
- **Temporary placeholder approved:** no
- **Design system version:** 1.0

## GAP-006 [resolved in v1.1] "Aantal keer geprint" (times printed) per file
- **Type:** missing state
- **Found while:** clarifying requirements before milestone planning
- **Where needed:** AssetListItem (G-code and 3MF plate rows), CostBreakdown sub-rows
- **What is missing or wrong:** Each counted G-code or 3MF plate gets a times-printed count (default 1) that multiplies grams, time and cost. AssetListItem has no field, copy or compact NumberInput placement for it, and CostBreakdown has no way to show "× 2".
- **Why it matters:** Without it the user has to copy G-code files to record a reprint.
- **Proposal:** A compact NumberInput (min 1, step 1, label "Aantal keer geprint") next to the exclude toggle; the meta line shows "× 2" when the count is above 1; CostBreakdown sub-row calculation text "2 × 87 g × € 22,50/kg". Copy keys: asset.timesPrinted "Aantal keer geprint", asset.timesPrintedShort "× {count}".
- **Blocked:** The times-printed control and its display. Backend field and cost math are not blocked.
- **Temporary placeholder approved:** no
- **Design system version:** 1.0

## GAP-007 [resolved in v1.1] Duplicate file warning
- **Type:** missing state
- **Found while:** clarifying requirements before milestone planning
- **Where needed:** AssetListItem, print detail header, possibly PrintCard/PrintRow
- **What is missing or wrong:** Files in the same project with the same size and identical slicer metadata are flagged as probable duplicates (also for existing copies such as "… copy 2.gcode", so the user can clean up folders). There is no badge, copy or hint text for it.
- **Why it matters:** The user needs to see which copies to replace with "Aantal keer geprint".
- **Proposal:** A `warning` StatusBadge "Mogelijk dubbel" (icon `copy`) on the affected AssetListItem rows with a tooltip "Zelfde bestand als {fileName}. Gebruik liever Aantal keer geprint." Copy keys: asset.duplicate, asset.duplicateHint.
- **Blocked:** Showing the warning. Detection logic in the backend is not blocked.
- **Temporary placeholder approved:** no
- **Design system version:** 1.0

## GAP-008 [resolved in v1.1] 3MF plates as separate rows
- **Type:** missing state
- **Found while:** clarifying requirements before milestone planning
- **Where needed:** AssetListItem, CostBreakdown sub-rows, Viewer3D/thumbnail selection
- **What is missing or wrong:** A sliced 3MF (e.g. Creality Print) can contain several embedded G-codes, one per plate. Each plate gets its own row with exclude toggle, slots/spools and times printed. AssetListItem has no nested plate rows and no copy for "plaat".
- **Why it matters:** Older projects have no loose G-code; their cost lives in the 3MF plates.
- **Proposal:** Indented child rows under the 3MF row, named "plaat {n}" with the plate thumbnail (16px) instead of a type icon, same controls as a G-code row. Copy key: asset.plate "Plaat {n}".
- **Blocked:** Plate rows in the asset list. Backend plate parsing is not blocked.
- **Temporary placeholder approved:** no
- **Design system version:** 1.0

## GAP-009 [resolved in v1.1] Manual inputs for price per kg, grams and print time
- **Type:** missing component
- **Found while:** clarifying requirements before milestone planning
- **Where needed:** Print detail (CostBreakdown or a new editor), AssetListItem / slot rows
- **What is missing or wrong:** Editors can enter a price per kg per print, file or slot ("Handmatig"), and override grams and print time for a print whose files are incomplete. CostBreakdown shows the Handmatig source but no component defines how to enter or clear these values.
- **Why it matters:** Without Spoolman, or for legacy projects like those sliced before separate G-code files, cost is otherwise unknown or too low.
- **Proposal:** An "Aanpassen" ghost button in CostBreakdown opening a small Dialog with NumberInputs "Prijs per kg (€)", "Gewicht (g)", "Printtijd" and a "Terug naar berekend" action; overridden values show the Handmatig badge.
- **Blocked:** Manual-entry UI. Backend fields and precedence (Spoolman > handmatig > standaard per materiaal) are not blocked.
- **Temporary placeholder approved:** no
- **Design system version:** 1.0

## GAP-010 [resolved in v1.1] "Niet factureren" customers
- **Type:** missing state
- **Found while:** clarifying requirements before milestone planning
- **Where needed:** Settings (customer list), PrintCard, PrintRow, print detail, PaymentPanel, share page
- **What is missing or wrong:** A customer can be flagged "niet factureren" (own prints). Their prints keep cost but have no Verkoopprijs, payment panel, Openstaand or invoices. There is no settings control, no badge and no PaymentPanel/PrintCard state for this.
- **Why it matters:** Without a visible state, missing price and payment controls look like a bug.
- **Proposal:** A neutral StatusBadge "Niet factureren" (icon `receipt`) replacing the payment badge; PrintCard shows total cost (labelled "Kosten") instead of a price; PaymentPanel is replaced by a one-line note "Deze klant wordt niet gefactureerd."; a Toggle per customer in Instellingen. Copy keys: status.notBilled, pay.notBilledNote.
- **Blocked:** All UI for the flag. Backend flag and its effect on queries is not blocked.
- **Temporary placeholder approved:** no
- **Design system version:** 1.0

## GAP-011 [resolved in v1.1] Write-off states in PaymentPanel
- **Type:** missing state
- **Found while:** clarifying requirements before milestone planning
- **Where needed:** PaymentPanel, StatusBadge, OutstandingGroup
- **What is missing or wrong:** Decided rules: a line can be written off (Afschrijven), a partially paid print only for its remainder, and an Admin can undo a write-off with confirmation. PaymentPanel has no written-off state (amount written off, by whom, when, reason) and no "Afschrijving ongedaan maken" action; copy for the reason field and undo is missing.
- **Why it matters:** Admins need to see and reverse write-offs; partial write-off needs both paid and written-off amounts visible.
- **Proposal:** PaymentPanel written-off summary like the paid summary: Afgeschreven badge, amount, date, reason, and a ghost "Afschrijving ongedaan maken" (admin only, ConfirmDialog). Afschrijven dialog gets an optional Textarea "Reden". Copy keys: pay.writeOffReason, pay.undoWriteOff, confirm.undoWriteOff.
- **Blocked:** Write-off display and undo UI. Backend is not blocked.
- **Temporary placeholder approved:** no
- **Design system version:** 1.0

## GAP-012 [resolved in v1.1] Invoice register, finalise step and credit notes
- **Type:** missing screen
- **Found while:** clarifying requirements before milestone planning
- **Where needed:** New page "Facturen", invoice export dialog, print detail
- **What is missing or wrong:** Decided: concept downloads are unnumbered; "Definitief maken" assigns YYYY-NNN, stores PDF and snapshot and locks the lines; credit notes are negative invoices in the same sequence. GAP-001 lists the export dialog but there is no screen for the list of final invoices and credit notes, no copy for Concept/Definitief/Creditnota, and no locked-line indication on a print.
- **Why it matters:** Without it the user cannot find, re-download or credit a final invoice.
- **Proposal:** A "Facturen" page (table: nummer, klant, datum, bedrag, type Factuur/Creditnota, download), a "Definitief maken" ConfirmDialog naming customer, count and amount, and an info badge "Op factuur {number}" on locked prints. Copy keys for Concept, Definitief maken, Creditnota, Op factuur {number}.
- **Blocked:** Invoice register UI and finalise/credit flows in the UI. Backend and the placeholder PDF (GAP-001) are not blocked.
- **Temporary placeholder approved:** no
- **Design system version:** 1.0

## GAP-013 [open] Deel-link for "niet factureren" customers
- **Type:** conflict
- **Found while:** importing design system v1.1
- **Where needed:** ScreenShareLinks (create dialog), ScreenSharePage, DocOverview, copy deck
- **What is missing or wrong:** v1.1 says a klant flagged Niet factureren cannot get a Deel-link (the create dialog disables Maken with an info alert). The owner decided the opposite: such a klant may get a link that shows the print list only. The share page and Overzicht have no variant without prices, payment status and PDF buttons.
- **Why it matters:** The owner wants to share print overviews with non-billed klanten (e.g. family) without showing any amount.
- **Proposal:** Remove the disabled state from the create dialog. Add a share-page variant for niet-factureren klanten: table columns Print, Project, Datum only; no amount column, no payment badges, no PDF buttons; an intro line such as "Hier zie je de prints die voor je gemaakt zijn." Copy keys share.notBilledIntro and the variant name.
- **Blocked:** Creating links for niet-factureren klanten in the UI and the share-page variant. Backend (link allowed, no prices returned) is not blocked.
- **Temporary placeholder approved:** no
- **Design system version:** 1.1

## GAP-014 [open] "Nooit" as share-link expiry
- **Type:** conflict
- **Found while:** importing design system v1.1
- **Where needed:** ScreenShareLinks (create dialog), ShareLinkRow, copy deck
- **What is missing or wrong:** v1.1 offers only Over 7 / 30 / 90 dagen and states that Nooit is not offered. The owner decided that a link may never expire.
- **Why it matters:** Family members and regular klanten use one long-lived link.
- **Proposal:** Add a fourth option "Nooit" to Verloopt; ShareLinkRow shows "Verloopt niet" in `muted` instead of a date. Copy keys share.expiresNever ("Nooit") and share.noExpiry ("Verloopt niet").
- **Blocked:** The Nooit option in the create dialog and its display in ShareLinkRow. Backend (nullable expiry) is not blocked.
- **Temporary placeholder approved:** no
- **Design system version:** 1.1
