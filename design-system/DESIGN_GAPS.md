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

## GAP-013 [resolved in v1.2] Deel-link for "niet factureren" customers
- **Type:** conflict
- **Found while:** importing design system v1.1
- **Where needed:** ScreenShareLinks (create dialog), ScreenSharePage, DocOverview, copy deck
- **What is missing or wrong:** v1.1 says a klant flagged Niet factureren cannot get a Deel-link (the create dialog disables Maken with an info alert). The owner decided the opposite: such a klant may get a link that shows the print list only. The share page and Overzicht have no variant without prices, payment status and PDF buttons.
- **Why it matters:** The owner wants to share print overviews with non-billed klanten (e.g. family) without showing any amount.
- **Proposal:** Remove the disabled state from the create dialog. Add a share-page variant for niet-factureren klanten: table columns Print, Project, Datum only; no amount column, no payment badges, no PDF buttons; an intro line such as "Hier zie je de prints die voor je gemaakt zijn." Copy keys share.notBilledIntro and the variant name.
- **Blocked:** Creating links for niet-factureren klanten in the UI and the share-page variant. Backend (link allowed, no prices returned) is not blocked.
- **Temporary placeholder approved:** yes (by the owner, 2026-10-05), lines marked `ds-gap: GAP-013`
- **Design system version:** 1.1

## GAP-014 [resolved in v1.2] "Nooit" as share-link expiry
- **Type:** conflict
- **Found while:** importing design system v1.1
- **Where needed:** ScreenShareLinks (create dialog), ShareLinkRow, copy deck
- **What is missing or wrong:** v1.1 offers only Over 7 / 30 / 90 dagen and states that Nooit is not offered. The owner decided that a link may never expire.
- **Why it matters:** Family members and regular klanten use one long-lived link.
- **Proposal:** Add a fourth option "Nooit" to Verloopt; ShareLinkRow shows "Verloopt niet" in `muted` instead of a date. Copy keys share.expiresNever ("Nooit") and share.noExpiry ("Verloopt niet").
- **Blocked:** The Nooit option in the create dialog and its display in ShareLinkRow. Backend (nullable expiry) is not blocked.
- **Temporary placeholder approved:** yes (by the owner, 2026-10-05), lines marked `ds-gap: GAP-014`
- **Design system version:** 1.1

## GAP-015 [resolved in v1.2] AppShell has no responsive CSS for tablet rail, phone layout and drawer
- **Type:** missing component
- **Found while:** M1, implementing AppShell
- **Where needed:** AppShell (every operator page), and every screen that relies on the `.phone` context class (e.g. `.phone .pp-stats`)
- **What is missing or wrong:** `bundle.css` styles the sidebar (`.pp-app`, `.pp-side`, `.pp-nav`) and the phone parts (`.pp-phone-top`, `.pp-phone-main`, `.pp-bottomnav`) separately, but nothing switches between them: there is no media query for the 480px and 900px breakpoints on `.pp-app`. The 56px tablet icon rail has no class. The 280px phone drawer in `AppShell/preview.html` is built from inline styles, not classes. Phone variants of screens hang off `.pp-device.phone`, a preview-only container with a fixed 360px width. App code may not add raw lengths, breakpoints or inline styles, so it cannot build any of this itself.
- **Why it matters:** without it the app shows the desktop sidebar on phones, which breaks the "no horizontal scroll" rule and the 44px touch targets.
- **Proposal:** add to `bundle.css`: (1) `@media (max-width:900px)` rules that turn `.pp-side` into a 56px icon rail (labels visually hidden, tooltips), (2) `@media (max-width:480px)` rules that hide `.pp-side` and show `.pp-phone-top` and `.pp-bottomnav` inside `.pp-app`, (3) `.pp-drawer` and `.pp-drawer-backdrop` classes for the 280px drawer, (4) an app-level phone context: either a documented `.phone` class the app sets on `.pp-app` at 480px and below, or media-query versions of the `.phone …` rules.
- **Blocked:** the AppShell rail, phone layout and drawer. The desktop sidebar and all page content are not blocked.
- **Temporary placeholder approved:** yes (by the owner, 2026-10-05), lines marked `ds-gap: GAP-015`
- **Design system version:** 1.1

## GAP-016 [resolved in v1.2] No line-height tokens or base page typography
- **Type:** missing token
- **Found while:** M1, page base styles
- **Where needed:** `body` and any running text outside a component (page intros, help text in screens)
- **What is missing or wrong:** README sets body text to 15px/22px (`body` style) and lists text styles such as `body-sm`, `caption`, `heading-2xl`, but `tokens.css` only has font sizes (`--text-*`); line heights exist only as raw values inside `bundle.css` rules. App code may not write `22px`, so `body` currently uses the browser default line-height.
- **Why it matters:** running text outside components gets a different rhythm than the design, and every screen would otherwise need its own raw line-height.
- **Proposal:** add line-height tokens (e.g. `--leading-xs` 16px, `--leading-sm` 20px, `--leading-base` 22px, `--leading-lg` 26px …) or composite text-style tokens (`--type-body: 400 var(--text-base)/22px var(--font-sans)`), plus a documented base rule for `body`.
- **Blocked:** body line-height. No component is affected.
- **Temporary placeholder approved:** no
- **Design system version:** 1.1

## GAP-017 [resolved in v1.2] Raw sizes in the login and system-state layouts
- **Type:** missing token
- **Found while:** M4, building ScreenLogin and the 403 state
- **Where needed:** ScreenLogin (`/login`), ScreenSystemStates (403, error, first run), ScreenUsers (role select)
- **What is missing or wrong:** the previews size things with inline raw values that have no token or class: login card `max-width:380px` and `gap:16px`; state pages `h1` at `650 22px/28px` (no 22px size token; `--text-xl` is 20px, `.pp-ph h1` is 24px/32px) and text `max-width:36ch`/`44ch`; the role select `width:130px`; ConfirmDialog panels `max-width:380px` (the `.pp-dialog` class is 440px). App code may not write these values.
- **Why it matters:** without a class or token the login card stretches across a desktop screen and the state headings get a size that differs from the design.
- **Proposal:** add classes to `bundle.css`: `.pp-auth` (centred card, max width 380px, `gap: var(--space-4)`), `.pp-state` (centred column, `h1` at the 22px/28px style, paragraph max 36ch) and a width modifier for compact selects; or size tokens for them. Temporary placeholder: login card `max-width: calc(var(--space-8) * 9.5)` (= 380px), state headings use `.pp-ph h1`, role select without a fixed width.
- **Blocked:** the login card width and the state-page heading size. Everything else on those screens is not blocked.
- **Temporary placeholder approved:** no
- **Design system version:** 1.1

## GAP-018 [resolved in v1.2] Local sign-in by name or by e-mail address
- **Type:** conflict
- **Found while:** M4, ScreenUsers create dialog
- **Where needed:** ScreenUsers ("Gebruiker maken" dialog), ScreenLogin, copy deck
- **What is missing or wrong:** the create dialog label is "E-mailadres of naam" (preview value `helper2`), so a local user may have a plain name. The login form only offers "E-mailadres" (`auth.email`), so such a user would type a name into an e-mail field.
- **Why it matters:** decides what a local user signs in with and what the backend stores and validates.
- **Proposal:** accept either: the login field becomes "E-mailadres of naam" (copy key `auth.identifier`), `type="text"`, `autocomplete="username"`. Backend stores a lower-cased login name that may be an e-mail address or a name.
- **Blocked:** the "Gebruiker maken" dialog's identifier field and the login field label. The backend currently requires an e-mail address.
- **Temporary placeholder approved:** no
- **Design system version:** 1.1

## GAP-019 [resolved in v1.2] Choosing your own password after a temporary one
- **Type:** missing screen
- **Found while:** M4, ScreenUsers create dialog
- **Where needed:** after local sign-in with a temporary password; ScreenUsers ("Wachtwoord resetten")
- **What is missing or wrong:** the dialog's help text says "De gebruiker kiest bij de eerste keer inloggen een eigen wachtwoord.", but there is no screen, state or copy for choosing a new password, and "Wachtwoord resetten" has no dialog design (does the admin type a new temporary password?).
- **Why it matters:** without it a temporary password stays the user's password forever, and the help text promises something that does not happen.
- **Proposal:** (1) after signing in with a temporary password, show a card like ScreenLogin with heading "Nieuw wachtwoord kiezen", fields "Nieuw wachtwoord" and "Herhaal wachtwoord" (`autocomplete="new-password"`), button "Opslaan", errors "Kies een wachtwoord van minstens 12 tekens." and "De wachtwoorden zijn niet gelijk."; nothing else is reachable until it is done. (2) "Wachtwoord resetten" opens a small Dialog with one field "Tijdelijk wachtwoord", the same help text, and Annuleren/Opslaan.
- **Blocked:** the help text in "Gebruiker maken", the "Wachtwoord resetten" dialog and the forced change. The backend can already reset a password.
- **Temporary placeholder approved:** no
- **Design system version:** 1.1

## GAP-020 [resolved in v1.2] "Rol wijzigen" on phones
- **Type:** unclear spec
- **Found while:** M4, ScreenUsers phone layout
- **Where needed:** ScreenUsers at 480px and below
- **What is missing or wrong:** the phone cards show a secondary button "Rol wijzigen" instead of the role select, but nothing says what it opens.
- **Why it matters:** the role cannot be changed on a phone without it.
- **Proposal:** use the same native role Select inside the card (as on desktop; native selects work well on phones) and drop the button; or "Rol wijzigen" opens a small Dialog with the Rol select and Annuleren/Opslaan.
- **Blocked:** changing roles on phones.
- **Temporary placeholder approved:** no
- **Design system version:** 1.1

## GAP-021 [resolved in v1.2] Editor rows in the access matrix
- **Type:** conflict
- **Found while:** M4, ScreenAccess
- **Where needed:** AccessMatrix, ScreenAccess, copy deck
- **What is missing or wrong:** the owner decided that Editors see every customer (only Users need grants). The matrix only designs Admin rows as "always access" ("Admin heeft altijd toegang."); an Editor row would look like a User row with checkboxes that do nothing.
- **Why it matters:** an Admin would tick boxes for an Editor that have no effect.
- **Proposal:** Editor rows look like Admin rows (disabled, checked, "· Editor" after the name), and the note reads "Admin en Editor hebben altijd toegang." (copy key `access.allAccessRoles`).
- **Blocked:** Editor rows in the matrix (they are left out until this is resolved). User and Admin rows are not blocked.
- **Temporary placeholder approved:** no
- **Design system version:** 1.1

## GAP-022 [resolved in v1.2] Error copy for sign-in and user management
- **Type:** missing state
- **Found while:** M4, ScreenLogin and ScreenUsers
- **Where needed:** ScreenLogin, "Gebruiker maken" dialog, copy deck
- **What is missing or wrong:** no copy for: sign-in through Authentik failed (the provider sends the browser back to `/login`); temporary password too short (the backend requires at least 12 characters); e-mail address or name already in use; the consequence sentence ConfirmDialog asks for under "Gebruiker '{name}' verwijderen?".
- **Why it matters:** these errors would otherwise show the generic "Er ging iets mis", which does not tell the user what to fix.
- **Proposal:** `auth.oidcFailed` "Inloggen met Authentik is mislukt. Probeer het opnieuw." (unpaid alert above the buttons), `error.passwordTooShort` "Kies een wachtwoord van minstens 12 tekens." (field error), `error.userExists` "Deze gebruiker bestaat al." (field error), `confirm.deleteUserBody` "Deze gebruiker kan daarna niet meer inloggen."
- **Blocked:** those messages; until then the screens show `error.generic`, and the delete confirmation shows its title only.
- **Temporary placeholder approved:** no
- **Design system version:** 1.1

## GAP-023 [resolved in v1.2.1] No class to switch tables to phone cards
- **Type:** missing component
- **Found while:** M4, moving ScreenUsers and ScreenAccess to v1.2
- **Where needed:** ScreenUsers ("Phone: one card per user"), AccessMatrix/ScreenAccess ("At 480px and below it switches to one card per user"), ScreenLogin ("On phones the card is full width with `space-4` margins"); later every screen with a table/card pair (Openstaand, Facturen, Deel-links).
- **What is missing or wrong:** v1.2 moved the app-shell breakpoints into `bundle.css`, but there is still no class that shows one block only above 480px and another only at 480px and below, and `.pp-center` keeps `space-6` padding on phones (the login preview uses an inline `padding:16px`). App code may not write its own breakpoints, so the phone cards cannot be switched in, and the login card keeps 24px margins on phones.
- **Why it matters:** on phones the Users table and the access matrix are shown as tables that scroll sideways inside their box instead of the designed cards; the login card margins differ from the design.
- **Proposal:** two utility classes in `bundle.css`, e.g. `.pp-only-wide` (hidden at 480px and below) and `.pp-only-phone` (hidden above 480px, `display:flex` column below), and `.pp-center` padding `space-4` at 480px and below. Temporary placeholder: the same two classes and padding rule in a separate app stylesheet marked `ds-gap: GAP-023`.
- **Blocked:** phone cards on Gebruikers and Toegang, and the login card's phone margins. Until then the tables scroll inside their box on phones (no horizontal page scroll).
- **Temporary placeholder approved:** no
- **Design system version:** 1.2

## GAP-024 [resolved in v1.3] Dimmed thumbnails for deleted and archived prints; row flash
- **Type:** missing state
- **Found while:** M5, PrintCard and PrintRow on the dashboard
- **Where needed:** PrintCard (`.pp-thumb`), PrintRow (row text), ScreenDashboard with "Toon verwijderde" and "Gearchiveerd tonen"
- **What is missing or wrong:** PrintCard says "Verwijderd: thumbnail at 45% opacity" and "Gearchiveerd: thumbnail at 60% opacity", but `bundle.css` has no class for it; the preview uses an inline `style="opacity:.45"`. PrintRow lists "live update flash" as a state, but only `.pp-print.flash` (cards) exists; a table row has no flash class. App code may not write raw opacity values, timings or inline styles.
- **Why it matters:** without it a deleted or archived print looks like a normal one apart from its badge.
- **Proposal:** modifier classes `.pp-print.is-deleted .pp-thumb { opacity: .45 }` and `.pp-print.is-archived .pp-thumb { opacity: .6 }` (and the same on `.pp-table tr.is-deleted, tr.is-archived` for muted row text), and `.pp-table tr.flash td` with the same `pp-flash` animation as cards. Temporary placeholder: the same rules in a separate app stylesheet marked `ds-gap: GAP-024`.
- **Blocked:** the dimmed thumbnail and the row flash in the list view. The Verwijderd/Gearchiveerd badges, Herstellen and the card flash are not blocked.
- **Owner decision (2026-10-05):** wait for the design system, no placeholder.
- **Temporary placeholder approved:** no
- **Design system version:** 1.2.1

## GAP-025 [resolved in v1.3] Customer chip row on phones
- **Type:** missing component
- **Found while:** M5, ScreenDashboard phone layout
- **Where needed:** ScreenDashboard at 480px and below ("customer strip becomes a horizontally scrolling chip row")
- **What is missing or wrong:** the phone preview builds the chips from `pp-badge` with inline `min-height:32px; padding:0 12px; font-size:13px` and a row with inline `flex-wrap:nowrap; overflow:auto`; there is no class for a tappable customer chip (selected state included) or for the scrolling row. App code may not write these values.
- **Why it matters:** on phones the customer strip would otherwise be the desktop cards stacked down the page, pushing the prints below the fold.
- **Proposal:** classes `.pp-chips` (one row, `gap: var(--space-2)`, horizontal scroll, no wrap) and `.pp-chip` (a button: `min-height: var(--pp-tap)`, `padding: 0 var(--space-3)`, `font-size: var(--text-sm)`, `radius-pill`, neutral like `pp-badge neutral`, selected like `pp-badge info` with `aria-pressed="true"`). Temporary placeholder: those two classes in a separate app stylesheet marked `ds-gap: GAP-025`, shown with `pp-only-phone` while the cards use `pp-only-wide`.
- **Blocked:** the phone chip row. Until then phones show the desktop customer cards (wrapping).
- **Owner decision (2026-10-05):** wait for the design system, no placeholder.
- **Temporary placeholder approved:** no
- **Design system version:** 1.2.1

## GAP-026 [resolved in v1.3] Deleting a whole customer from the UI
- **Type:** missing state
- **Found while:** M5, ScreenDashboard customer strip
- **Where needed:** ScreenDashboard customer card (and its phone counterpart), copy deck
- **What is missing or wrong:** the plan says delete and restore work per print, per project and per whole customer, and ScreenDashboard shows "Herstellen" on a deleted customer's card, but there is no control or confirmation for deleting a customer (where it sits, its ConfirmDialog text). In this app a project is one print, so print and project delete are the same action and are covered by ScreenPrintDetail.
- **Why it matters:** removing a customer that is no longer relevant would mean deleting every print one by one.
- **Proposal:** a ghost icon button "Klant verwijderen" (trash-2) in the customer card for Admins and Editors, with a destructive ConfirmDialog "Klant '{name}' verwijderen?" and the body "Alle {count} prints van deze klant worden verborgen. De financiële gegevens blijven bewaard; een beheerder kan ze herstellen." Copy keys `customers.delete`, `confirm.deleteCustomer`, `confirm.deleteCustomerBody`.
- **Blocked:** the delete-customer control. The API (`DELETE /api/customers/:folder`) and restoring a customer from its card are not blocked.
- **Owner decision (2026-10-06, answered in the design system):** on phones, "Klant verwijderen" sits only on the customer's filtered view.
- **Temporary placeholder approved:** no
- **Design system version:** 1.2.1

## GAP-027 [resolved in v1.3] Tag editor and tag management
- **Type:** missing component
- **Found while:** M5, ScreenPrintDetail header and FilterBar
- **Where needed:** ScreenPrintDetail (tags in the header), Popover "Tags bewerken", BulkActionBar "Tags" (M6), a place to rename, recolour and delete tags
- **What is missing or wrong:** TagChip has a removable variant and an "add" chip ("Tag toevoegen"), and Popover names "Tags bewerken", but nothing specifies what the popover contains (search, existing tags, creating a new tag, choosing a colour), nor where tags are renamed, recoloured or deleted. Admins and Editors manage tags (owner decision); the API for all of it exists.
- **Why it matters:** without it tags can only be shown, never added, so the tag filter stays empty.
- **Proposal:** "Tags bewerken" popover: a search input "Zoek of maak een tag", the list of all tags as checkbox rows (checkbox + TagChip), and when the text matches no tag a last row "Tag '{name}' maken" (new tags start without colour). Tag management in Instellingen, section "Tags": one row per tag with the chip, number of prints, a colour choice (see owner decision), rename (inline TextInput) and delete (ConfirmDialog "Tag '{name}' verwijderen?" / "De tag verdwijnt van {count} prints."). Copy keys `tags.searchOrCreate`, `tags.create`, `tags.settingsTitle`, `confirm.deleteTag`, `confirm.deleteTagBody`.
- **Blocked:** adding tags to a print and managing tags. Showing tags, removing a tag from a print (removable chip) and the tag filter are not blocked.
- **Owner decision (2026-10-05):** wait for the design system, no placeholder.
- **Owner decision (2026-10-06, answered in the design system):** colour is chosen from a fixed palette plus "Geen kleur". When the typed name already exists in another case ("Kerst" vs "kerst"), the existing tag is shown and there is no "maken" row.
- **Temporary placeholder approved:** no
- **Design system version:** 1.2.1

## GAP-028 [resolved in v1.3] Missing copy: viewer fullscreen button, "1 print"
- **Type:** missing state
- **Found while:** M5, Viewer3D and the dashboard customer cards
- **Where needed:** Viewer3D (fullscreen button top-right), ScreenDashboard customer card, copy deck
- **What is missing or wrong:** the fullscreen button needs an accessible name and the copy deck has none; the customer card shows "12 prints" but a customer with one print needs the singular.
- **Proposal:** `viewer.fullscreen` "Volledig scherm", `viewer.exitFullscreen` "Volledig scherm sluiten", `customers.printCount` with ICU plural `{count, plural, one {# print} other {# prints}}`.
- **Blocked:** the fullscreen button (left out) and the singular (a customer with one print reads "1 prints" until then).
- **Owner decision (2026-10-05):** wait for the design system, no placeholder.
- **Temporary placeholder approved:** no
- **Design system version:** 1.2.1

## GAP-029 [resolved in v1.4] Popovers and menus have no stacking level
- **Type:** missing token
- **Found while:** M5 with v1.3, checking the dashboard and print detail in the browser
- **Where needed:** FilterBar "Tags" popover (ScreenDashboard), TagEditor popover above 480px (ScreenPrintDetail), later the BulkActionBar "Acties" menu and other Popovers; `frontend/src/prints/FilterBar.tsx`, `frontend/src/prints/TagEditor.tsx`
- **What is missing or wrong:** `.pp-pop` has no `z-index` and the design system has no stacking tokens (only raw values inside `bundle.css`, e.g. the phone `.pp-tagpop` at 50). An absolutely positioned popover is painted under content that comes later in the page and is itself positioned: the PrintCard (`.pp-print` is `position:relative`) covers the FilterBar Tags popover, and the Viewer3D would cover a TagEditor popover. App code may not choose a `z-index`.
- **Why it matters:** the FilterBar Tags popover is partly hidden behind the first row of print cards, so tags below the first one cannot be ticked with the mouse (keyboard still works).
- **Proposal:** stacking tokens, e.g. `--z-sticky` 10, `--z-popover` 30, `--z-overlay` 50, and `.pp-pop{position:absolute; z-index:var(--z-popover)}` (or a `.pp-pop.floating` variant). Until then the TagEditor above 480px opens in the page flow under the tags (it pushes the content down instead of floating); at 480px and below it is the design system's bottom sheet.
- **Blocked:** a floating TagEditor on desktop and a FilterBar Tags popover that is not covered by the cards. Filtering by tags still works through the keyboard and the phone Filters sheet.
- **Owner decision (2026-10-06):** wait for the design system, no placeholder.
- **Temporary placeholder approved:** no
- **Design system version:** 1.3

## GAP-030 [resolved in v1.4] CustomerCard selected state; restoring a klant on phones
- **Type:** missing state
- **Found while:** M5, implementing CustomerCard and CustomerChips from v1.3
- **Where needed:** CustomerCard (ScreenDashboard above 480px), CustomerChips toolbar (480px and below)
- **What is missing or wrong:** (1) the CustomerCard README lists the state "selected (filter active)", but `bundle.css` has no rule for it and no preview shows it. (2) On phones a deleted klant (Admins with "Toon verwijderde") has no Herstellen: the chips show no deleted state and the toolbar only has "Klant verwijderen".
- **Why it matters:** (1) above 480px nothing shows which klant card is the active filter (the FilterBar's Klant select does); (2) on phones an Admin can restore the prints one by one but not the whole klant.
- **Proposal:** (1) `.pp-cust[aria-pressed=true]` or `.pp-cust.is-selected` like `.pp-print.is-selected` (`primary` border, `primary-tint-soft` ground); (2) a deleted chip like the deleted card (muted text, the Verwijderd badge in the toolbar) and a secondary "Herstellen" button in `.pp-toolbar` instead of "Klant verwijderen" while a deleted klant is selected.
- **Blocked:** the selected look of the card and restoring a whole klant on phones. The card's name button already carries `aria-pressed`.
- **Temporary placeholder approved:** no
- **Design system version:** 1.3

## GAP-031 [resolved in v1.4] Palette colours are announced in English
- **Type:** improvement idea
- **Found while:** M5, implementing the palette (`.pp-pal`) on the Tags page
- **Where needed:** ScreenTags edit row, palette radiogroup
- **What is missing or wrong:** the ScreenTags preview gives the swatches the accessible names `rose`, `orange`, `amber`, … (the palette keys), so a screen reader says English words in a Dutch interface. The copy deck has no keys for colour names.
- **Why it matters:** screen-reader users hear inconsistent language; the vocabulary rule asks for Dutch.
- **Proposal:** copy keys `tags.colour.rose` … `tags.colour.grey`: Roze, Oranje, Amber, Limoen, Turquoise, Hemelsblauw, Blauw, Violet, Lila, Grijs.
- **Blocked:** nothing; the app uses the names from the preview until the copy exists.
- **Temporary placeholder approved:** no
- **Design system version:** 1.3

## GAP-032 [resolved in v1.4] ConfirmDialog README and copy deck differ for Klant verwijderen
- **Type:** conflict
- **Found while:** M5, implementing the delete-klant confirmation from v1.3
- **Where needed:** ConfirmDialog, `confirm.deleteCustomerBody`
- **What is missing or wrong:** the ConfirmDialog README says "Alle {count} prints van deze klant worden verborgen. De financiële gegevens blijven bewaard; een beheerder kan ze herstellen." while the copy deck key `confirm.deleteCustomerBody` reads "{count, plural, …}. De financiële gegevens blijven bewaard en een beheerder kan de klant herstellen." The same holds for "Tag verwijderen" ("De tag verdwijnt van {count} prints." vs `confirm.deleteTagBody`).
- **Why it matters:** two texts for one dialog; the copy deck is the strings file, so the app uses it.
- **Proposal:** align the README examples with the copy deck.
- **Blocked:** nothing; the app follows the copy deck.
- **Temporary placeholder approved:** no
- **Design system version:** 1.3

## GAP-033 [resolved in v1.4] Instellingen has no sections for printer profiles, tariff and material prices
- **Type:** missing screen
- **Found while:** M6 planning
- **Where needed:** ScreenSettings (`/instellingen`), section(s) next to "Prijzen"
- **What is missing or wrong:** the plan keeps printer profiles (name, aliases, timelapse prefixes, watts), the electricity tariff (€/kWh) and the default price per kg per material ("Geschat") in Instellingen, but ScreenSettings only has Standaardmarge under Prijzen. CostBreakdown already refers to them ("Geen printerprofiel, stroomkosten zijn niet meegerekend.", Tooltip "Voeg eerst een printerprofiel toe voor stroomkosten.").
- **Why it matters:** without them electricity costs stay missing (no watts) and estimated material prices cannot be set from the UI.
- **Proposal:** under Prijzen: NumberInput "Stroomtarief" (`€/kWh`), a small table "Materiaalprijzen" (Materiaal, €/kg, add and remove rows); a section "Printers" with one row per profile (Naam, Watt as NumberInput, aliases as chips), and "Printer toevoegen".
- **Blocked:** editing these values in the UI. The API (`/api/settings/pricing`, `/api/settings/printers`) is built; the K1 family is seeded and the tariff is seeded from `ELECTRICITY_TARIFF_EUR_PER_KWH`.
- **Owner decision (2026-10-06):** API now, the UI waits for the design system.
- **Owner decision (2026-10-06, asked by the design system):** tariff (€/kWh) and a "Materiaalprijzen" table (material, €/kg) under Prijzen next to Standaardmarge; a separate section "Printers" with one row per profile (name, watts, aliases).
- **Temporary placeholder approved:** no
- **Design system version:** 1.3

## GAP-034 [resolved in v1.4] Bulk dialogs for "Spoel toewijzen" and "Prijs instellen"
- **Type:** missing component
- **Found while:** M6 planning
- **Where needed:** BulkActionBar on the dashboard
- **What is missing or wrong:** BulkActionBar names the actions, but nothing specifies what opens: which spool picker for many prints (whole print or per slot), and for "Prijs instellen" whether one price applies to each print or a total is split, and how per-print results (some failed, e.g. locked or niet factureren) are shown.
- **Why it matters:** these bulk actions cannot be offered.
- **Proposal:** "Spoel toewijzen": a Dialog with the SpoolPicker that sets the spool for the whole print on every selected print; "Prijs instellen": a Dialog with one Verkoopprijs NumberInput applied to every selected print, plus "Voorstel uit marge" per print. Results: a toast "{ok} van {totaal} bijgewerkt" and, on failures, an alert listing the prints and reasons.
- **Blocked:** those two buttons. The bulk API with per-print results is built; Markeer als betaald, Tags and Verwijderen are offered.
- **Owner decision (2026-10-06):** wait for the design system.
- **Owner decision (2026-10-06, asked by the design system):** "Prijs instellen" sets the price on the newest order of each print; if that order is already paid or written off, that print fails with a reason and the others go ahead.
- **Temporary placeholder approved:** no
- **Design system version:** 1.3

## GAP-035 [resolved in v1.4] Screens for several orders in one print (Nabestelling)
- **Type:** missing screen
- **Found while:** M6, owner decision on repeat orders
- **Where needed:** ScreenPrintDetail, PaymentPanel, AssetListItem, PrintCard/PrintRow status, CostBreakdown, copy deck
- **What is missing or wrong:** the owner decided that a print can have several orders: when a klant wants more of a project or a part broke, a "Nabestelling" gets its own items (files or plates with their own times printed; the same file may be reprinted), sale price, payments, write-off and later invoice line. Order 1 is the current single order. Nothing in the design system covers: the list of orders on the detail page, a PaymentPanel and CostBreakdown per order, the "Nabestelling maken" flow (tick files, times printed per order), files that are not in any order yet (new files after order 1 was priced or paid), and how the dashboard summarises several orders (least settled status, total and open amount).
- **Why it matters:** repeat orders cannot be created or paid from the UI; new files after an order is priced do not count until they are in an order.
- **Proposal:** on the detail page a section per order ("Bestelling 1", "Nabestelling 2 · {datum}") with its items, CostBreakdown and PaymentPanel; a secondary button "Nabestelling maken" opening a Dialog with checkbox rows per file/plate and an "Aantal keer geprint" NumberInput; AssetListItem badge "Niet in een bestelling" with the hint "Nieuw bestand. Voeg het toe aan een nabestelling."; PrintCard shows the summed price and the least settled badge, with "{n} bestellingen" in the meta line.
- **Blocked:** making a Nabestelling and showing more than one order. The data model, API and status rules are built; the screens show order 1 as designed.
- **Owner decision (2026-10-06, asked by the design system):** stacked sections per order ("Bestelling 1", "Nabestelling 2 · {datum}"), newest first, each with its files, CostBreakdown and PaymentPanel; settled orders collapsed; the same on phone and desktop. A Nabestelling may be deleted by Admin and Editor while it has no payment, no write-off and (from M7) is not on an invoice; order 1 can never be deleted; its files go back to "not in an order".
- **Temporary placeholder approved:** no
- **Design system version:** 1.3

## GAP-036 [resolved in v1.4] M6 component previews still use inline sizes without tokens or classes
- **Type:** missing token
- **Found while:** M6, building PaymentPanel, CostBreakdown, CostOverrideDialog and ScreenSettings
- **Where needed:** PaymentPanel, CostBreakdown, CostOverrideDialog, ScreenSettings
- **What is missing or wrong:** the v1.3 inline audit covered the dashboard, print detail and asset list, not these previews. Most of their inline values match tokens and are built from them (amount `text-xl`, history `text-sm`, gaps `space-*`). These have no token or class: CostBreakdown slot rows indented 48px (the largest space token is 40px); PaymentPanel's written-off details use `pp-kv` with a 110px label column (the class has 140px); CostOverrideDialog's two print-time inputs are 120px wide; ScreenSettings has a reindex progress bar (8px track, inline), a logo box of 72×40 px, Klanten rows with an inline separator and padding, Bedrijfsgegevens fields in an inline two-column grid, and the Standaardmarge field limited to 200px.
- **Why it matters:** these details cannot be matched without inventing values.
- **Proposal:** a `space-9` (48px) token or a `.pp-cost tr.slot` rule; a `.pp-kv.narrow` variant; `.pp-time` for the two time inputs; `.pp-progress` (track and bar); `.pp-logo-box`; `.pp-setrow` for settings list rows.
- **Blocked:** those details only. Until then: slot rows are indented like file rows, `pp-kv` keeps its 140px column, the time inputs keep their normal width, the reindex shows a spinner and "Klaar." instead of a progress bar, Klanten rows have no separators, the Bedrijfsgegevens fields are in one column and the Standaardmarge field is full width. The logo upload is M7.
- **Owner decision (2026-10-06):** wait for the design system, no placeholder.
- **Temporary placeholder approved:** no
- **Design system version:** 1.3


## GAP-037 [resolved in v1.5] Invoice PDF payment sentence without IBAN or with nothing open
- **Type:** unclear spec
- **Found while:** M7, rendering the Factuur, Concept and Herinnering PDFs (DocInvoice, DocReminder)
- **Where needed:** `backend/src/finance/pdf.ts` (footer of Factuur, Concept and Herinnering)
- **What is missing or wrong:** the footer always reads "Graag € {bedrag} overmaken naar IBAN {iban} t.n.v. {naam}, onder vermelding van {referentie}." The spec does not say what to print when (a) Bedrijfsgegevens has no IBAN or name yet, or (b) the invoice is fully paid (a full invoice includes paid prints, so Openstaand can be € 0,00).
- **Why it matters:** the klant would read "Graag € 0,00 overmaken" or "naar IBAN  t.n.v. ,".
- **Proposal:** (a) refuse "Definitief maken" until name and IBAN are filled in (Concept still works, without the sentence); (b) with nothing open, replace the sentence with "Deze factuur is volledig betaald."
- **Blocked:** nothing else; the PDFs follow the spec literally until this is decided.
- **Owner decision (2026-10-06):** wait for the design system, no placeholder.
- **Temporary placeholder approved:** no
- **Design system version:** 1.3

## GAP-038 [resolved in v1.5] v1.4 export: 18 component READMEs contain only their 1.4 paragraph
- **Type:** suspected design bug
- **Found while:** importing design system v1.4
- **Where needed:** README.md of AssetListItem, BulkActionBar, ConfirmDialog, CostBreakdown, CostOverrideDialog, CustomerChips, FilterBar, MoneyDisplay, PaymentPanel, PrintCard, PrintRow, ScreenDashboard, ScreenInvoiceExport, ScreenInvoices, ScreenOutstanding, ScreenPrintDetail, SpoolPicker, TagEditor
- **What is missing or wrong:** each of these files now holds only the new "1.4" paragraph (e.g. "**Inline values (1.4).** …"); the anatomy, tokens, states, accessibility and Dutch copy from 1.3 are gone. The changelog says these components were changed, not rewritten.
- **Why it matters:** the specs the screens are built from (and checked against) are incomplete.
- **Proposal:** read each as the 1.3 README plus the 1.4 paragraph (the 1.4 text amends the 1.3 text where they differ); ask Claude's Design System to re-export the full READMEs in the next version.
- **Blocked:** reading these specs as complete; nothing else if the proposal is accepted.
- **Owner decision (2026-10-06):** use the proposal (1.3 README plus the 1.4 paragraph) until a re-export.
- **Temporary placeholder approved:** no (no placeholder needed: it is how the specs are read)
- **Design system version:** 1.4

## GAP-039 [resolved in v1.5] `pp-text-xl`, `pp-text-lg` and `pp-text-2xl` are used in previews but not defined
- **Type:** suspected design bug
- **Found while:** implementing GAP-036 from v1.4
- **Where needed:** PaymentPanel amount (`<span class="pp-money pp-text-xl">`), `frontend/src/finance/PaymentPanel.tsx`
- **What is missing or wrong:** `components/bundle.css` defines `pp-text-xs`, `pp-text-sm` and `pp-text-md`, but not `pp-text-xl` (PaymentPanel amount), `pp-text-lg` (OutstandingGroup header total) or `pp-text-2xl` (ScreenOutstanding phone stat values).
- **Why it matters:** the class has no effect; the amount would render at body size.
- **Proposal:** add `.pp-text-lg`, `.pp-text-xl` and `.pp-text-2xl` (each `font-size` and `line-height` from the matching tokens) to `bundle.css`. The app keeps its existing M6 `app-money-lg` rule for the PaymentPanel amount; the Openstaand totals use the class names and render at their default size until the classes exist.
- **Blocked:** nothing.
- **Temporary placeholder approved:** no (the existing token-only rule from M6 stays)
- **Design system version:** 1.4

## GAP-040 [resolved in v1.5] Where "Spoel voor de hele print" goes on the print detail with orders
- **Type:** unclear spec
- **Found while:** implementing GAP-035 (OrderSection on ScreenPrintDetail)
- **Where needed:** ScreenPrintDetail, `frontend/src/prints/PrintDetailPage.tsx`
- **What is missing or wrong:** in 1.3 the "Spoel voor de hele print" card sat in the right column above CostBreakdown. The 1.4 orders variant puts the viewer full width and gives each OrderSection its own files, costs and payment, but does not show the print-level spool card anywhere. The spool belongs to the print, not to one order.
- **Why it matters:** without a place, the whole-print spool cannot be set (files and slots keep their own pickers).
- **Proposal:** a `pp-card pp-sec` between the viewer and the "nieuw bestand" alert, full width, as in 1.3 (title, SpoolPicker, help).
- **Also unclear:** files that never count (STL, video, PDF, links) have no order; the app lists them in Bestelling 1's Bestanden. Files in no order are listed under the label "Nog niet in een bestelling" in a card after the alert (as in the AssetListItem preview).
- **Blocked:** the placement only; the card works as before.
- **Owner decision (2026-10-07):** wait for the design system. Until then the whole-print spool card is not shown (files and slots keep their own pickers); files without lines stay listed with Bestelling 1 so they can still be downloaded.
- **Temporary placeholder approved:** no
- **Design system version:** 1.4

## GAP-041 [resolved in v1.5] Openstaand: "Markeer als betaald" per line asks an amount, but there is no dialog
- **Type:** missing component
- **Found while:** M7, building ScreenOutstanding
- **Where needed:** ScreenOutstanding / OutstandingGroup line action, `frontend/src/finance/OutstandingPage.tsx`
- **What is missing or wrong:** the README says the line action "asks the amount, default the remainder", but no dialog or inline field is drawn and the copy deck has no title for it. Also not drawn: how a Nabestelling line is named (the preview only has order-1 lines).
- **Why it matters:** the amount question would be improvised.
- **Proposal:** a small Dialog (`pp-dialog sm`) titled "Markeer als betaald" with the PaymentPanel field "Betaald bedrag" (€ prefix, default the remainder, same overpayment error `error.overpay`) and the primary "Markeer als betaald". A Nabestelling line is named "{print} (nabestelling {n})", as on the invoice PDF.
- **Blocked:** the per-line amount question and the Nabestelling line name.
- **Owner decision (2026-10-07):** wait for the design system. Until then the line action pays the full remainder after a ConfirmDialog, and a line shows the print name as in the preview.
- **Temporary placeholder approved:** no
- **Design system version:** 1.4

## GAP-042 [resolved in v1.5] "Factuur maken" on phones
- **Type:** missing state
- **Found while:** M7, wiring the invoice export dialog
- **Where needed:** ScreenDashboard on phones (CustomerChips toolbar), ScreenInvoiceExport
- **What is missing or wrong:** the export dialog opens from CustomerCard's "Factuur" button, which is `pp-only-wide`. On phones (CustomerChips) there is no "Factuur" action, though the export dialog has a phone (sheet) layout.
- **Why it matters:** invoices cannot be made on a phone.
- **Proposal:** a secondary "Factuur" button in the `.pp-toolbar` while one klant is selected (next to "Klant verwijderen"), hidden for niet-factureren klanten.
- **Blocked:** making an invoice on phones.
- **Owner decision (2026-10-07):** wait for the design system; no invoice action on phones for now.
- **Temporary placeholder approved:** no
- **Design system version:** 1.4

## GAP-043 [resolved in v1.5] DatePicker calendar has no classes in bundle.css
- **Type:** missing component
- **Found while:** M7, building the invoice export dialog (Van, Tot en met)
- **Where needed:** DatePicker, ScreenInvoiceExport, `frontend/src/components/DatePicker.tsx`
- **What is missing or wrong:** the DatePicker preview draws the month header and the day grid with its own `<style>` block (`.cal`, raw sizes 32px, 6px, 13.5px, 12px, a 2px gap and a 1.5px today ring); none of it is in `components/bundle.css`, so the calendar cannot be built from tokens and classes.
- **Why it matters:** the calendar popover would need invented values.
- **Proposal:** add `.pp-cal` (7-column grid, day cells at `--pp-control-h` or a token, `radius-md`, `text-sm`, `.h` weekday header in `muted`/`text-xs`, `.t` today ring in `primary`, `.s` selected in `primary`/`on-primary`) and `.pp-cal-hd` for the month header to `bundle.css`.
- **Blocked:** the calendar popover. The field itself (typing `d-m-jjjj`, shown as `5 okt 2026`) is specified and works without it.
- **Owner decision (2026-10-07):** wait for the design system. Until then the export dialog has no Van / Tot en met: it covers every order of the klant that is not on a final invoice yet (the API keeps its period filter).
- **Temporary placeholder approved:** no
- **Design system version:** 1.4

## GAP-044 [resolved in v1.5] `.pp-anchor.up` pushes the phone bottom sheet off the screen
- **Type:** suspected design bug
- **Found while:** checking the BulkActionBar "Acties" menu at 360px
- **Where needed:** Popover (`components/bundle.css`), BulkActionBar on phones
- **What is missing or wrong:** at 480px and below `.pp-anchor>.pp-pop` becomes a fixed bottom sheet (`bottom:0`), but `.pp-anchor.up>.pp-pop{bottom:calc(100% + var(--space-2))}` is more specific and still applies, so the sheet sits above the top of the viewport (measured: top at -302px).
- **Why it matters:** a popover marked `.up` (for a trigger near the bottom edge, like the sticky bulk bar) cannot be seen on phones.
- **Proposal:** in the phone media query, also reset `.pp-anchor.up>.pp-pop` (and `.pp-anchor.end>.pp-pop`) to `top:auto;bottom:0;left:0;right:0`.
- **Blocked:** nothing; the app leaves out `.up` where the panel only opens on phones.
- **Temporary placeholder approved:** no
- **Design system version:** 1.4

## GAP-045 [resolved in v1.5] Invoice export dialog: three footer buttons do not fit the 440px dialog
- **Type:** suspected design bug
- **Found while:** comparing ScreenInvoiceExport at 1280px
- **Where needed:** ScreenInvoiceExport footer (Annuleren, Concept downloaden, Definitief maken), `frontend/src/finance/InvoiceExportDialog.tsx`
- **What is missing or wrong:** `.pp-dialog` has `max-width:440px` and `.pp-dialog>footer` does not wrap; the three buttons plus gaps and padding need about 490px, so "Annuleren" spills out of the dialog on the left. The preview places the dialog in a 600px frame, which hides this.
- **Why it matters:** a button outside the dialog edge, over the backdrop.
- **Proposal:** a wider dialog variant for this screen (for example `.pp-dialog.lg`, 560px), or `flex-wrap:wrap` on `.pp-dialog>footer`.
- **Blocked:** nothing; until then the app lets the button row wrap, right-aligned.
- **Temporary placeholder approved:** no (no new values; only existing helper classes)
- **Design system version:** 1.4

## GAP-046 [resolved in v1.5] Uploaded logo in the AppShell brand
- **Type:** missing state
- **Found while:** M7, owner decision on the logo
- **Where needed:** AppShell brand (`.pp-brand` in the sidebar, the 40px `.ini` tile in the tablet rail, `.pp-phone-top` on phones, the drawer), `frontend/src/shell/AppShell.tsx`
- **What is missing or wrong:** the owner decided that an uploaded logo replaces the studio name in the sidebar too (the AppShell README already says "studio name (or uploaded logo)"). `bundle.css` has no rule for an image in `.pp-brand`: no maximum height or width on desktop, nothing for the 40px rail tile (logo, or keep the initial?), the phone top bar or the drawer, and no note on dark mode (a dark logo on the dark sidebar).
- **Why it matters:** the logo cannot be placed without inventing sizes.
- **Proposal:** `.pp-brand img` with a max height of `space-8` (or a token) and `max-width:100%`, `object-fit:contain`, left-aligned; in the rail the initial tile stays (a logo is unreadable at 40px); in the phone top bar the same image at the top bar's height; the image keeps the studio name as `alt`. For dark mode, a light surface behind the logo or a second upload (light and dark).
- **Blocked:** the logo in the sidebar, rail, phone top bar and drawer. Documents already use it. The app will also let every signed-in role read the logo (it is Admin-only today).
- **Owner decision (2026-10-07):** the logo replaces the name in the sidebar too.
- **Temporary placeholder approved:** no
- **Design system version:** 1.4

## GAP-047 [resolved in v1.6] DatePicker: "calendar icon button" in the README, a decorative icon in the preview
- **Type:** unclear spec
- **Found while:** implementing v1.5 (DatePicker in the invoice export dialog)
- **Where needed:** DatePicker field (`frontend/src/components/DatePicker.tsx`), invoice export Van / Tot en met
- **What is missing or wrong:** the README's anatomy says the field has "a calendar icon button on the right", and its accessibility notes say "typing `d-m-jjjj` in the field works without opening the calendar". The preview, however, shows a plain `svg.pp-ico.r` inside `.pp-iwrap`, and `bundle.css` gives `.pp-iwrap>.pp-ico` `pointer-events:none`, so the icon cannot be clicked. There is no class for a button inside `.pp-iwrap` (size, position, hover and focus ring inside the field), and no `aria-label` copy for it (for example "Kies een datum").
- **Why it matters:** with only the decorative icon, a mouse or touch user can open the calendar only by clicking the field itself. Building a real button would mean inventing its size, position and focus style.
- **Proposal:** a `.pp-iwrap>.pp-btn.pp-btn-icon.r` rule (ghost icon button at `right: space-1`, height `--pp-tap` minus the border, `focus-ring` inside the field) with the label "Kies een datum" (copy key `date.pick`), and say whether a click in the field itself should open the calendar.
- **Blocked:** the icon button only. As built now (no new visuals): the icon stays decorative, as in the preview; a click in the field opens the calendar but leaves focus in the field so typing works; Alt+Down or Down moves into the grid; Enter or Tab after typing closes it.
- **Temporary placeholder approved:** yes (by the owner, 2026-10-07), lines marked `ds-gap: GAP-047`. Built from existing classes: a `pp-btn pp-btn-ghost pp-btn-icon pp-btn-sm` with the label "Kies een datum", placed with `.app-date-btn` (`right: space-1`); it opens the calendar and moves focus into the grid. A click in the field no longer opens the calendar.
- **Design system version:** 1.5

## GAP-048 [resolved in v1.6] Locked order: no locked state for "Aantal keer geprint", Aanpassen and the slot spools
- **Type:** missing state
- **Found while:** implementing v1.5 (PaymentPanel "Vergrendeld"), checking the print detail of an order on a final invoice
- **Where needed:** AssetListItem (Aantal keer geprint, "Telt niet mee in kosten", slot SpoolPickers), CostBreakdown ("Aanpassen" / CostOverrideDialog), the per-order controls in OrderSection; `frontend/src/prints/AssetList.tsx`, `frontend/src/finance/CostBreakdown.tsx`
- **What is missing or wrong:** the PaymentPanel README (1.5) says that after finalising "the price, cost adjustments and Aantal keer geprint are locked ("Op factuur {nummer}")". Only PaymentPanel has a locked variant (disabled price field plus help text). AssetListItem, CostBreakdown and OrderSection list no locked state, so it is not specified whether these controls are disabled, hidden or read-only, which help text or tooltip explains why, and whether spool choices (which change the cost) are locked too.
- **Why it matters:** the server already refuses these changes on a locked order, so today the controls look editable and a change ends in the error toast "Opslaan mislukt".
- **Proposal:** on a locked order, show "Aantal keer geprint" as plain text (as the role User sees it), disable the "Telt niet mee in kosten" toggle and the slot SpoolPickers with their existing disabled state, hide "Aanpassen" in CostBreakdown, and give all of them the tooltip `pay.lockedHelp`. Also say whether "Spoel voor de hele print" may still change a locked order.
- **Blocked:** the locked look of those controls. Until then they stay as they are and the server refuses the change.
- **Temporary placeholder approved:** yes (by the owner, 2026-10-07), lines marked `ds-gap: GAP-048`. Built: "Aantal keer geprint" as text, the toggle and slot SpoolPickers disabled, no "Aanpassen". Instead of a hover tooltip, the reason (`pay.lockedHelp`) is one visible `pp-help` line at the top of the file list, linked to each control with `aria-describedby`: disabled controls get no hover or keyboard focus, and the Tooltip spec says a tooltip must never be the only place an essential instruction lives. "Spoel voor de hele print" is unchanged.
- **Design system version:** 1.5

## GAP-049 [resolved in v1.6] Overzicht PDF: "Geldig tot" for a link without expiry
- **Type:** unclear spec
- **Found while:** M8, building the Overzicht PDF (DocOverview)
- **Where needed:** DocOverview meta grid; `backend/src/sharing/` (Overzicht PDF)
- **What is missing or wrong:** the DocOverview meta grid has Klant, Datum and "Geldig tot" (the link's expiry). Since v1.2 a Deel-link can have no expiry (Nooit); ScreenSharePage then leaves out its expiry notice, but DocOverview does not say what "Geldig tot" shows for such a link.
- **Why it matters:** without a rule, the PDF would print an empty or invented value.
- **Proposal:** leave the "Geldig tot" row out for a Nooit link, as the share page does.
- **Blocked:** nothing; the owner chose the proposal.
- **Temporary placeholder approved:** yes (by the owner, 2026-10-07): the row is left out for a Nooit link.
- **Design system version:** 1.5

## GAP-050 [resolved in v1.6] TokenReveal: no copy for "close without copying" confirmation
- **Type:** missing state
- **Found while:** M8, building TokenReveal in ScreenShareLinks
- **Where needed:** TokenReveal (`frontend/src/sharing/TokenReveal.tsx`), ScreenShareLinks
- **What is missing or wrong:** the TokenReveal README says "Closing without copying asks for confirmation", but there is no title, body or button copy for that ConfirmDialog, and no preview of it.
- **Why it matters:** the token is shown only once; closing by accident loses the link (it must be revoked and made again).
- **Proposal:** a ConfirmDialog titled "Sluiten zonder kopiëren?" with the body "Je ziet deze link daarna niet meer. Je kunt hem wel intrekken en een nieuwe maken." and the buttons "Terug" (secondary) and "Sluiten" (primary, not destructive). Copy keys: `share.closeUncopied`, `share.closeUncopiedBody`, `common.back`.
- **Blocked:** the confirmation step only. Until then Sluiten, Esc and the backdrop close the dialog directly; the warning alert stays as specified.
- **Temporary placeholder approved:** yes (by the owner, 2026-10-07), lines marked `ds-gap: GAP-050`; the proposal's copy is used.
- **Design system version:** 1.5

## GAP-051 [resolved in v1.6] Day counts: no singular or zero form for "{n} dagen"
- **Type:** missing state
- **Found while:** M8, ShareLinkRow and ScreenSharePage
- **Where needed:** ShareLinkRow expiry ("Over {days} dagen", "3 dagen geleden" in the preview), ScreenSharePage expiry notice ("Deze link verloopt over {days} dagen ({datum})")
- **What is missing or wrong:** the copy only has the plural. A link can expire in 1 day or later today (0 days), or have expired 1 day ago. "Over 1 dagen" and "Over 0 dagen" are wrong Dutch; there is no copy for those cases.
- **Why it matters:** visible grammar errors on the customer-facing page.
- **Proposal:** ICU plurals: "Over 1 dag" / "Over {days} dagen", "Vandaag" (reusing `date.today`) for 0; "1 dag geleden" / "{days} dagen geleden"; on the share page "Deze link verloopt morgen ({datum})" for 1 and "Deze link verloopt vandaag ({datum})" for 0.
- **Blocked:** nothing structural; the wording for 0 and 1 day.
- **Temporary placeholder approved:** yes (by the owner, 2026-10-07), lines marked `ds-gap: GAP-051`; the proposal's copy is used.
- **Design system version:** 1.5

## GAP-052 [resolved in v1.6] ShareLinkRow: columns shift on rows without Intrekken
- **Type:** suspected design bug
- **Found while:** M8, comparing ScreenShareLinks at 1280px
- **Where needed:** ShareLinkRow (`.pp-share`), ScreenShareLinks
- **What is missing or wrong:** each `.pp-share` row is its own grid (`1.4fr 1fr 1fr 1fr auto`). An expired or revoked row has an empty `span` in the `auto` column instead of the Intrekken button, so its `fr` columns are wider and its dates and badge sit further right than on the active rows above. The ShareLinkRow preview has the same structure, so it shows there too.
- **Why it matters:** the columns of one klant's list do not line up.
- **Proposal:** give the last column a fixed width (the width of a small danger button), or let the list be one grid with `subgrid` rows.
- **Blocked:** nothing; built as specified until the design system changes it.
- **Temporary placeholder approved:** no
- **Design system version:** 1.5
