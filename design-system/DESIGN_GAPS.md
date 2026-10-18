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

## GAP-053 [resolved in v1.6] Share page: totals read "€ 0,00" when no print has a price yet
- **Type:** missing state
- **Found while:** M8 review, opening a Deel-link for a klant whose prints are all still unpriced (real data)
- **Where needed:** ScreenSharePage totals card and "Download overzicht"; DocOverview totals; `frontend/src/sharing/SharePage.tsx`
- **What is missing or wrong:** the totals card leaves out prints without a price, which is right, but no state is drawn for "every line is Prijs volgt". The klant then reads Totaal € 0,00, Betaald € 0,00 and Openstaand € 0,00 under a list of real prints, and the Overzicht PDF prints the same three zeros. The footnote explains why, but the zeros read as "this is free".
- **Why it matters:** this is the first thing a new klant sees, before any price is set, and it suggests an amount that is not true.
- **Proposal:** when no line has a price, leave the totals card out on the page and the totals block out of the PDF, keep the list and the footnote, and keep "Download overzicht". Alternatively show "Prijs volgt" in place of the three amounts. Please also say whether the empty state "Er staat niets open." or this one wins when "Alleen openstaand" is on and nothing is priced.
- **Blocked:** nothing; built as specified until the design system decided.
- **Temporary placeholder approved:** no
- **Design system version:** 1.5

## GAP-054 [resolved in v1.7] `.pp-lockhelp` does not wrap on phones
- **Type:** missing state
- **Found while:** checking v1.6 in the browser, print detail of an order on a final invoice at 360px
- **Where needed:** `.pp-lockhelp` (AssetListItem locked state, OrderSection); `frontend/src/prints/AssetList.tsx`
- **What is missing or wrong:** `.pp-lockhelp` is `display:flex` with `flex-wrap:nowrap` and no rule below 900px or 480px. At 360px the badge "Op factuur {nummer}" takes 159 of the 292 available pixels, leaving the help text a 93px column that wraps over four lines. Measured in the app, not guessed.
- **Why it matters:** the sentence that explains why every control is disabled is the hardest thing to read on the screen where it matters most.
- **Proposal:** `flex-wrap: wrap` on `.pp-lockhelp`, or `flex-direction: column; align-items: flex-start` at 480px and below, so the badge sits above the sentence and the sentence gets the full width.
- **Blocked:** nothing; it is readable, only cramped.
- **Temporary placeholder approved:** no
- **Design system version:** 1.6

## GAP-055 [wontfix] CostBreakdown table is clipped on phones — mistaken report
- **Type:** suspected design bug
- **Found while:** M9, checking v1.6 in the browser
- **What I reported:** that `.pp-cost` needs 520px inside a 292px card at 360px, so the "Bedrag" column could not be reached.
- **Why it is wrong:** the table is already wrapped in `.pp-scroll` (`overflow: auto`), exactly like the Toegang matrix and the Facturen table. Measured in the running app at 360px: the box scrolls (`scrollWidth` 387 against `clientWidth` 290, `scrollLeft` moves). I had compared widths and inferred clipping without testing whether it scrolled. The design system is fine here; nothing is unreachable by touch or trackpad.
- **What was real:** the scroll containers had no keyboard access (`tabindex` −1), found by axe on ScreenAccess and true of every `.pp-scroll` in the app. That is markup, not design, and is fixed in the app by making the regions focusable and naming them.
- **Temporary placeholder approved:** not applicable
- **Design system version:** 1.6

## GAP-056 [resolved in v1.7] ScreenApiDocs specifies Swagger UI; the owner wants Scalar
- **Type:** conflict
- **Found while:** M9, starting ScreenApiDocs
- **Where needed:** ScreenApiDocs (`/api-docs`), `frontend/src/pages/ApiDocsPage.tsx`
- **What is missing or wrong:** the README says the card holds "the Swagger UI iframe or container" with the Swagger styles overridden by our tokens, and the preview illustrates that with `.pp-api-head`, `.pp-api-row` and `.pp-method`. The owner finds plain Swagger UI ugly and inflexible and wants the approach of github.com/connorgallopo/tracearr: the OpenAPI document rendered by **Scalar** (`@scalar/api-reference-react`), with the spec fetched by the page and the credentials preset so "Test request" works. Scalar renders its own layout, so the three `pp-api-*` classes would go unused, and the screen would no longer match its preview.
- **Why it matters:** CLAUDE.md allows a third-party UI kit only with the owner's approval and only when it is configured to use our tokens; the design system should decide what the screen officially is before it is built twice.
- **Proposal:** adopt Scalar with `theme: 'none'` and map its CSS variables (`--scalar-color-1/2/3`, `--scalar-color-accent`, `--scalar-background-1/2/3`, `--scalar-border-color` and the sidebar variables) onto our tokens, so no Scalar colour, font or radius survives. The page header, the card and the loading and error states stay ours, exactly as specified. Please either bless Scalar in the spec with a preview of the themed result, or keep Swagger UI and say so.
- **Blocked:** the official look of `/api-docs`. Everything around it (header, card, loading, error, theme switch) is specified and unaffected.
- **Temporary placeholder approved:** yes (by the owner, 2026-10-07), lines marked `ds-gap: GAP-056`: Scalar with `theme: 'none'` and its CSS variables mapped onto our tokens. The mapping uses the same marker, because the checker allows a custom property outside `tokens.css` only for an open gap.
- **Design system version:** 1.6

## GAP-057 [resolved in v1.7] First-run folder diagram wraps instead of scrolling
- **Type:** suspected design bug
- **Found while:** M9, building the first-run page from ScreenSystemStates
- **Where needed:** `.pp-tree` with `.pp-indent-1` to `.pp-indent-4` (ScreenSystemStates first run); `frontend/src/pages/FirstRunState.tsx`
- **What is missing or wrong:** the README says "on a phone the diagram scrolls inside its card", but `.pp-tree` sets only `line-height` and colour, the indent classes only `padding-left`, and nothing sets `white-space` or an overflow. At 360px the longest row ("└─ **Babybox locks**/ project") therefore wraps, and the `project` chip lands on the next line under the wrong indent level, which reads as a separate folder. The preview has the same markup, so it wraps there too.
- **Why it matters:** the diagram's whole job is to show which folder sits inside which; a wrapped row shows the wrong nesting on the screen a new installation starts at.
- **Proposal:** `white-space: nowrap` on the rows inside `.pp-tree` so the card can scroll, and say which container scrolls: `.pp-scroll` (which exists and looks like a card) or `.pp-card` with an overflow of its own.
- **Blocked:** nothing. Built with `.pp-scroll` and an app rule that stops the rows wrapping, marked `ds-gap: GAP-057`.
- **Temporary placeholder approved:** yes (by the owner, 2026-10-07), lines marked `ds-gap: GAP-057`: one rule in `app.css` stops the rows inside `.pp-tree` wrapping, so the card scrolls as the README describes.
- **Design system version:** 1.6

## GAP-058 [resolved in v1.7] ScreenAccess names an empty state but does not describe it
- **Type:** missing state
- **Found while:** M9, going through every screen's empty, loading and error states
- **Where needed:** ScreenAccess / AccessMatrix; `frontend/src/pages/AccessPage.tsx`
- **What is missing or wrong:** the States line lists "empty (no users besides you)", but neither the anatomy, the preview nor the copy deck says what that looks like. On a fresh installation the only account is the Admin, so the matrix draws one row with every box checked and disabled, which reads as a broken screen rather than "there is nobody to grant access to yet".
- **Why it matters:** Toegang is one of the first screens a new installation visits, and it currently explains nothing.
- **Proposal:** when no account has the role User, replace the matrix with an EmptyState: title "Nog geen gebruikers om toegang te geven", the sentence "Alleen Admins en Editors bestaan nu; zij zien altijd elke klant." and a link to Gebruikers. Keep the `access.allAccessRoles` help line. Copy keys: `access.empty.title`, `access.empty.body`.
- **Blocked:** that one state. The matrix itself, the per-row and per-column toggles and the phone cards are specified and built.
- **Temporary placeholder approved:** yes (by the owner, 2026-10-07), lines marked `ds-gap: GAP-058`: the proposed EmptyState and its two copy keys.
- **Design system version:** 1.6

## GAP-059 [resolved in v1.7] The contrast report does not say which ground each pair assumes
- **Type:** improvement idea
- **Found while:** M9, theming the `/api-docs` renderer and then auditing it with axe
- **Where needed:** `contrast.md`, and anywhere a translucent tint is used as a background
- **What is missing or wrong:** the report lists pairs such as "`primary` on `primary-tint (on surface)` 5.00 pass". The parenthesis carries the whole meaning, because `primary-tint` is translucent (`#3659c924`, 14% alpha): over `surface` the pair measures 5.00, but over `surface-2` it measures 4.34 and fails AA. The report gives one number per pair and names the ground only inside the label, so it is easy to read "primary on primary-tint passes" and use the tint on another ground. That is exactly what happened here, and axe caught it.
- **Why it matters:** every translucent token has this property. A reader who takes a pair as "safe" can fail AA without any warning, on a surface the report never measured.
- **Proposal:** give the report an explicit "ground" column rather than putting it in the label, and for each translucent token list every ground it is approved over (`bg`, `surface`, `surface-2`), with a line saying that a translucent token is only approved over the grounds listed. Alternatively, state once at the top that every tint pair assumes `surface` and must be re-measured over any other ground.
- **Blocked:** nothing; this is about preventing a class of mistake, not about a screen.
- **Temporary placeholder approved:** no
- **Design system version:** 1.6

## GAP-060 [resolved in v1.8] ScreenApiDocs: Scalar's endpoint list is not reachable by keyboard on a phone
- **Type:** suspected design bug
- **Found while:** implementing v1.7, checking every changed screen at 360px in both themes
- **Where needed:** ScreenApiDocs (`/api-docs`); `frontend/src/pages/ApiDocsPage.tsx`
- **What is missing or wrong:** the accessibility note says "Scalar's own landmarks and keyboard handling are kept", which holds on desktop but not at 480px and below. There Scalar lays its endpoint list out as `ul.endpoints` that scrolls sideways (measured at 360px: 338px of content in a 276px box) while holding **no tabbable element at all** (68 descendants, 0 of them focusable). axe-core reports `scrollable-region-focusable`, serious, in both themes; it is the only violation left on the screen. The same rule is why our own wide tables carry `tabIndex={0} role="region" aria-label={…}`, and the spec has no equivalent instruction for the part of this screen that Scalar renders.
- **Why it matters:** on a phone a keyboard or switch user cannot scroll the list, so roughly a fifth of every endpoint row (method and path) cannot be read. It is the one screen whose content is drawn by a third-party renderer, so the design system's "keyboard handling is kept" is an assumption about that renderer rather than something the app controls.
- **Proposal:** say in the README that the app makes any region Scalar leaves scrollable-but-not-focusable into a labelled region, exactly as `.pp-scroll` does: `tabindex="0"`, `role="region"` and `aria-label` from the existing key `api.title` ("API-docs"), applied after render because the markup is Scalar's. No new copy key and no new visual value; nothing changes on desktop, where the list does not scroll. If you would rather not patch a third-party DOM, the alternative is a rule that the renderer is given a wider minimum and the card scrolls instead, which needs a value.
- **Blocked:** nothing any more; see the placeholder below.
- **Temporary placeholder approved:** yes (by the owner, 2026-10-07), lines marked `ds-gap: GAP-060`: an effect in `ApiDocsPage.tsx` gives any region Scalar leaves scrollable-but-not-focusable `tabindex="0"` and `aria-label` from the existing key `api.title`, and takes them away again when a wider window stops it scrolling. `role="region"` is set only on a generic element: on the `ul.endpoints` it would replace the implicit `list` role and orphan all 17 `li` (axe reports exactly that, so the first version of this placeholder traded one serious violation for another). Verified at 360px: the list takes focus and scrolls by keyboard, the list semantics survive, and at 1280px no attribute is left behind. No new copy key and no visual value.
- **Design system version:** 1.7

## GAP-061 [resolved in v1.8] The contrast report does not cover a translucent token over another translucent token
- **Type:** improvement idea
- **Found while:** verifying v1.7, answering the open question about badges on `surface-2`
- **Where needed:** `contrast.md`, the *Translucent tokens over every ground* table; PrintCard and OutstandingGroup rows
- **What is missing or wrong:** v1.7's new table checks each translucent token over `bg`, `surface` and `surface-2`, which is exactly the fix GAP-059 asked for. In the app one case still falls outside it: a status badge on a **hovered** row. The row hover paints `primary-tint-soft` on an ancestor, and the badge's own `unpaid-tint` or `warning-tint` then composites over *that*, so the real ground is a tint over a tint over `surface`, which is not one of the three grounds in the table.
- **Why it matters:** nothing is broken today, and the measurements say so: on a hovered row the `warning` badge is **4.98** and the `unpaid` badge **4.97**, the same as at rest, because the hover tint is light enough not to move the composite. So this is a gap in the report's coverage rather than a bug in the tokens. It matters because the pattern "a tint inside a row that is itself tinted" is used on every list in the app, and the next token whose alpha changes could cross AA without anything in the report noticing — which is precisely the failure mode GAP-059 was logged for.
- **Proposal:** add the two grounds the app actually produces to the table — `primary-tint-soft over surface` (row hover) and `primary-tint over surface` (selected row) — for at least the badge tokens `unpaid`, `warning`, `paid` and `info`, in both themes. Alternatively state a rule that a translucent ground is never nested inside another translucent ground, and name which of row hover or the badge tint gives way. No token change is proposed: the values measured here pass.
- **Blocked:** nothing. The app is built and measured; this is about the report catching the case next time.
- **Temporary placeholder approved:** no
- **Design system version:** 1.7

## GAP-062 [resolved in v1.9] The selection checkbox moves down when it is ticked
- **Type:** suspected design bug
- **Found while:** the owner's walkthrough of 1.0, dashboard cards
- **Where needed:** `.pp-opt` and `.pp-check` (PrintCard, PrintTable); `frontend/src/prints/PrintCard.tsx`
- **What is missing or wrong:** `label.pp-opt` is `inline-flex` and sits on a text baseline; `.pp-check:checked::after` adds the tick as in-flow content, which gives the input a baseline and so changes the label's. Measured on the dashboard: the box sits at y=491 unticked and y=495.5 ticked, a **4.5px jump**, with the card's own position and height unchanged. Ticking a row of cards makes each box hop as it is selected.
- **Why it matters:** Selection is the entry point to every bulk action, and the control moving under the pointer reads as a glitch; on a grid of cards the whole row appears to twitch.
- **Proposal:** Take `.pp-opt` off the baseline, e.g. `vertical-align: top` on it (or make the wrapper a flex container). Verified in the browser: with `vertical-align: top` the box stays at y=491 in both states, and nothing else moves. No token or copy change.
- **Blocked:** Nothing else; the checkbox works, it only moves.
- **Temporary placeholder approved:** yes (by the owner, 2026-10-07), lines marked `ds-gap: GAP-062`: `vertical-align: top` on `.pp-opt` inside `.app-above-link`, which takes the label off the text baseline. Verified on the dashboard: the box stays put when ticked and nothing else moves.
- **Design system version:** 1.8

## GAP-063 [resolved in v1.9] The sidebar footer is unreachable on any page taller than the window
- **Type:** suspected design bug
- **Found while:** the owner's walkthrough of 1.0; reproduced across every screen
- **Where needed:** `.pp-side` and `.pp-side .foot` (AppShell); every desktop screen
- **What is missing or wrong:** `.pp-side` is in normal flow and stretches to the height of the page, while `.pp-side .foot` is pinned with `margin-top:auto`. The footer therefore sits at the bottom of the **page**, not of the viewport. Measured at 1360x900: footer visible on Facturen, Tags, Deel-links, Toegang and Gebruikers (page exactly 900px), and off-screen on Dashboard (footer at y=2499 of a 2679px page), Instellingen (y=3449 of 3629), Openstaand (y=5926 of 6106) and API-docs (y=17795 of 17975). It appears briefly while the page is still short and then drops away as content loads, which reads as flicker.
- **Why it matters:** The footer holds the user badge, the theme control, Uitloggen and the live indicator. On the three screens people spend the most time on, signing out and switching theme cannot be reached without scrolling the whole page, and the live dot, whose whole job is to be glanceable, is never in view.
- **Proposal:** Make the sidebar its own viewport-height column that does not scroll with the page: `position: sticky; top: 0; height: 100vh` on `.pp-side` (with `overflow-y:auto` for a long nav), or give `.pp-app` a non-scrolling grid with the scroll on `.pp-main`. Both keep the existing `margin-top:auto` footer. Please say which, since it changes where the page scrollbar lives.
- **Blocked:** Reaching the footer on Dashboard, Openstaand, Instellingen and API-docs.
- **Temporary placeholder approved:** yes (by the owner, 2026-10-07), lines marked `ds-gap: GAP-063`: an `app-side` class on the existing `aside.pp-side` (the pattern `main.pp-main app-main` already uses) making it `position: sticky; top: 0; align-self: start; height: 100vh; overflow-y: auto`. The page keeps its own scrollbar. Verified on all nine screens at 1440, 1360, 768 and 390px: the footer is in view everywhere, the rail and the phone layout are unchanged, and no page scrolls horizontally.
- **Design system version:** 1.8

## GAP-064 [resolved in v1.9] The 3D viewer takes the whole fold on the print detail, including when there is no model
- **Type:** suspected design bug
- **Found while:** the UX review of 1.0 and the owner's walkthrough
- **Where needed:** Viewer3D on ScreenPrintDetail; `frontend/src/prints/PrintDetailPage.tsx`
- **What is missing or wrong:** The README says "On the print detail page the viewer uses `pp-viewer fluid` (no max width)", and `.pp-viewer` is `aspect-ratio:4/3`. At a 1360px window that makes the viewer about **1090x830px**; on a 390px phone about 390x293. The same box is used for the "no model" state, so a print with no model still spends 830px of desktop and a third of a phone screen saying "Geen 3D-model beschikbaar". Files, costs and the price field start below the fold in both cases.
- **Why it matters:** The print detail is where pricing and payment happen. On a print with no model the viewer carries no information at all, and even with a model a 4:3 box the width of the content is far larger than needed to judge a part.
- **Proposal:** Two things: (1) cap the viewer on the print detail, for example back to the component's own `max-width:520px` or a new step, so the cost and payment cards are reachable without scrolling; (2) give the "no model" state a height of its own rather than the 4:3 frame, since it only has to carry an icon, a line of text and the thumbnail.
- **Blocked:** The whole first screen of the print detail, both with and without a model.
- **Temporary placeholder approved:** no
- **Design system version:** 1.8

## GAP-065 [resolved in v1.9] The theme control always shows a moon, whatever the theme is
- **Type:** missing state
- **Found while:** the owner's walkthrough of 1.0
- **Where needed:** AppShell footer and drawer, "Thema"; `frontend/src/shell/AppShell.tsx`
- **What is missing or wrong:** The AppShell README says the footer item "Thema" cycles Systeem, Licht and Donker, but names no icon per state, and the iconography table has no entry for it. The app therefore renders a hard-coded `moon` in all three states.
- **Why it matters:** The control cycles three values and its label is just "Thema", so the icon is the only indication of the current state; a fixed moon suggests "dark is on" even in the light theme.
- **Proposal:** Name an icon per state from the Lucide set already in use, e.g. `monitor` for Systeem, `sun` for Licht and `moon` for Donker, and say whether the icon shows the current state or the one the next click selects. Also say whether the accessible name should name the current state.
- **Blocked:** The theme control's icon only; the cycle itself works.
- **Temporary placeholder approved:** no
- **Design system version:** 1.8

## GAP-066 [resolved in v1.9] The dashboard cannot be sorted and cannot be filtered by status
- **Type:** missing component
- **Found while:** the UX review of 1.0; confirmed in `frontend/src/prints/filter.ts`
- **Where needed:** FilterBar on ScreenDashboard; `frontend/src/prints/filter.ts`
- **What is missing or wrong:** The filter bar offers klant, tags, a search box and the archived/deleted toggles, and nothing else: no sort control, and no filter on payment or cost status. The dashboard loads 24 of 83 prints with "Meer laden", so without sorting there is no way to bring the newest, the dearest or the unpriced to the top.
- **Why it matters:** The daily job is to price what has just been printed and to chase what is open. On the owner's own data 9 of the first 12 cards read "Geen prijs", and the only way to find the rest is to keep loading pages and read every card.
- **Proposal:** A sort control (at least: newest first, oldest first, price, klant) and a status filter covering Geen prijs, Open, Betaald, Afgeschreven and Onvolledige kosten. Both belong in the existing FilterBar; a segmented control or select from the system would do, so probably no new component, but the states, their Dutch copy and the phone layout need specifying.
- **Blocked:** Sorting and status filtering on the dashboard.
- **Temporary placeholder approved:** no
- **Design system version:** 1.8

## GAP-067 [resolved in v1.9] The customer strip grows without limit and owns the fold
- **Type:** improvement idea
- **Found while:** the owner's walkthrough of 1.0
- **Where needed:** CustomerCard / CustomerChips on ScreenDashboard
- **What is missing or wrong:** The dashboard opens with one card per klant. With the owner's 10 klanten that is two rows, about **350px before the first print** at 1360x900; the card grid starts below it. Nothing caps or collapses the strip, so it grows with every new klant and will eventually push the prints off the screen entirely.
- **Why it matters:** The dashboard's subject is prints, and the strip is a filter plus a per-klant total. At 20 or 30 klanten the screen opens on a wall of klant cards.
- **Proposal:** Cap the strip and let it scroll or collapse: a horizontal scroller with the phone's chip treatment, a "toon alle klanten" expander, or a fixed number of rows with a count. Please say which, and what the phone and tablet layouts become.
- **Blocked:** Nothing is broken today; this is about the screen holding up as klanten are added.
- **Temporary placeholder approved:** no
- **Design system version:** 1.8

## GAP-068 [resolved in v1.9] The list view shows no thumbnail
- **Type:** missing state
- **Found while:** the owner's walkthrough of 1.0
- **Where needed:** PrintTable on ScreenDashboard (the "Lijst" view)
- **What is missing or wrong:** The card view leads with a thumbnail; the list view has no image column at all, so a print can only be recognised by its name. Prints are often named after the file, and several of the owner's differ only in a suffix.
- **Why it matters:** The list view exists to see more prints at once, which is exactly when recognising them by eye matters most.
- **Proposal:** A small thumbnail column (for example 32 or 40px square, `radius-sm`, the same tinted ground as the card) as the first column, with the existing "Geen voorbeeld" placeholder, and a rule for the phone card layout.
- **Blocked:** The list view's thumbnail column.
- **Temporary placeholder approved:** no
- **Design system version:** 1.8

## GAP-069 [resolved in v1.9] The bulk bar sits at the end of the page on desktop
- **Type:** improvement idea
- **Found while:** the owner's walkthrough of 1.0
- **Where needed:** BulkActionBar on ScreenDashboard
- **What is missing or wrong:** The README says the bar "Sticks to the bottom of the viewport at 480px and below". Above 480px it is in normal flow, so after selecting a card on a 2700px dashboard the actions are at the bottom of the page rather than in sight.
- **Why it matters:** Selecting happens at the top of the grid, so on desktop the one thing you need next is the one thing off screen.
- **Proposal:** Let the bar stick to the bottom of the viewport at every width, not only on phones, keeping the elevated look it already has. If it should stay in flow on desktop, say what tells the user where the actions went.
- **Blocked:** Nothing; the actions work once found.
- **Temporary placeholder approved:** no
- **Design system version:** 1.8

## GAP-070 [resolved in v1.9] Nothing says the klant tile is clickable, and only the name is
- **Type:** unclear spec
- **Found while:** the owner's walkthrough of 1.0
- **Where needed:** CustomerCard on ScreenDashboard
- **What is missing or wrong:** Clicking a klant filters the dashboard, but only the name inside the tile is the target: the rest of the tile, including the amount and the whitespace, does nothing, and the name is not drawn as a link or a button.
- **Why it matters:** The filter is the tile's main purpose and it is effectively hidden; people click the tile, nothing happens, and they conclude it is decoration.
- **Proposal:** Either make the whole tile the control (a card-sized button with hover, focus-visible and `aria-pressed`, which `.pp-cust.is-selected` already has a look for), or keep the name as the only target and draw it as one. The first is preferred; please confirm, including how it coexists with the delete icon in the same tile.
- **Blocked:** The klant filter's affordance.
- **Temporary placeholder approved:** no
- **Design system version:** 1.8

## GAP-071 [resolved in v2.3] A dark filament tint swallows the model in the thumbnail
- **Type:** suspected design bug
- **Found while:** the owner's walkthrough of 1.0; measured again against the v1.9 mechanism
- **Where needed:** Thumbnail on PrintCard and PrintRow; `.pp-thumb.tinted` in `bundle.css`
- **What is missing or wrong:** the thumbnail is tinted with the filament colour, and with a dark or saturated one the model nearly disappears into its own ground.
- **Correction to an earlier note in this entry:** it previously said the `--mix` floor was not in the v1.9 export. That was wrong, and the mistake was ours: the floor does ship, as `color-mix(in srgb, var(--c1) var(--mix,100%), var(--border-strong))` on `.pp-thumb.tinted` with an inset `border-strong` ring, and the grep that looked for it missed `--mix` inside `var(--mix,100%)`. `scripts/check-design-export.mjs` now reads the export's own claims so this cannot recur.
- **Why it is still open, measured:** the mechanism cannot reach the 3:1 target, and between 100% and 40% it makes things worse. On a black-filament thumbnail, model against ground: **100% (default) 1.21 darkest / 1.57 lightest; 80% 1.02 / 1.33; 60% 1.34 / 1.03; 40% (the proposed floor) 1.94 / 1.49; 25% 2.60 / 2.00.** The reason is that the model image holds a *range* of luminances, so a ground moving through that range collides with part of it: at 80% it matches the darkest pixels, at 60% the lightest. No single mix clears 3:1 on both ends, and the best measured value (25%) is well past the proposed 40% floor and still short.
- **The app also cannot set it yet:** `--mix` is not in the checker's list of custom properties an app may set inline (`--tag`, `--tag-ink`, `--c1`, `--c2`). v1.9's changelog calls `--mix` a "new allowed inline data property", so the kit's `scripts/check-design-tokens.sh` needs that list extended before the app may use it. We have not changed the checker, since there is nothing to let through yet.
- **Proposal:** the ground alone cannot carry this. Either (a) separate the model from the ground rather than lightening it — the inset ring already shipped is a start, and a stronger outline or a drop shadow on the image would not depend on the tint at all; (b) keep the ground neutral for dark filaments and show the colour as a swatch next to the name, as SpoolSwatch already does elsewhere; or (c) state a lower target for this case and say what it is, since 3:1 against a photographic preview may not be reachable at all. We would implement whichever you choose; this needs a visual decision, not a number.
- **Blocked:** dark and saturated thumbnails stay hard to read. Everything else about the thumbnail works.
- **Temporary placeholder approved:** no
- **Design system version:** 1.9 (measured against the shipped `--mix` mechanism)

- **Answered (2026-10-08), the yes-or-no you asked for rather than silence.** **Yes, a silhouette can be outlined** — but the rule as written covers 2 prints of 83.
  - **Every thumbnail carries an alpha channel.** Thirty sampled from the running app: 30 PNGs, all with transparent pixels, none opaque. So the silhouette is detectable by walking the alpha, for the slicer's own images as much as for ours.
  - **But almost none of them is ours.** Measured in the database: **79 of 83 prints get an embedded thumbnail** out of a G-code, 3MF or project file, and **2 are rendered from STL** by us. 2.0 says "the server-rendered PNG therefore outlines the model's silhouette"; taken literally that is 2 prints.
  - **The problem it was meant to solve is real for all of them.** The renders are neutral, not filament-coloured, and both ends still vanish: measured against the real grounds, the **lightest pixel of a render is 1.16:1 on light `surface-2`** and the **darkest is 1.68:1 on dark**. So it is not only dark filaments; a white highlight disappears on light and a shadow disappears on dark, whatever the spool.
  - **Your outline ink is confirmed:** `#6f7a96` measures **3.69:1 on light `surface-2` and 3.53:1 on dark**, which matches your calculation against the real values.
- **What I need from you before building it:** the rule says "the server-rendered PNG". Should the outline be drawn on **every thumbnail the app serves**, including the 79 the slicer made and we only pass through? Outlining an image we did not make is a bigger step than the sentence implies, and it is the only version that changes anything for this library. I have not built either reading.

## GAP-072 [resolved in v2.0] The card subtitle repeats the print's own name
- **Type:** improvement idea
- **Found while:** the UX review of 1.0; status corrected while checking v1.9's claims
- **Where needed:** PrintCard and PrintTable (`placeOf` in `frontend/src/prints/filter.ts`); ScreenSharePage line subtitle
- **What is missing or wrong:** the subtitle is "klant / project", and a print is named after its project folder, so the line reads "Joey / Babybox locks" under the title "Babybox locks". The only new information is the klant. On a phone it wraps, so a quarter of each card repeats the title.
- **Why it matters:** it costs a line in every card, on the screen with the most cards.
- **Proposal (the design system's, v1.9):** the klant alone when the project equals the print name, and on the share page the date alone. v1.9 marks this **proposed, needs your confirmation**, and its own breaking-changes note says "a klant tile and a print have a changed second line (GAP-072, if confirmed)".
- **Status in the app, corrected:** this entry briefly said `[resolved in v1.9]`, which was wrong twice over. A gap the export marks *proposed* is not settled, and only half of it is built: the **share page** follows the proposal (`lineSubtitle`, marked `ds-gap: GAP-072`), while the **card and list subtitle** still always reads "klant / project" (`placeOf` is unchanged). `scripts/check-design-export.mjs` now reports which gaps an export leaves unsettled, which is how this was caught.
- **Blocked:** the card and list subtitle, until the design system confirms the rule.
- **Temporary placeholder approved:** yes (built as the design system proposed it, pending their confirmation), lines marked `ds-gap: GAP-072` on the share page only.
- **Design system version:** 1.9

## GAP-073 [resolved in v1.9] "Kosten ontbreken" is shown twice on one print
- **Type:** suspected design bug
- **Found while:** the UX review of 1.0
- **Where needed:** CostBreakdown and PaymentPanel on ScreenPrintDetail
- **What is missing or wrong:** A print with incomplete costs shows the warning in the Totaalkosten card and again in the Betaling panel ("Kosten ontbreken. Het voorstel uit marge is niet beschikbaar."), one above the other on a phone.
- **Why it matters:** The same condition is reported twice within one screen, which makes it read as two problems.
- **Proposal:** Keep one. The payment panel's line is the more useful of the two because it says what the consequence is, so the cost card could drop to the "Onvolledig" total it already shows. Please say which is official.
- **Blocked:** Nothing; it is duplication, not an error.
- **Temporary placeholder approved:** no
- **Design system version:** 1.8

## GAP-074 [resolved in v1.9] The order block nests cards three deep and spaces them unevenly
- **Type:** suspected design bug
- **Found while:** the owner's walkthrough of 1.0; print 788b996b
- **Where needed:** OrderSection, CostBreakdown, PaymentPanel on ScreenPrintDetail
- **What is missing or wrong:** The order renders as a card holding cards (Bestanden, Totaalkosten, Betaling) which themselves hold bordered blocks, so three rounded borders sit inside one another. The owner reports a lot of empty space, no outer margin against the rounded corners, and a Totaalkosten table that does not read as part of its card. It also does not reflow well between widths.
- **Why it matters:** The order block is the working area of the print detail: it is where cost, price and payment are read together, and the nesting makes it hard to see which number belongs to which group.
- **Proposal:** Specify the order block as one card with sections rather than cards inside a card, with a stated rule for the border, radius and padding at each level, and the column behaviour from phone through wide. A worked example at 360, 768 and 1360px would settle it.
- **Blocked:** The layout of the order block, which is most of the print detail.
- **Temporary placeholder approved:** no
- **Design system version:** 1.8

## GAP-075 [resolved in v1.9] The most destructive action is the most prominent one
- **Type:** improvement idea
- **Found while:** the UX review of 1.0
- **Where needed:** ScreenPrintDetail header; CustomerCard on ScreenDashboard
- **What is missing or wrong:** On the print detail "Verwijderen" is a red outlined button in the top-right, while the screen's actual purpose, setting a price, is a small "Opslaan" about 1400px below it. On the dashboard every klant tile carries a delete icon beside the name, so ten one-click deletes sit above the fold.
- **Why it matters:** Visual weight should follow how often an action is wanted and how bad it is to hit by accident; here it is inverted in both places. Both actions are recoverable by an Admin, which is why this is an improvement and not a bug.
- **Proposal:** Demote delete on both screens: on the print detail into an overflow menu or the foot of the page, and on the klant tile behind the tile's own menu, keeping the ConfirmDialog. Say what, if anything, takes the freed top-right spot on the print detail.
- **Blocked:** Nothing.
- **Temporary placeholder approved:** no
- **Design system version:** 1.8

## GAP-076 [resolved in v1.9] Nothing leads from a missing cost to the setting that causes it
- **Type:** missing state
- **Found while:** the UX review of 1.0
- **Where needed:** CostBreakdown on ScreenPrintDetail; Printers on ScreenSettings
- **What is missing or wrong:** A print whose printer profile has no wattage shows "Kosten ontbreken" and an empty Stroom row, and the Printers section in Instellingen shows the incomplete profile with an empty Vermogen field and no warning. On the owner's instance two of four printers (Creality K2 and K2 Plus) are in that state, which is why so many prints read Onvolledig. Neither end mentions the other.
- **Why it matters:** The user is told there is a problem on one screen and shown its cause on another, with nothing connecting them, so the warning looks like a bug in the app rather than a setting that is not filled in.
- **Proposal:** Say what the warning names: a line that states the missing input ("Geen vermogen voor Creality K2") and links to Instellingen, and a marker in the Printers list on an incomplete profile. Needs Dutch copy for both.
- **Blocked:** The link between the warning and its cause.
- **Temporary placeholder approved:** no
- **Design system version:** 1.8

## GAP-077 [resolved in v1.9] The share page shows the klant the link's internal label
- **Type:** suspected design bug
- **Found while:** the UX review of 1.0
- **Where needed:** ScreenSharePage header; ShareLinkRow
- **What is missing or wrong:** The label given when creating a Deel-link is rendered to the visitor, under "Overzicht voor <klant>". The field reads as an internal note when creating it (the owner's live labels are "PR 8 review", "log check", "v1.6 check" and "geen prijzen"), and those strings are shown to the customer.
- **Why it matters:** It leaks working notes to a customer and makes an otherwise clean page look unfinished. Nothing in the create dialog warns that the label is public.
- **Proposal:** Decide which the label is. Either it is internal, and the share page drops it (the header then being studio, klant and expiry), or it is customer-facing, in which case the dialog has to say so and a separate internal note is needed. Dropping it from the page is preferred.
- **Blocked:** What the share page header shows.
- **Temporary placeholder approved:** no
- **Design system version:** 1.8

## GAP-078 [resolved in v1.9] The share page never says how to pay
- **Type:** missing state
- **Found while:** the UX review of 1.0
- **Where needed:** ScreenSharePage totals card; DocOverview
- **What is missing or wrong:** The page ends with Totaal, Betaald and Openstaand, then "Download overzicht". It names an amount the klant owes and gives no way to settle it: no IBAN, no reference, no contact. The Overzicht PDF does carry payment instructions while something is open, so the page is the only surface that omits them.
- **Why it matters:** The page exists to tell a klant what they owe; without a next step they have to find the PDF or ask.
- **Proposal:** A payment block under the totals, shown only while something is open, with the company's IBAN and a reference (the PDF already defines both), and the studio's e-mail or phone when set. Needs Dutch copy and a phone layout.
- **Blocked:** The klant's next step after reading the total.
- **Temporary placeholder approved:** no
- **Design system version:** 1.8

## GAP-079 [resolved in v1.9] The share page shows a klant no pictures of their prints
- **Type:** improvement idea
- **Found while:** the UX review of 1.0
- **Where needed:** ScreenSharePage line list
- **What is missing or wrong:** Each line is a name, a date, a price and a status. The operator side has a thumbnail for nearly every print, and the klant, who ordered the object, sees none of them.
- **Why it matters:** It is the one screen a customer sees, for a product that is physical and visual; a list of names is the least recognisable form it could take.
- **Proposal:** A thumbnail per line, with the existing placeholder when there is none, and a rule for the phone layout. Consider whether the filament tint belongs here or whether the customer view uses a neutral ground.
- **Blocked:** Nothing; the page works, it is just text-only.
- **Temporary placeholder approved:** no
- **Design system version:** 1.8

## GAP-080 [resolved in v1.9] Openstaand is one long list and does not show age
- **Type:** missing state
- **Found while:** the UX review of 1.0
- **Where needed:** ScreenOutstanding / OutstandingGroup
- **What is missing or wrong:** Every open line for every klant renders at once: on the owner's data **6106px and about 90 rows**, each with its own "Markeer als betaald" and "Afschrijven" button. The day count is a badge in the same `unpaid` tint whatever its value, so "3 dagen open" and "741 dagen open" are drawn identically. There is no paging and no collapse.
- **Why it matters:** The screen exists to chase what is oldest, and age is the one thing it does not show; and the page grows without limit as the business does.
- **Proposal:** An aging treatment (buckets, weight or an escalating badge, with the thresholds stated) and a way to keep the page finite: collapse a klant's group by default, page it, or both. Both need phone layouts.
- **Blocked:** Reading Openstaand at a glance; the actions themselves work.
- **Temporary placeholder approved:** no
- **Design system version:** 1.8

## GAP-081 [resolved in v1.9] Deel-links cannot be filtered, and duplicate labels pass silently
- **Type:** missing state
- **Found while:** the UX review of 1.0
- **Where needed:** ScreenShareLinks / ShareLinkRow
- **What is missing or wrong:** Revoked links stay in the list for good with no way to hide them, so the page fills with dead rows; the owner already has two links labelled "PR 8 review" for the same klant, created without warning. There is also nothing on a row to say the link itself can never be shown again.
- **Why it matters:** Over time the page becomes mostly history, and identical labels make it impossible to tell which link was given to whom.
- **Proposal:** A filter or a collapsed "Ingetrokken" group, a warning (or a quiet suffix) when a label repeats within a klant, and a line on the row stating that the link is shown only once. Needs Dutch copy.
- **Blocked:** Nothing; creating and revoking work.
- **Temporary placeholder approved:** no
- **Design system version:** 1.8

## GAP-082 [resolved in v1.9] The invoice list does not say whether an invoice is paid
- **Type:** missing state
- **Found while:** the UX review of 1.0
- **Where needed:** ScreenInvoices
- **What is missing or wrong:** The table has Nummer, Klant, Datum, Bedrag, Type and the actions. Payment is tracked per order, so an invoice's state is derivable, but the list never shows it; there is also no preview, only a download.
- **Why it matters:** It is the screen for answering "has this been paid", and that is the column it lacks.
- **Proposal:** A status column using the existing Betaald / Open / Gedeeltelijk badges, with the rule for an invoice whose orders are partly paid, plus a note on whether a credit note shows a status at all.
- **Blocked:** Seeing payment state on the invoice list.
- **Temporary placeholder approved:** no
- **Design system version:** 1.8

## GAP-083 [resolved in v1.9] Instellingen saves per section with no warning about unsaved edits
- **Type:** missing state
- **Found while:** the UX review of 1.0
- **Where needed:** ScreenSettings
- **What is missing or wrong:** The page has four independent "Opslaan" buttons (Prijzen, Printers, Bedrijfsgegevens and the rest) on one 3600px scroll. Editing two sections and saving one loses the other, and nothing marks a section as changed or warns on leaving.
- **Why it matters:** The settings decide every cost and every invoice, and losing an edit is silent.
- **Proposal:** Either one save for the page, or keep per-section saves and specify a changed state (a marker on the section, the button enabled only when dirty) plus a confirmation when leaving with unsaved changes. Needs Dutch copy.
- **Blocked:** Nothing; saving works if you remember which buttons you owe.
- **Temporary placeholder approved:** no
- **Design system version:** 1.8

## GAP-084 [resolved in v1.9] API-docs puts a bordered card around a renderer that draws its own frame
- **Type:** suspected design bug
- **Found while:** the owner's walkthrough of 1.0
- **Where needed:** ScreenApiDocs
- **What is missing or wrong:** The screen wraps Scalar in `.pp-card.pp-flush`, a 1092px bordered, 8px-radius card, and Scalar then draws its own full-width sidebar and panels inside it (measured: card 1092px, Scalar's own layout 1090px). The result is a box inside a box, and the screen does not look like the rest of the app.
- **Why it matters:** It is the only screen whose body is drawn by something else, and the card makes that more visible rather than less.
- **Proposal:** Say how a third-party renderer is framed: either drop the card and let the renderer meet the page padding, or keep the card and state what it adds (padding, a header). The 1.8 rule for third-party renderers covers behaviour but not the frame.
- **Blocked:** The frame around the renderer; its theming is settled and correct.
- **Temporary placeholder approved:** no
- **Design system version:** 1.8

## GAP-085 [resolved in v1.9] Video files are indexed but can never be watched
- **Type:** missing component
- **Found while:** the owner's walkthrough of 1.0
- **Where needed:** AssetListItem on ScreenPrintDetail
- **What is missing or wrong:** Video is a first-class asset type: `.mp4` and `.mkv` are recognised, the timelapse file name is parsed for its recording time and printer prefix, Instellingen has "Timelapse-voorvoegsels" per printer, and the asset list gives it a `film` icon. The only thing you can do with it is download it, and a print whose only asset is a video has no thumbnail, so it shows "Geen voorbeeld".
- **Why it matters:** Timelapses are the record of a print and the system already models them; they are also the obvious thing to show a klant. At the moment the app knows about them and shows nothing.
- **Proposal:** A player for a video asset (inline in the asset list or in a dialog, with a poster frame), and a rule for using a video frame as the print's thumbnail when there is no other image. Needs states for loading and failure and the phone layout.
- **Blocked:** Watching a timelapse, and a thumbnail for video-only prints.
- **Temporary placeholder approved:** no
- **Design system version:** 1.8

## GAP-086 [resolved in v1.9] Only one model can be viewed when a print has several
- **Type:** missing state
- **Found while:** the owner's walkthrough of 1.0
- **Where needed:** Viewer3D on ScreenPrintDetail
- **What is missing or wrong:** The viewer is given one URL per print (`/api/prints/:id/model`), so when a project holds several STLs only one is ever shown and there is no indication that the others exist or any way to reach them in the viewer; they appear in the file list only.
- **Why it matters:** A project is often a set of parts, and the viewer silently shows one of them as if it were the print.
- **Proposal:** A way to choose the model: a select or a strip of thumbnails above or below the viewer, with the rule for which is shown first and what happens with many models. Needs Dutch copy and the phone layout.
- **Blocked:** Seeing anything but the first model.
- **Temporary placeholder approved:** no
- **Design system version:** 1.8

## GAP-087 [resolved in v1.9] The lost-connection state is announced twice at once
- **Type:** improvement idea
- **Found while:** fixing the toast pile-up from the owner's walkthrough
- **Where needed:** OfflineBanner and Toasts; ScreenSystemStates
- **What is missing or wrong:** When the socket drops, the app shows both the offline bar (`.pp-alert.warning.banner`) and a toast with the same sentence, at the same time. The 1.7 README says the bar exists because "The app already toasted the loss and the return", so both are intended, but in practice the two carry identical text.
- **Why it matters:** Two simultaneous notices for one state is noise, and it was the toast half that pushed the pile-up the owner hit.
- **Proposal:** Keep the bar as the state and drop the loss toast, or give them different jobs (the toast for the transition, the bar for the ongoing state) with different copy. Keeping the "Weer verbonden" toast is still useful either way.
- **Blocked:** Nothing; the pile-up itself is fixed.
- **Temporary placeholder approved:** no
- **Design system version:** 1.8

## GAP-088 [resolved in v2.0] Two specs still show the internal link label to the customer
- **Type:** conflict
- **Found while:** implementing v1.9, GAP-077
- **Where needed:** DocOverview and ScreenSharePage; `backend/src/finance/pdf.ts`, `backend/src/sharing/overview.ts`
- **What is missing or wrong:** ScreenSharePage 1.9 resolves GAP-077 with "The link label is internal and no longer appears on the page, in the PDF title or in the tab title". Two anatomy paragraphs were not updated to match. DocOverview still reads: 'Title "Overzicht", the sub-line is the link label.' And **ScreenSharePage contradicts itself inside one file**: its own Anatomy still says 'Top: studio name or logo, heading "Overzicht voor {klant}", the link label and the expiry notice.' The Overzicht PDF is downloaded by the klant, so leaving the label in its sub-line defeats the gap it is meant to resolve, but the two documents now disagree and nothing says what the sub-line should hold instead.
- **Why it matters:** this is the same privacy point as GAP-077, on the one artefact the klant keeps. Labels in this instance read "PR 8 review" and "log check".
- **Proposal:** drop the sub-line from the Overzicht, or give it something customer-facing such as the period covered or the date of the overview. Please say which, and update DocOverview so the two specs agree.
- **Blocked:** nothing. The label is left out of the PDF (an empty sub-line) until DocOverview says what belongs there, marked `ds-gap: GAP-088`.
- **Temporary placeholder approved:** no
- **Design system version:** 1.9

## GAP-089 [resolved in v2.0] A video-only print cannot show a poster frame as its thumbnail
- **Type:** missing component
- **Found while:** implementing v1.9, GAP-085
- **Where needed:** VideoPlayer and Thumbnail; `backend/src/thumbnails/service.ts`
- **What is missing or wrong:** VideoPlayer 1.9 says the thumbnail of a print with no image and no model is the poster frame of its first video, with a play badge. The player is built, but the thumbnail is rendered by the backend, which has no video decoder: it renders PNG, reads 3MF previews and rasterises STL, and its only media library is `@resvg/resvg-js` (SVG).
- **Owner's decision (2026-10-07): no video decoder in the container image.** So option (a) of the earlier proposal is off the table, and the poster rule should come out of VideoPlayer. Only 2 prints of 83 are video-only, so little is lost.
- **What the owner asked for instead:** not a prettier thumbnail but a *warning* — see GAP-090, which asks for missing files to be visible on the dashboard tile.
- **Closed (2026-10-08):** verified in the app rather than assumed. The backend has no poster or video-decoding path in its thumbnail service, 2.0 took the poster rule out of VideoPlayer, and the warning the owner asked for instead is built and measured (GAP-090). Nothing is left to do.
- **Proposal:** drop the poster-thumbnail rule from VideoPlayer and say what a video-only print shows instead (today it is the "Geen voorbeeld" placeholder, which is honest). Keep the play badge only if a poster ever exists.
- **Blocked:** nothing in the app. Waiting on VideoPlayer dropping the rule so the spec matches what is built.
- **Temporary placeholder approved:** no
- **Design system version:** 1.9

## GAP-090 [resolved in v2.1] A print's missing files are not visible until you open it
- **Type:** missing state
- **Found while:** the owner's use of 1.0 after v1.9 (their request, 2026-10-07)
- **Where needed:** PrintCard and PrintRow on ScreenDashboard
- **What is missing or wrong:** a print can be short of the files that matter — no G-code, no 3MF, no STL — and nothing says so until it is opened. The owner wants to see at a glance which files a print lacks, and suggests small icons on the tile rather than the big "Geen prijs"-style labels, with the worry that the tile becomes busy. It is about a file being **absent**, not about judging the quality of one that is there.
- **Why it matters:** the library is the source of truth and the folders are maintained by hand, so a print missing its model or its G-code is a real gap in the archive, not a cosmetic one. Today it is invisible from the dashboard.
- **Measured on the real library (83 prints), to settle how busy a tile becomes:** with the three types in scope, **70% of tiles would carry no icon at all, 24% exactly one, 4% two and 2% three**. Showing what is *present* instead would be the busy version — 88% of tiles would carry three or four icons — so the owner's instinct to mark only what is missing is right, and the proposal below follows it.
- **Per type:** no G-code **22%** (18 of 83), no 3MF **8%** (7), no STL **8%** (7). *(Corrected 2026-10-08: these were first published as 16/5/4%, which were the "only this type is missing" figures below, mislabelled as the per-type totals. The design system caught that they did not add up. The distribution and the combinations were right; only this line was wrong.)* Every combination that actually occurs: G-code alone 16%, STL alone 5%, 3MF alone 4%, G-code+3MF 2%, G-code+3MF+STL 2%, G-code+STL 1%. The two prints missing all three are the two whose only asset is a video.
- **Owner's decision (2026-10-07): video is not in the indicator.** A timelapse is not uploaded for every print, so its absence is not a gap in the archive. Measuring it is what made the question worth asking: it would have marked **40%** of tiles, against 4-16% for the three that remain. Leaving it out is what takes the indicator from "half the tiles" to "70% carry nothing".
- **Dropped by the owner (2026-10-07):** an "incomplete 3MF" flag was part of the original idea and is no longer wanted. Measuring it was what settled it: a proxy for "unsliced" matched **92%** of prints, because a project file downloaded from MakerWorld is normally unsliced and the G-code beside it carries the slice, so there was nothing useful to flag.
- **Proposal:** a small row of icons on the card, under or beside the existing badges, drawn only for what is **missing**, using the file icons the system already names (`file-code` for G-code, `package` for 3MF, `box` for STL) in `muted` or `warning`, each with an accessible name ("Geen G-code"). No icon when nothing is missing, which is 70% of prints, so a complete print stays exactly as clean as it is today. The same information in the list view's existing columns. Needs the Dutch copy, the phone layout, and a decision on whether this is `muted` (a note) or `warning` (a problem).
- **Blocked:** the whole indicator. The data behind it already exists in the app; nothing is drawn.
- **Temporary placeholder approved:** no
- **Design system version:** 1.9

## GAP-091 [resolved in v2.0] Selecting a print needs its checkbox, but the tile looks selectable
- **Type:** unclear spec
- **Found while:** the owner's walkthrough of v1.9 (2026-10-07)
- **Where needed:** PrintCard on ScreenDashboard
- **What is missing or wrong:** Selection is the small checkbox in the corner; the rest of the tile opens the print. The owner expected that once one print is selected, clicking any other tile would select it too.
- **Why it matters:** The bulk actions are the reason selection exists, and the way in is a 20px target in a corner of a large clickable card. GAP-070 made the whole klant tile its control for the same reason.
- **Proposal:** Say what a click on the tile does once a selection is active: the common pattern is that the first selection switches the grid into a selecting mode, where a plain click selects and only the title or an explicit control opens the print. It conflicts with the card being a link, so the system has to decide which wins and how the mode is shown and left.
- **Blocked:** Nothing; selection works through the checkbox.
- **Temporary placeholder approved:** no
- **Design system version:** 1.9

## GAP-092 [resolved in v2.0] A klant chip sets the name and the count in the same weight
- **Type:** suspected design bug
- **Found while:** the owner's walkthrough of v1.9 (2026-10-07)
- **Where needed:** CustomerChips on ScreenDashboard
- **What is missing or wrong:** The chip reads name, print count and open amount. The name is bold and the count is bold too, so the two run together and the count reads as part of the name.
- **Why it matters:** The chip's job is to be scanned; two bold values of different kinds compete.
- **Proposal:** Give the count (and the amount) a lighter weight than the name, as `.pp-chip .amt` already does with `font-weight: 400`. The `.n` element seems to inherit the chip's own weight; a rule for it would settle it.
- **Blocked:** Nothing; it reads badly.
- **Temporary placeholder approved:** no
- **Design system version:** 1.9

## GAP-093 [resolved in v2.0] In the list view only the title opens a print; in the grid the whole card does
- **Type:** unclear spec
- **Found while:** the owner's walkthrough of v1.9 (2026-10-07)
- **Where needed:** PrintRow on ScreenDashboard
- **What is missing or wrong:** A card in the grid is clickable anywhere, a row in the list only on its name. The same list offers the same prints two ways with two different rules.
- **Why it matters:** Switching view changes where you have to aim, which is exactly the kind of thing that is only noticed as friction.
- **Proposal:** Make the row's hit area the row, as the card's is the card: a stretched link over the row with the other controls above it (`z-index: 1`), which is the pattern `.pp-cust-name` already uses since GAP-070. The thumbnail column added in GAP-068 makes the name an even smaller share of the row.
- **Blocked:** Nothing; the row opens from its name.
- **Temporary placeholder approved:** no
- **Design system version:** 1.9

## GAP-094 [resolved in v2.3] The model picker shows names where thumbnails would say more, and a Select above six
- **Type:** improvement idea
- **Found while:** the owner's walkthrough of v1.9 (2026-10-07)
- **Where needed:** ModelPicker on ScreenPrintDetail
- **What is missing or wrong:** The strip draws a `pp-thumb` with a generic box icon and the file name underneath, so the buttons are distinguished by name only. Above six models it becomes a Select, which the owner does not like.
- **Why it matters:** A print holds a median of 3 models and up to 29 here, so this is the normal way to move around a project. File names like `CrealityRFIDHyperPLA3.stl` do not tell the parts apart; a picture would.
- **Proposal:** Render each model as a real thumbnail rather than an icon (the backend can already rasterise an STL, which is how the card thumbnail is made; a per-asset thumbnail endpoint is a small addition on our side). With pictures, the Select may not be needed at all: a scrolling strip of 29 small thumbnails is usable where 29 names are not. Please say whether the strip replaces the Select entirely or keeps it as a fallback above some number.
- **Blocked:** Nothing; the picker works, it just says little.
- **Temporary placeholder approved:** no
- **Design system version:** 1.9

## GAP-095 [resolved in v2.0] The print detail has a lot of empty space now that the viewer is capped
- **Type:** suspected design bug
- **Found while:** the owner's walkthrough of v1.9 (2026-10-07)
- **Where needed:** ScreenPrintDetail
- **What is missing or wrong:** GAP-064 capped the viewer at 560px, which fixed the fold. What is left beside and below it is empty: the viewer sits alone in a full-width row, so the page is mostly whitespace until the order block. The owner reads the order of the page as wrong.
- **Why it matters:** The fold is better but the screen is no denser: the first thing you see is still mostly nothing.
- **Proposal:** Rearrange the top of the print detail now that the viewer is small: the obvious pairing is the viewer beside the print's own facts (tags, spool, status, what is missing) rather than above them, with the order block below at full width. Needs a layout at 360, 768 and 1360px.
- **Blocked:** The top of the print detail.
- **Temporary placeholder approved:** no
- **Design system version:** 1.9

## GAP-096 [resolved in v2.3] A timelapse is buried in the file list while the model gets a viewer
- **Type:** improvement idea
- **Found while:** the owner's walkthrough of v1.9 (2026-10-07)
- **Where needed:** VideoPlayer, ModelPicker and Viewer3D on ScreenPrintDetail
- **What is missing or wrong:** A video is a row in the file list behind a small play button, and it opens in a modal dialog. The 3D model, which is the same kind of thing — a picture of the print — gets the viewer at the top of the page.
- **Why it matters:** A timelapse is the record of the print being made, and on this library 60% of prints have one. Burying it undersells it, and a modal takes you off the page to watch twelve seconds.
- **Proposal:** Treat the timelapse as what it is: visual material of the print, beside the models. Put it in the ModelPicker strip as another entry with a play badge, and let choosing it swap the viewer from the 3D canvas to the player, in place. That removes the dialog, makes the video as findable as the model, reuses a component that exists, and gives the capped viewer area something to do (GAP-095). The file list keeps the download, as it does for every asset.
- **Blocked:** Nothing; the player works, it is in the wrong place.
- **Temporary placeholder approved:** no
- **Design system version:** 1.9

## GAP-097 [resolved in v2.0] Every file is listed inside every order, which repeats the print's contents
- **Type:** suspected design bug
- **Found while:** the owner's walkthrough of v1.9 (2026-10-07)
- **Where needed:** OrderSection and AssetListItem on ScreenPrintDetail
- **What is missing or wrong:** An order shows a Bestanden section holding every asset of the print — STL, 3MF, G-code, video alike — so a print with two orders lists the same files twice, and files that cannot be billed (an STL source, a timelapse) appear inside a billing unit.
- **Why it matters:** It is the main reason the order block is long and repetitive, and it blurs what an order is: the files belong to the print, the order is what is being charged for.
- **Proposal:** Separate the two. One Bestanden section at **print** level, above the orders, where files are browsed, downloaded and played. The order keeps only what it bills: Totaalkosten (which already names the counted files with their grams and price) and Betaling. A Nabestelling then renders cheaply and the order block shrinks to two sections, which is most of the whitespace the owner sees. Per-order controls that act on a file (counting, times printed, the slot spool) would move with the cost breakdown, so please say where they live.
- **Blocked:** The shape of the order block.
- **Temporary placeholder approved:** no
- **Design system version:** 1.9

## GAP-098 [resolved in v2.0] A column menu in Toegang is painted over by the sticky first column
- **Type:** suspected design bug
- **Found while:** the owner's walkthrough of v1.9 (2026-10-07)
- **Where needed:** AccessMatrix on ScreenAccess
- **What is missing or wrong:** Opening the menu on the leftmost klant column puts the panel partly behind the sticky user column: measured at 1360px, the panel spans x=364 to 504 while the sticky column ends at x=410, so **46px of it is covered** and the items read as "s selecteren". It is not clipped by the scroll box (the overflow does not cut it) — the sticky cell paints over it.
- **Why it matters:** The first menu in the row is unusable, and it is the one most likely to be opened. The system's own scale puts `z-popover` (30) well above `z-raised` (1), so the intent is clear and the result does not follow it.
- **Proposal:** The sticky cell and the popover end up in different stacking contexts inside the scroll box. Either the popover has to escape the scroll box, or the sticky column must sit below `z-popover` while the panel is open. Please say which, since it decides whether the menu can be a plain child of the header cell.
- **Blocked:** The leftmost column menu. The others are fine.
- **Temporary placeholder approved:** no
- **Design system version:** 1.9

## GAP-099 [resolved in v2.0] A user's name in Toegang looks interactive but is not the control
- **Type:** unclear spec
- **Found while:** the owner's walkthrough of v1.9 (2026-10-07)
- **Where needed:** AccessMatrix on ScreenAccess
- **What is missing or wrong:** Each row's first cell holds the user's name with a chevron that opens a row menu, but the name itself is not the target and the cursor does not change over it, so clicking the name does nothing. The owner read the names as clickable and found nothing happened.
- **Why it matters:** Same confusion GAP-070 resolved on the klant tile: something that looks like a control and is not.
- **Proposal:** Either make the whole cell the menu trigger (the chevron then being decoration), or draw the name as plain text so only the chevron reads as a control. The first matches what GAP-070 chose elsewhere.
- **Blocked:** Nothing; the menu opens from the chevron.
- **Temporary placeholder approved:** no
- **Design system version:** 1.9

## GAP-100 [resolved in v2.0] Reusing the same password gives "Er ging iets mis"
- **Type:** missing state
- **Found while:** the owner's walkthrough of v1.9 (2026-10-07)
- **Where needed:** ScreenLogin / the forced password change; `frontend/src/auth/NewPasswordPage.tsx`
- **What is missing or wrong:** A new account must replace its temporary password. Entering the same password again is refused by the backend with `password_unchanged` (400), but the page maps only `password_too_short`, so everything else falls through to `error.generic`, "Er ging iets mis". Nothing went wrong; the app discards a precise message and shows a vague one.
- **Why it matters:** It is the first thing a new user does, and the message says the app broke rather than what to do.
- **Proposal:** Copy for the case, on the password field rather than the form: something like "Kies een ander wachtwoord dan het tijdelijke." Please give the key and the wording. The page should also show the field-level error for any other refusal it can name.
- **Blocked:** The message only; the refusal itself is correct.
- **Temporary placeholder approved:** no
- **Design system version:** 1.9

## GAP-101 [resolved in v2.0.1] Instellingen and Tags leave most of their width empty
- **Type:** improvement idea
- **Found while:** the owner's walkthrough of v1.9 (2026-10-07)
- **Where needed:** ScreenSettings and ScreenTags
- **What is missing or wrong:** Both pages are a single narrow column of cards on a wide screen, so the right half is empty while Instellingen is 3600px tall and needs a lot of scrolling.
- **Why it matters:** Not broken, but the owner noticed it twice unprompted, which usually means the page feels unfinished.
- **Proposal:** Say whether these pages use the full width above some breakpoint — two columns of sections for Instellingen, a wider or multi-column list for Tags — or whether a measured column is deliberate. If deliberate, a maximum width would at least make it look chosen rather than accidental.
- **Blocked:** Nothing.
- **Temporary placeholder approved:** no
- **Design system version:** 1.9

## GAP-102 [resolved in v2.0] API-docs still reads as a box inside a box
- **Type:** suspected design bug
- **Found while:** the owner's walkthrough of v1.9 (2026-10-07)
- **Where needed:** ScreenApiDocs
- **What is missing or wrong:** GAP-084 removed the card around the renderer, and the owner still reads the page as a box in a box: Scalar draws its own bordered sidebar and panel inside our page padding, so there are two nested frames whatever we do with the card.
- **Why it matters:** It is the only screen whose body is drawn by something else, and it still does not look like the rest of the app.
- **Proposal:** The frame is not ours to remove, so the question is what the page around it should be: full-bleed to the window with no page padding at all, our own header outside the renderer's, or Scalar's own chrome suppressed through its variables. Needs a drawn example, since the previous answer did not settle it.
- **Blocked:** The frame; the theming is correct.
- **Temporary placeholder approved:** no
- **Design system version:** 1.9

## GAP-103 [resolved in v2.0.1] The share page tells a klant what they owe but gives no way to pay
- **Type:** improvement idea
- **Found while:** the owner's walkthrough of v1.9 (2026-10-07)
- **Where needed:** ScreenSharePage payment block
- **What is missing or wrong:** GAP-078 added IBAN, amount and reference with copy buttons, which is a manual transfer. The owner asks whether the page could offer paying directly, by bank or by Tikkie, which is how most people in the Netherlands settle an amount like this.
- **Why it matters:** The amounts are small and the klanten are private people; a copyable IBAN is several steps, a link is one.
- **Proposal:** Decide whether a payment link belongs on the page, and what it looks like beside "Download overzicht". The honest constraint from our side: a real integration needs an account with a provider and a backend that can create a payment, which is a product decision, not a visual one. A link the studio pastes per klant (a Tikkie link, a payment-request URL) needs no integration and could be a field in Instellingen; that is the cheap version and probably the right first step.
- **Blocked:** Nothing; the manual details work.
- **Temporary placeholder approved:** no
- **Design system version:** 1.9

## GAP-104 [resolved in v2.0] An uploaded SVG logo silently loses all of its text
- **Type:** suspected design bug
- **Found while:** drawing a logo for this installation (2026-10-08)
- **Where needed:** LogoField on ScreenSettings; `backend/src/finance/billing-routes.ts` (the SVG is rasterised with `@resvg/resvg-js`)
- **What is missing or wrong:** the container ships **no fonts at all** (`/usr/share/fonts` does not exist, `fc-list` returns 0), and the rasteriser is given no font configuration, so `<text>` in an uploaded SVG renders as nothing. Measured in the running container with an SVG holding one rectangle and one word: **1600 opaque pixels for the shape, 0 for the text**. Most real logo files are a mark plus a wordmark, or type alone, so the common case is a logo that uploads "successfully" and comes back partly or entirely blank, on screen and on every invoice.
- **Why it matters:** the failure is silent. The upload is accepted, the preview shows what survived, and nothing says that the studio's name has been dropped from its own documents. Settings offers "PNG of SVG" with no caveat.
- **Proposal:** this needs a decision at two levels, so both are stated. **Product:** either ship fonts in the image and point the rasteriser at them (the app already carries the design system's font stack by name, so one metric-compatible face would do), or refuse an SVG whose text cannot be drawn. **Design:** whichever is chosen, LogoField needs the state — a refusal with a reason ("Deze SVG bevat tekst die niet kan worden weergegeven; upload een PNG of zet de tekst om in vormen."), or a warning beside the preview. Copy and the state are the design system's part.
- **Blocked:** nothing is built. This installation's own logo is supplied as PNG, which is unaffected: the app rasterises an SVG to an 800px PNG anyway, so nothing is lost by using one.
- **Temporary placeholder approved:** no
- **Design system version:** 1.9

## GAP-105 [resolved in v2.0] Nothing says what a logo has to satisfy to work in both themes
- **Type:** missing spec
- **Found while:** drawing a logo for this installation (2026-10-08)
- **Where needed:** LogoField on ScreenSettings; the brand slot in AppShell; DocInvoice, DocReminder, DocOverview and ScreenSharePage
- **What is missing or wrong:** the system specifies the slot a logo sits in but never what the file must satisfy. One uploaded file is shown on `surface` in **both** themes with no adaptation — no filter, no second upload, no light/dark pair — and the same file is drawn on white paper in every document. Nothing says so. Settings offers "PNG of SVG. Vervangt de naam op het scherm en op documenten." and stops there.
- **Why it matters:** the obvious choices fail, and they fail silently. A black wordmark vanishes on the dark sidebar; a white one vanishes on the invoice. Even the system's own `primary` cannot do it: `#3659c9` scores 6.12:1 on white but **2.79:1** on `#1a1b26`, and `#7aa2f7` scores 6.79:1 on the dark ground but **2.52:1** on white. A studio with a perfectly good logo gets an invisible one in one theme and has nothing to tell them why.
- **Proposal:** state the contract beside the field and in the component spec: a single file readable on both `surface` grounds (3:1 against each, as for a non-text graphic), no tagline or second line, and a wide aspect. The sidebar caps the logo at `--space-7`, so a second line of type lands near 4px — measured while drawing this one, which is why its tagline was dropped. A mid tone satisfies both grounds; `#5878d6` gives 4.14:1 on white and 4.13:1 on `#1a1b26`. Whether the system would rather solve it structurally — a light/dark pair, or a neutral plate behind the mark — is the design system's call, and is the better answer if the slot is going to stay in both themes.
- **Blocked:** nothing. This installation's logo was drawn to the measured constraint, so it works; the next one has only luck to go on.
- **Temporary placeholder approved:** no
- **Design system version:** 1.9

## GAP-106 [resolved in v2.1] The owner asked for icons and 2.0 gave words
- **Type:** conflict
- **Found while:** the owner's first look at the GAP-090 chip in the running app (2026-10-08)
- **Where needed:** PrintCard, PrintRow, ScreenPrintDetail — the `pp-lacks` chip
- **What is missing or wrong:** the owner asked twice for **small icons on the tile**. 2.0 rejected that half of GAP-090 and specified one word chip instead ("Ontbreekt: G-code, 3MF, STL"). Built as specified, the owner's reaction on seeing it was immediate: *"ik dacht dat je met simpele icoontjes ging werken, niet met texten voor de missende bestanden."* At the long end the chip is 27 characters on a 261px card, and it is the widest thing in the tag row.
- **Why it matters:** the design system's reasons were good ones — three slashed glyphs are three inventions, a legend to learn, and still need a text alternative — but the person who has to read this grid every day has now said twice what they want. This is their product, and the preference is not a misunderstanding of the trade-off; they saw the result and still prefer icons.
- **Proposal:** the design system decides the form, not us. Options worth weighing: the three type icons the system already names (`file-code`, `package`, `box`) at 16px with a slash or at reduced opacity, with a `title` and an off-screen sentence carrying the text alternative; or the chip shortened to the icon plus the types without the word "Ontbreekt:"; or icons on the card and the full chip on the detail page, where there is room.
- **Blocked:** nothing. The word chip is built and works; it is the form that is in question.
- **Temporary placeholder approved:** yes (2026-10-08, the owner did not want to wait). The card and the row show the **triangle-alert** plus the icons the system itself assigns to these types (`file-code`, `package`, `box`) — reused, not invented. The print detail keeps the words, where there is room. The sentence survives as the chip's accessible name and its `title`, so nothing is carried by colour or shape alone. Marked `ds-gap: GAP-106`. Measured after the change: the chip went from 206px to **92px** at its widest and 52px at its narrowest, and axe reports 0 violations in both themes. The gap stays open: the design system still decides the final form.
- **Design system version:** 2.0.1

## GAP-107 [resolved in v2.1] The selection box on a tile reads as oversized
- **Type:** improvement idea
- **Found while:** the same first look (2026-10-08)
- **Where needed:** PrintCard, `.pp-print .pp-sel`
- **What is missing or wrong:** 2.0 gave the selection chip the full tap area and a hairline, so it measures **36×36px around a 20px checkbox** where it was about 24×24 before. The owner: *"De selectiebox is ineens heel erg groot op de tiles."* On a 261px card it is the first thing the eye meets, on every tile, whether or not anything is selected.
- **Why it matters:** the intent was right — the checkbox was not visibly its own control, which is half of GAP-091 — but the cure is now louder than the thing it sits on, and it is drawn 24 times on a dashboard page.
- **Proposal:** keep the 36px *hit* area and shrink what is *drawn*: a 24px visible chip centred in a 36px target (the hit area may exceed the painted box), or drop the hairline on the thumbnail and keep it only on hover and focus. A pointer target can be larger than its paint; WCAG 2.2 2.5.8 asks for the target, not the ink.
- **Blocked:** nothing.
- **Temporary placeholder approved:** no
- **Design system version:** 2.0.1

## GAP-108 [resolved in v2.1] The missing-files chip and "Geen prijs" sit on opposite edges
- **Type:** unclear spec
- **Found while:** the same first look (2026-10-08)
- **Where needed:** PrintCard — the tag row and `pp-foot`
- **What is missing or wrong:** measured on a 261px card: the `pp-lacks` chip starts at the card's left padding, and the "Geen prijs" badge in the footer is right-aligned 141px further along. Two warning chips of the same shape, one left, one right, on consecutive lines. The owner calls the result misaligned. "Geen prijs" has sat on the right since it existed; the new chip simply makes the ragged edge visible.
- **Why it matters:** it is the only place in the system where two chips of the same kind and colour line up against opposite edges, and on a card with no price (about 30% of this library) it is the whole bottom half of the tile.
- **Proposal:** say where a price-less card puts its badge. Either "Geen prijs" joins the tag row beside the missing-files chip, since neither is a price, or the footer keeps it left when the price block is empty rather than pushing it to an edge with nothing opposite it.
- **Blocked:** nothing.
- **Temporary placeholder approved:** no
- **Design system version:** 2.0.1


## GAP-109 [resolved in v2.2] The missing-file icons give a tagless print a whole extra line
- **Type:** improvement idea
- **Found while:** the owner's second look, right after 2.1 was specified (2026-10-08)
- **Where needed:** PrintCard — the icon group's place on the tile
- **What is missing or wrong:** 2.0 and 2.1 both put the icons first in the **tag row**. On a print with no tags that row exists only to hold them, so two 16px glyphs cost a full line of card height. The owner: *"Kunnen de icoontjes niet rechts van de naam, want de naam is niet lang, nu wordt er iedere keer een nieuwe regel gemaakt als er iets mist."* Print names in this library are short and the line beside them is empty, so the room is already there.
- **Why it matters:** the whole point of GAP-090's form was that an indicator should cost nothing on the 58% of tiles that carry none — but on a tagless tile that does carry one, it costs a line, which is the most expensive thing on a 261px card.
- **Proposal:** put the icon group at the end of the `h3`, after the print name, with the name allowed to truncate before the icons do. The tag row then appears only when there are tags. If the design system would rather keep the tag row, the alternative is to let the icons share the meta line, which also already exists.
- **Blocked:** nothing.
- **Temporary placeholder approved:** yes (2026-10-08, the owner did not want to wait). The icons sit at the end of the `h3` beside the name, marked `ds-gap: GAP-109`. Built from the 2.1 icon group unchanged — only its parent differs — so adopting the official answer is moving one element.
- **Design system version:** 2.1

## GAP-110 [resolved in v2.2] A tooltip has no placement, and 400ms is too slow for an icon you do not know yet
- **Type:** unclear spec
- **Found while:** adding a tooltip to the missing-file icons at the owner's request (2026-10-08)
- **Where needed:** Tooltip; the `pp-lacks` icon group on PrintCard and PrintRow
- **What is missing or wrong:** two things. **Placement:** the system styles `.pp-tip` (ground, radius, shadow, 240px cap) but never says where it sits. `.pp-anchor > .pp-pop` has a rule; `.pp-tip` has none, and the Tooltip preview places the bubble statically beside its trigger, which is a preview layout rather than a position. **Timing:** the spec says the bubble appears "after 400ms on hover and immediately on keyboard focus". The owner asked for it to appear immediately: *"Gebruik geen native oplossing, maar een custom oplossing, dan verschijnt de tooltip direct."* A 400ms delay is right for a tooltip that repeats a label you can already read; it is wrong for an icon whose meaning is the only thing the tooltip carries, which is exactly the GAP-106 icons.
- **Why it matters:** without a placement rule every app invents one, and they will differ. Without a timing distinction, the icon set from GAP-106 is learnable only by waiting almost half a second per glyph.
- **Proposal:** add a placement rule to the system (`.pp-anchor > .pp-tip` above the trigger, `z-tooltip`, `pointer-events: none`), and say that a tooltip which **is** the only explanation of a glyph appears at once, while one that repeats visible text keeps its 400ms. A third question for you: the bubble's text here repeats the trigger's own accessible name exactly, so this build marks it `aria-hidden` to stop a screen reader saying the sentence twice. Please confirm, because the spec's `aria-describedby` wording assumes the tooltip adds something the name does not.
- **Blocked:** nothing.
- **Temporary placeholder approved:** yes (2026-10-08). `app-tip` places the bubble from tokens only, and it appears at once. Marked `ds-gap: GAP-110`.
- **Design system version:** 2.1

## GAP-111 [resolved in v2.2] The file row's name column collapses to 75px and its badge overflows onto the controls
- **Type:** suspected design bug
- **Found while:** the owner's third walkthrough, with screenshots of three different prints (2026-10-08)
- **Where needed:** AssetListItem, `.pp-asset`
- **What is missing or wrong:** the rule is

      .pp-asset{grid-template-columns:auto minmax(0,1fr)}
      @container (min-width:760px){.pp-asset{grid-template-columns:auto minmax(0,1fr) auto}}

  The controls column is `auto`, so it takes its max-content width and never yields; the name column is `minmax(0,1fr)`, so it may shrink to nothing. Measured in the running app on a print whose row carries the "Mogelijk dubbel" badge: the controls need **651px**, and just above the 760px breakpoint the name column is left with **75px**. The badge's own min-content width is **128px**, so it overflows its column and is drawn on top of "Aantal keer geprint". Swept across widths, the row is correct at 760, 820, 920, 960, 1000, 1400 and 2000px, and broken at **900px and 1700px** — the widths where three columns are allowed but do not fit.
- **Why it matters:** it is the operator's main screen, the collision lands on the control that the warning text is telling them to use ("Gebruik liever Aantal keer geprint"), and the file name itself stacks one or two characters per line. It is not a narrow-window case: 1700px is a normal desktop.
- **Proposal:** the three-column layout should start where three columns actually fit, not at 760px — the controls alone need 651px, plus the icon and gaps, so about 1000px of container before a name has a usable column. Alternatively let the controls column shrink and wrap (`minmax(0,auto)`; `.acts` is already a wrapping `pp-row`), so the controls reflow instead of squeezing the name. A minimum on the name column would stop the overlap but push the row wider than its container, which the system forbids.
- **Blocked:** nothing is being built on it; the rows render, and at most widths they are correct.
- **Temporary placeholder approved:** yes (2026-10-08, the owner sees it daily). `grid-template-columns: auto minmax(min-content,1fr) minmax(0,auto)` as an app override, marked `ds-gap: GAP-111`, inventing no value and needing no breakpoint — below the system's own breakpoint the controls span columns 2 to -1, so the third track collapses to zero and the narrow layout is untouched. **Letting the controls shrink was not enough on its own:** nothing forces them to while the free space still covers them, so the name track needs the `min-content` floor as well. Re-swept: no collision at any of 760, 820, 900, 920, 960, 1000, 1400, 1700 or 2000px, and the row height at the two broken widths fell from 247px to 139px.
- **Design system version:** 2.1

## GAP-112 [resolved in v2.2] A popover near the bottom of the window opens downwards and falls off the screen
- **Type:** missing state
- **Found while:** the owner asked whether the filament dropdown was also broken (2026-10-08)
- **Where needed:** Popover and SpoolPicker; the rule `.pp-anchor>.pp-pop{top:calc(100% + var(--space-2))}`
- **What is missing or wrong:** a popover is always placed **below** its trigger and never flips. Measured on a print detail at 1400x900: the spool picker's panel is 320x302 and opens at y=831, so **233px of it is below the fold**. It holds 30 spools and a search field; what the owner sees is the search field and almost nothing else. Nothing clips it — it is simply drawn past the bottom of the window.
- **Why it matters:** the file list is long, so most spool pickers on a print detail sit in the lower half of the page, which is exactly where the rule fails. The same rule carries every menu and the tag editor.
- **Proposal:** say what a popover does when it does not fit: flip above the trigger when the space below is smaller than the panel, and cap the panel's height to the space that is left so its own list scrolls rather than the page. The same question applies to the horizontal edge — a tooltip was running 116px off the right of the window for the same reason, which is GAP-110's sibling.
- **Blocked:** nothing; the picker works if you scroll first.
- **Temporary placeholder approved:** yes (2026-10-08, the owner sees it daily). A `useFlipAbove` hook measures the panel once it is up and flips it above the trigger only when the room below is smaller than the panel **and** the room above is larger, so a panel near the top does not flip into the same problem upwards; `app-pop-fit` caps the height so the panel's own list scrolls. Marked `ds-gap: GAP-112`. The flip rule had to be scoped to `.pp-anchor >` to outweigh `.pp-anchor > .pp-pop`, which sets `top`: left in place, top and bottom were both set and the panel squeezed itself to 18px of its 302. Verified on all five pickers of one print detail: worst off-screen 0px, three flipped, none collapsed, axe 0.
- **Design system version:** 2.1

## GAP-113 [resolved in v2.2] The missing-files tooltip reads as a full sentence where a phrase would do
- **Type:** improvement idea
- **Found while:** the owner's reaction to the tooltip built in 2.1 (2026-10-08)
- **Where needed:** the `pp-lacks` tooltip on PrintCard and PrintRow
- **What is missing or wrong:** the accessible name 2.1 specifies is a full Dutch sentence — "Deze print heeft geen G-code-bestand, geen 3MF-bestand en geen STL-bestand." — and the tooltip shows it verbatim. At three missing types that is 76 characters in a 240px bubble, three lines, to say what three icons already say. The owner: *"de tekst van de tooltip mag ook een stuk simpeler, bijvoorbeeld 'Geen 3MF, STL en Gcode'."*
- **Why it matters:** the tooltip exists to teach three glyphs. A phrase does that in one line; a sentence makes the reader find the three words inside it.
- **Proposal:** a short form for the bubble — "Geen G-code, 3MF en STL", keeping the fixed order the system chose by consequence — while the **accessible name** keeps the full sentence, which is read out of context by a screen reader and needs to stand alone. If you would rather both were short, say so and they become one string.
- **Blocked:** nothing.
- **Temporary placeholder approved:** yes (2026-10-08). The bubble shows the short phrase, marked `ds-gap: GAP-113`; the accessible name is unchanged.
- **Design system version:** 2.1

## GAP-114 [resolved in v2.3] 2.2's floating panels are still trapped by the card they live in
- **Type:** suspected design bug
- **Found while:** the owner's fourth walkthrough, with both symptoms photographed (2026-10-08)
- **Where needed:** Tooltip (`.pp-tip.at`), Popover (`.pp-anchor > .pp-pop`), and `.pp-card`
- **What is missing or wrong:** two separate faults with one cause — a panel is still at the mercy of its ancestors.
  1. **`.pp-tip.at` does not reset `bottom`.** The anchored rule `.pp-anchor > .pp-tip` sets `bottom: calc(100% + var(--space-1))`, and `.at` sets `position: fixed` with `top`. Both rules are two classes, so `.at` wins only the properties it names; `bottom` survives. A fixed box with **both** edges set is sized to fit between them, and the bubble collapses to its own padding: measured **8px tall where its text needs 24px**, which is the dark sliver the owner photographed. It is the same shape as the mistake I made in my own placeholder, where leaving the system's `top` in place squeezed a 302px panel to 18px.
  2. **A popover is clipped by its card.** `.pp-pop` is `position: absolute` and `.pp-card` is `overflow: hidden`, so the spool picker is cut off at the card's edge — measured on a print detail: a 302px panel inside `section.pp-card:hidden`, with the cost table painting over what is left. 2.2 gave the tooltip a window-placed form for exactly this reason ("required whenever an ancestor clips or scrolls") but gave the popover none, so the picker has nowhere to go. The owner's question is the right one: *"waarom kan die dropdown niet gewoon bovenop"* — flipping, capping and sheeting all assume the panel is visible in the first place.
- **Why it matters:** the two most-used floating things in the app are both unusable in their most common position. It is not a corner case: every spool picker on a print detail is inside a card, and every missing-file tooltip is inside a print card.
- **Proposal:** (1) `.pp-tip.at` resets the edges it does not use (`bottom: auto`, and `right: auto` for `.end`), so the window-placed form is self-contained wherever it is written. Also say whether an `.at` bubble may sit inside a `.pp-anchor` at all. (2) Give the popover the window-placed form the tooltip has — `.pp-pop.at` with the trigger's rect — or say that a card must not clip an open panel, which is the cheaper rule but puts the obligation on every card in the system.
- **Blocked:** nothing; both are built as placeholders below.
- **Temporary placeholder approved:** yes (2026-10-08, the owner has now reported both twice). The tooltip's wrapper is **not** a `.pp-anchor`, so the stray `bottom` never applies; it lifts itself above the stretched card link, which the anchor had been doing. The card stops clipping while a panel is open. Both marked `ds-gap: GAP-114`.
- **Design system version:** 2.2

## GAP-115 [resolved in v2.3] A file says "Kies een spoel" while it is already being costed with the print's spool
- **Type:** missing state
- **Found while:** the owner's fourth walkthrough (2026-10-08): *"in de prints detail heb je een spool keuze boven aan de pagina en vervolgens in de bestelling, is totaal losgekoppeld"*
- **Where needed:** SpoolPicker, AssetListItem, CostBreakdown, ScreenPrintDetail
- **What is missing or wrong:** there are two spool controls on a print detail — "Spoel voor de hele print" in the "Deze print" card, and one per file or slot inside an order — and nothing on screen says how they relate. They are **not** independent: the print's spool is the fallback used to cost every slot that has none. Measured on one print, setting it through the real control and clearing it again: with no print spool the total was **€ 7,05**; after choosing one the total became **€ 5,13**; after clearing it, € 7,05 again. The file's own trigger said **"Kies een spoel" the whole time**, including while that spool was being used to cost it. The only feedback that anything happened is a total that silently moves.
- **Why it matters:** the control states the opposite of the truth. A file that *is* being costed with a spool offers "Kies een spoel", which reads as "nothing is set here", so the operator either sets it again per file or distrusts the total. It also makes the whole-print control look decorative, which is how it was reported. No print in this library of 83 has a whole-print spool set — plausibly because it has never looked like it does anything.
- **Proposal:** the design system owns how an inherited value appears in a control that can override it. Some directions, all replaceable: the file trigger shows the inherited spool in `muted` with a word that marks it as inherited ("Van de print: 3DJAKE Orange") and only turns normal weight once that file has its own; or the trigger keeps "Kies een spoel" and the row carries the inherited name in its meta line, beside "Telt in Bestelling 1"; or CostBreakdown's Bron column names it, since that is where the number it changed already lives. Whichever it is, "no value here" should stop being shown for a value that exists.
- **Blocked:** nothing is built on it; the costing is correct, only its account of itself is not.
- **Temporary placeholder approved:** no
- **Design system version:** 2.2

## GAP-116 [resolved in v2.3] The owner wants the model strip to scroll sideways at any count, and there are no per-model renders
- **Type:** conflict
- **Found while:** the owner read ModelPicker in the component gallery (2026-10-08)
- **Where needed:** ModelPicker, ScreenPrintDetail
- **What is missing or wrong:** two things, and the second is a correction of mine.
  1. **The overflow direction.** 2.0.1 decided that above eight pictures the strip wraps into a bounded grid that scrolls down, on my measurement that 29 models is about 2,400px of sideways scrolling. The owner wants it to keep scrolling **sideways** with the small previews visible: *"ik zou liever zijwaarts willen scrollen met gewoon de kleine previews zichtbaar."* Measured for this library, models plus timelapses per print: median **4**, 64 of 83 prints are at eight or fewer, 14 are 9–15, 5 are above 15, the largest is **34**. So the question only touches 19 prints of 83, and the base `.pp-models` already scrolls sideways with a fading edge — the deviation is only that `wrap` is never applied.
  2. **There are no per-model renders, and I told you there were.** GAP-094's button is specified as "the per-model render when one exists, else the type glyph and the name", and in the 2.0.1 round I answered your measurement question with "one PNG per model file, not per print". That was wrong, and you used it to strengthen the rejection of the Select. The thumbnail service renders **one image per print record** (`thumbnails.get(recordId)`), chosen from a candidate asset; there is no per-asset thumbnail route. So every button in the strip shows the type glyph and the file name, whatever the count, and the information argument for a strip over a list is weaker than we both thought.
- **Why it matters:** the strip is the operator's way through a print that holds up to 34 pictures, and it is currently a Select above six — the 1.9 form both sides reject. Whatever is decided, the Select goes.
- **Proposal:** decide the overflow direction knowing the real distribution (19 prints of 83 ever reach it) and knowing the buttons are glyphs, not pictures. If per-model renders are wanted, that is indexer work and belongs in its own gap rather than being assumed by this one.
- **Blocked:** nothing.
- **Temporary placeholder approved:** yes (2026-10-08). The strip is used at every count and never wraps, marked `ds-gap: GAP-116`.
- **Design system version:** 2.2

## GAP-117 [resolved in v2.3] The file list stands between the operator and the price on every print
- **Type:** improvement idea
- **Found while:** the owner asked whether files could be less prominent on the print detail (2026-10-08)
- **Where needed:** ScreenPrintDetail, the order of `pp-pdfiles` and `pp-orders`
- **What is missing or wrong:** 2.0 puts the print's file list **third**, between the media row and the orders, on desktop; on a phone it is placed last for exactly the reason that applies here too. Measured on an ordinary print: the page is 1892px, the list is **585px — 31% of it** — it starts at y=652 and the orders do not start until y=1257. So on every print the operator scrolls past the whole inventory to reach the price and the payment, which is the thing they open the page to do. Files per print: median **5**, 17 prints hold more than ten, the largest holds **48**.
- **Why it matters:** it is the daily path. The phone layout already concedes the point; the desktop layout does not.
- **Proposal:** put `pp-pdfiles` after `pp-orders` on desktop as well, which is what the phone order already says, and give the list its own maximum height with its own scroll so a 48-file print cannot set the page's length. The owner also asked whether the list should be collapsible or folded into "Deze print"; I would argue against both — a disclosure costs a click on the thing the page is for, and "Deze print" is deliberately facts without controls.
- **Blocked:** nothing.
- **Temporary placeholder approved:** yes (2026-10-08, the owner chose the reorder). The list moves after the orders, marked `ds-gap: GAP-117`.
- **Design system version:** 2.2


## GAP-118 [resolved in v2.7] "Geldt nu voor 2 slots" is shown while no whole-print spool is set
- **Type:** unclear spec
- **Found while:** verifying GAP-115 in the running app after importing 2.3 (2026-10-08)
- **Where needed:** SpoolPicker, the print-level control on ScreenPrintDetail
- **What is missing or wrong:** 2.3 gives the whole-print control a line that "says what the whole-print choice is doing right now": `spool.wholePrint.applies`, "Geldt nu voor {n} slots zonder eigen spoel.", with `spool.wholePrint.appliesNone` when every slot has its own. The condition named is about the slots, not about whether a spool is chosen, so on a print with **no** whole-print spool the line reads "Geldt nu voor 2 slots zonder eigen spoel." while nothing is in force. Measured on such a print: the trigger says "Kies een spoel", the total is EUR 1,86, and the line still claims two slots are covered. After choosing a spool the same line is true and the total is EUR 1,39.
- **Why it matters:** it is the same shape as the fault GAP-115 was raised for — a control stating something is in force when it is not — and it is on the very control that gap fixed.
- **Proposal:** show the line only while a whole-print spool is set, and say nothing when there is none (the trigger's own placeholder already says there is nothing); or keep it always and change the tense, e.g. "Geldt voor {n} slots zonder eigen spoel" as a description of what a choice here would cover. The first reading is mine; the choice is yours because it is your sentence.
- **Blocked:** nothing. The line is built exactly as 2.3 specifies, including in the no-spool case, so the app follows the spec until you rule.
- **Design system version:** 2.3

## GAP-119 [resolved in v2.6] A 68px name box holds 96% of this library's model names badly, and cuts the extension off
- **Type:** conflict
- **Found while:** the owner asked about the truncated names after per-model renders landed (2026-10-09)
- **Where needed:** ModelPicker, `.pp-modelbtn .nm` on ScreenPrintDetail
- **What is missing or wrong:** two things, and the first is a conflict with your own written rule.
  1. **The name is end-truncated where the system says file names are middle-truncated.** `README.md` says to use `--font-mono` for file names and "middle-truncate them"; `.pp-modelbtn .nm` is `text-overflow: ellipsis`, which cuts the end. So "Honeycomb.stl" reads "Honeyco…" and **the extension is the first thing lost** — on a strip that mixes STL and 3MF, the extension is exactly what tells two buttons apart. The compact form's spec says "middle-truncated as file names are everywhere else"; the square form's does not, and its CSS does the opposite. `AssetList` already middle-truncates in this app, so the two forms disagree on the same screen.
  2. **68px cannot hold these names at all.** Measured across all 83 prints, 501 model and timelapse names: median **25 characters / 181px** in mono `text-xs`, p90 57 / 412px, longest 105 / 759px. The name box inside a 76px button measures **68px**, which fits about 6–11 characters depending on the letters. **483 of 501 names — 96% — overflow it.** On a print whose names happen to be short (Basic.stl, Layers.stl) only 3 of 11 truncate, so this looks milder than it is.
- **Why it matters:** the pictures now distinguish the buttons, which is what GAP-094 asked for, but the name under them is the only thing that says *which file* — and for 96% of them it is a fragment without an extension. The caption above the strip gives the full name of the **selected** model only; for every other button there is nothing visible.
- **Proposal:** three parts, and the first is the one I would not need permission for if the CSS agreed with the README.
  1. Middle-truncate the square form's name, as the compact form and the rest of the system already do, so the extension survives.
  2. Say how a name that does not fit is read without choosing the button. The system already has `.pp-tip` and this app has a working custom tooltip on the missing-file chips; the obvious answer is a tooltip carrying the full name, but ModelPicker specifies none and I will not invent one.
  3. Consider whether the square stays 76px now that it holds a real picture. A wider button costs sideways scrolling, which the owner chose over wrapping, so this may well be "no" — but the figure above is what the choice should be made against.
- **The owner's counter-proposal, and the measurement it needs:** they asked whether the name should simply be **dropped when a button has a picture** — the picture distinguishes the buttons, and a fragment without an extension may be worse than nothing. Measured across the library: of **74** prints with two or more pictures, **66 are fine** that way, but **8 have at least one pair of renders that are pixel-identical** (87 identical pairs out of 1682 compared, a 16x16 alpha-weighted luminance signature at distance 0). The clearest case is a print whose models are `obj_2_new card divider size.stl` through `obj_7_…`: six buttons, one picture, and the only difference is **at the start of the name**. My recommendation is to keep the name, because that is the case the strip exists for — but the owner's instinct is right about the other 89%, and if you want the name gone where it adds nothing, the exception has to be real identical renders rather than a count.
- **Blocked:** showing a model's full name on any button but the selected one. The pictures and the strip itself are unaffected.
- **Design system version:** 2.3

## GAP-120 [resolved in v2.7] Two files with the same name in one print raise no "Mogelijk dubbel"
- **Type:** missing state
- **Found while:** answering 2.6's question about the duplicate-name case (2026-10-09)
- **Where needed:** AssetListItem, the file list on ScreenPrintDetail
- **What is missing or wrong:** 2.6 asks whether the duplicate-name pairs reach the duplicate badge, because if they do the model strip needs no new words — the explanation already sits one card below it. They do not. Measured on the print that holds `Babybox lock corner 2.stl` twice: both asset rows come back with `possibleDuplicate: null` and `duplicateOf: null`, and the page never renders "Mogelijk dubbel". The badge is raised for a duplicate *file* (same content, as the indexer decides), not for two files that merely share a name across folders.
- **Why it matters:** the model strip now draws two buttons with the same picture and the same label, which is honest but unexplained. 2.6 accepted that deliberately on the understanding that the file list says what is going on; it does not. Three pairs in two prints of 83 — rare, but the one case where the strip cannot help the operator at all.
- **Proposal:** either widen what raises the badge to include two assets of one print sharing a file name (a different sentence from the content-duplicate one — these are two real files, not a copy), or say in AssetListItem that this condition is deliberately unmarked and the strip must carry it alone. The first is mine; the choice is yours, and it is a question about the file list rather than about the picker.
- **Blocked:** nothing. The strip is built and behaves as 2.6 specifies, including showing the same label twice.
- **Design system version:** 2.6

<!--
  The numbering jumps from 120 to 146: the design system issued GAP-121 to
  GAP-145 in versions 2.8, 2.9 and 2.10, which this repository has not imported
  yet. Those numbers are theirs. Mine continue after them.
-->

## GAP-146 [open] One bundle.css rule makes the klant tile's menu paint under its own Factuur button
- **Type:** suspected design bug
- **Found while:** the owner's walkthrough of the klant overview dialog (2026-10-17)
- **Where needed:** CustomerCard, OverflowMenu on the "Alle klanten" dialog and the dashboard tiles
- **What is missing or wrong:** opening the "⋯" menu on a klant tile draws it **behind** the Factuur button. The app uses `.pp-anchor` and `.pp-pop.pp-menu` exactly as OverflowMenu specifies; the cause is one rule in `bundle.css`:

  ```css
  .pp-cust .acts .pp-btn,.pp-cust .end .pp-anchor{position:relative;z-index:1}
  ```

  It lifts both above the tile's stretched link, which is right. But giving `.pp-anchor` a `z-index` makes it a **stacking context**, so `.pp-pop`'s `z-index: var(--z-popover)` (30) is compared only *inside the anchor* and no longer against anything in the card. The anchor and the Factuur button are then both at `z-index: 1` in the card's context, and DOM order decides — `.acts` comes after `.hd`, so the button wins.

  Measured in the running app: the menu spans y=343–438, the Factuur button y=379–411, and `elementFromPoint` at their overlap returns the button. Both stacking chains confirm it: `span.pp-anchor.end pos=relative z=1` and `button.pp-btn pos=relative z=1`, siblings in `div.pp-card.pp-cust`.
- **Why it matters:** two of the menu's three items are unreachable on every klant tile, and the one destructive action in it ("Klant verwijderen") is among them. It is also GAP-098's lesson in a new place — a z-index only counts inside its own stacking context — which suggests the rule rather than the component.
- **The `.at` form alone does not fix it, and I found that out by building it.** My first attempt swapped `.pp-anchor` for `.pp-lift` and added `.at`, which made the panel `position: fixed`. The owner still saw the bug. A fixed box escapes *clipping*, not its ancestors' stacking contexts — and `.pp-lift` is `position:relative;z-index:var(--z-raised)`, so it traps a panel exactly as `.pp-anchor` does. The real failure is also wider than one card: in the owner's screenshot it is the **next tile's** Factuur button covering the menu, because every tile's lifted children sit at `z-index: 1` in the grid's context and DOM order decides between them.
- **What does fix it:** taking the panel out of the card's subtree altogether — but only as far as the dialog it is in. Portalled all the way to the body it is worse, not better: a modal `<dialog>` paints in the top layer, so a panel outside it lands beneath the whole modal. Measured all three ways over a grid of 575 points per menu covering the panel's whole area: anchored, 1 of 11 menus clear; portalled to the body, 0 of 11; portalled to the nearest open `<dialog>`, **11 of 11 clear**.
- **Proposal:** either drop `z-index` from the `.pp-anchor` half of that rule (`position: relative` alone lifts it above the link without making a context), or say in Popover that a window-placed panel must leave its stacking context and name where it goes. The second is the general answer, because the first fixes this card and leaves the next component to rediscover it — which is what happened here between the model strip's bubble (2.6, a sibling of `.pp-models`) and this menu.
- **A caution for whoever measures this next:** sampling each menu item's centre is not enough. The covering button landed in the *gap between* two items, so a centre-point check reported the menu clear while the owner could see it covered. The grid is what caught it.
- **Blocked:** the klant tile's "⋯" menu, everywhere it appears.
- **Temporary placeholder approved:** yes (2026-10-17, the owner reported it as a bug and asked for it fixed). OverflowMenu uses `.pp-pop.at` and portals the panel into the nearest open `<dialog>`, else the body, marked `ds-gap: GAP-146`.
- **Design system version:** 2.7

## GAP-147 [open] A modal says Esc closes it and nothing about clicking outside
- **Type:** missing state
- **Found while:** the same walkthrough (2026-10-17)
- **Where needed:** Dialog, and every dialog built on it
- **What is missing or wrong:** Dialog's Accessibility line says "Esc closes (unless a request is running)" and the spec says nothing about a click on the backdrop. The app implements exactly that, so the klant overview can only be dismissed with Esc or the close button. The owner expected a click beside the panel to close it, and said so unprompted — which is the usual convention for a dialog that only shows information.
- **Why it matters:** it is the first thing a mouse reaches for, and this particular dialog has no form to lose: it lists klanten and every action in it opens something else. A dialog that *does* hold unsaved input would want the opposite, which is why this needs a rule rather than a local fix.
- **Proposal:** say per dialog kind. A dialog with no input (this one, a preview) closes on a backdrop click; one holding a form or a destructive confirmation does not, because a stray click would discard work. If that split is right, the rule belongs in Dialog's README beside the Esc line, and ConfirmDialog is explicitly excluded.
- **Blocked:** nothing; Esc and the close button work.
- **Temporary placeholder approved:** yes (2026-10-17, the owner asked for it). A backdrop click closes a dialog that has no `onSubmit` and is not an `alert`, marked `ds-gap: GAP-147`.
- **Design system version:** 2.7

<!--
  GAP-121 to GAP-145 were raised by the design system itself, in versions
  2.8, 2.9 and 2.10, rather than by this app. They are recorded here so the
  log is the whole record and so nobody reuses a number — which nearly
  happened with 146 and 147. Each entry says what it was about and how it was
  decided; the reasoning lives in the changelog of the version named.
-->

## GAP-121 [resolved in v2.8] Do the tags earn their place, now that the five production tags look like a state machine?
- **Type:** raised by the design system (v2.8)
- **Found while:** the request-lifecycle rounds, 2.8
- **Where needed:** see 2.8 in `changelog.md`
- **What is missing or wrong:** Do the tags earn their place, now that the five production tags look like a state machine?
- **Decision:** **Yes — as labels, and the rule for what a tag may be is written down.** A tag is a property; a label whose values are mutually exclusive and ordered is state and gets a status. The reason is mechanical and in this system: TagEditor's rows are checkboxes, FilterBar's tag filter is AND, tags have no order and carry no date, so `printing` + `done` on one print is representable and nothing refuses it. Of the owner's five, `gift` is a tag; `waiting`, `abandoned`, `printing`, `done` are stages. **Nothing to build** — no class, token, copy key or migration
- **Status as published:** resolved
- **Design system version:** 2.8

## GAP-122 [resolved in v2.8] What shape a record with no files takes
- **Type:** raised by the design system (v2.8)
- **Found while:** the request-lifecycle rounds, 2.8
- **Where needed:** see 2.8 in `changelog.md`
- **What is missing or wrong:** What shape a record with no files takes
- **Decision:** **Not the shape of a record with files.** No PrintCard, no thumbnail well, no SpoolSwatch, no 40px `.pp-thumb`, and the "no preview" box icon is **not** reused — it means *this print has no picture*, not *this job has no files*, and one glyph may not carry both. It reads as a line of text: a `.pp-table` row or a stacked block. **Nothing to build today**; it is a refusal that binds whatever gets built
- **Status as published:** resolved
- **Design system version:** 2.8

## GAP-123 [resolved in v2.10] Where a fileless record lives
- **Type:** raised by the design system (v2.10)
- **Found while:** the request-lifecycle rounds, 2.10
- **Where needed:** see 2.10 in `changelog.md`
- **What is missing or wrong:** Where a fileless record lives
- **Decision:** **Confirmed, and now live rather than hypothetical.** The owner chose **hand-linking** — requests reach him anywhere and he only ever makes folders on his laptop — so a record exists with no folder, and ScreenQueue is the **only** place it appears: not the dashboard grid or list, not "{shown} van {total} prints", not the klant count, not the print search. It joins all of them the moment it has files, with no special case
- **Status as published:** confirmed as built
- **Design system version:** 2.10

## GAP-124 [resolved in v2.10] The queue: page or a block on the dashboard
- **Type:** raised by the design system (v2.10)
- **Found while:** the request-lifecycle rounds, 2.10
- **Where needed:** see 2.10 in `changelog.md`
- **What is missing or wrong:** The queue: page or a block on the dashboard
- **Decision:** **A page, `/wachtrij`, and my instinct was wrong.** 2.8 set the threshold at about eight and said no screen gets a nav item for three rows. Measured: **about 4 open requests at a normal moment, regularly above 10** — and the state that costs him is not the steady one, it is *"die moet ik dan allemaal onthouden"*. Two collapsible groups keyed on the states that shipped in 2.9, built from `.pp-ogrp` unchanged, both open by default because at four to ten rows the value is seeing them all. No stat tiles and no expand-all toolbar (GAP-101's lesson), and the ten-row cap with "Toon alle {n} regels" i
- **Status as published:** resolved
- **Design system version:** 2.10

## GAP-125 [resolved in v2.8] Should the queue schedule — dates, priorities, drag-ordering, "when will this print"
- **Type:** raised by the design system (v2.8)
- **Found while:** the request-lifecycle rounds, 2.8
- **Where needed:** see 2.8 in `changelog.md`
- **What is missing or wrong:** Should the queue schedule — dates, priorities, drag-ordering, "when will this print"
- **Decision:** **No.** One operator, one printer, 84 prints. A stage per job is the whole value; a planner is a second product with its own staleness problem, and every date in it would be an asserted fact nobody re-checks. Rejected now, before it is asked for, so the queue does not grow into one
- **Status as published:** rejected (scheduling is a second product; a stage per job is the whole value)
- **Design system version:** 2.8

## GAP-126 [resolved in v2.8] Carrying the request lifecycle in the payment StatusBadge
- **Type:** raised by the design system (v2.8)
- **Found while:** the request-lifecycle rounds, 2.8
- **Where needed:** see 2.8 in `changelog.md`
- **What is missing or wrong:** Carrying the request lifecycle in the payment StatusBadge
- **Decision:** **No.** That badge's payment group means *money owed* and the whole UI reads it that way; the completeness group means *an input is missing from a record*, which a declined quote is not. A request stage is its own group, neutral or `info`, never `paid`/`unpaid`/`warning`
- **Status as published:** rejected (the payment group means money owed; a request stage is not money)
- **Design system version:** 2.8

## GAP-127 [resolved in v2.9] How a declined quote reads
- **Type:** raised by the design system (v2.9)
- **Found while:** the request-lifecycle rounds, 2.9
- **Where needed:** see 2.9 in `changelog.md`
- **What is missing or wrong:** How a declined quote reads
- **Decision:** **Built as specified and verified.** `Niet doorgegaan` with the neutral badge, the amount `muted` and prefixed "was" with **no strikethrough**, the date, and out of every total — measured: a declined order leaves Openstaand, EUR 299,82 → 299,65 → 299,82, and comes back. The three words are exactly as written. Nothing in the system changes
- **Status as published:** confirmed as built
- **Design system version:** 2.9

## GAP-128 [resolved in v2.10] The matching mechanism
- **Type:** raised by the design system (v2.10)
- **Found while:** the request-lifecycle rounds, 2.10
- **Where needed:** see 2.10 in `changelog.md`
- **What is missing or wrong:** The matching mechanism
- **Decision:** **The owner chose, and it is the option I ranked first for UI cost — for a reason neither of us had.** Not "fewest controls": **capture**. A request arrives while he is in someone's kitchen or on the road, and "empty folder first" would ask him there to do the one thing he only ever does at his laptop. "Aanvraag toevoegen" works in a phone browser with no folder. The UI consequence is one control, **"Bestanden koppelen"**, on the row that has none — and it links to a folder that exists; nothing creates one (rule 7)
- **Status as published:** resolved
- **Design system version:** 2.10

## GAP-129 [open] Whether a tag set really does hold two stages at once in the real library
- **Type:** raised by the design system (v2.8)
- **Found while:** the request-lifecycle rounds, 2.8
- **Where needed:** see 2.8 in `changelog.md`
- **What is missing or wrong:** Whether a tag set really does hold two stages at once in the real library
- **Decision:** My central argument in GAP-121 is mechanical and I have not seen it happen. If **no** print carries two of the four stage tags, the argument is sound but theoretical, and I want that on the record rather than implied. **Production only** — the local build has 0 tags, so this is the owner's to answer, not the implementer's
- **Status as published:** needs your measurement
- **Design system version:** 2.8

## GAP-130 [resolved in v2.8] `pp-allcust` on the wrong element in the app — and the spec that could not have told them
- **Type:** raised by the design system (v2.8)
- **Found while:** the request-lifecycle rounds, 2.8
- **Where needed:** see 2.8 in `changelog.md`
- **What is missing or wrong:** `pp-allcust` on the wrong element in the app — and the spec that could not have told them
- **Decision:** **The dialog's markup is named, which it never was.** `pp-allcust` goes on the same element as `pp-dialog`; `pp-custs` is the grid wrapper inside `.pp-body` and appeared in **no README in this system**, only in `bundle.css` and the preview. The app bug is the implementer's; the half of it that is a spec hole is mine, and this closes it
- **Status as published:** resolved
- **Design system version:** 2.8

## GAP-131 [resolved in v2.9] Setting a state from a selection
- **Type:** raised by the design system (v2.9)
- **Found while:** the request-lifecycle rounds, 2.9
- **Where needed:** see 2.9 in `changelog.md`
- **What is missing or wrong:** Setting a state from a selection
- **Decision:** **Built: `Status instellen` beside `Prijs instellen`**, verified on three prints at once, axe 0, 1455 backend tests on three databases
- **Status as published:** confirmed as built
- **Design system version:** 2.9

## GAP-132 [resolved in v2.8] Is **revision** — v1…v5 of one design, where the later supersedes the earlier — a fourth thing, or is it what 
- **Type:** raised by the design system (v2.8)
- **Found while:** the request-lifecycle rounds, 2.8
- **Where needed:** see 2.8 in `changelog.md`
- **What is missing or wrong:** Is **revision** — v1…v5 of one design, where the later supersedes the earlier — a fourth thing, or is it what *in progress* looks like?
- **Decision:** **A fourth thing, and the answer is a rule rather than a feature.** It is not a stage: the three request states are about the **job**, revision is about the **files**, and a job sitting in `Mee bezig` is exactly where versions accumulate — so the stages do not cover it and do not conflict with it either. Supersession is the **third relation** between two files of one print and the only one carrying a direction. The rule: **a direction between two files may be drawn only where it is observed or recorded, never where it is read out of the file's name.** Nothing is drawn until it is recorded
- **Status as published:** resolved
- **Design system version:** 2.8

## GAP-133 [resolved in v2.8] Making the model strip version-aware: v5 first, v1–v4 collapsed, one marked "huidige"
- **Type:** raised by the design system (v2.8)
- **Found while:** the request-lifecycle rounds, 2.8
- **Where needed:** see 2.8 in `changelog.md`
- **What is missing or wrong:** Making the model strip version-aware: v5 first, v1–v4 collapsed, one marked "huidige"
- **Decision:** **No.** The direction would be inferred from the middle of a long file name — the exact zone 2.4–2.6 proved unreadable (`v10` sorts before `v9`; `Fidget Clicking Wheel 2.0` is a product name) — off a figure its own author calls a regex. Hiding four buttons on that basis is GAP-115's fault with a worse consequence: the operator cannot reach a file. The sort stays the file name and every button stays an equal
- **Status as published:** rejected (the direction would be inferred from the one zone of a name this system cannot read)
- **Design system version:** 2.8

## GAP-134 [resolved in v2.8] How much of 2.6's accepted residue is version pairs rather than distinct parts
- **Type:** raised by the design system (v2.8)
- **Found while:** the request-lifecycle rounds, 2.8
- **Where needed:** see 2.8 in `changelog.md`
- **What is missing or wrong:** How much of 2.6's accepted residue is version pairs rather than distinct parts
- **Decision:** **Zero of 55 — my hypothesis is falsified and 2.6 was right.** The pair that prompted it is two files with the byte-identical name (the GAP-120 case), not `v1` against `v2`; versions in this library never collide. 2.6's residue is exactly what 2.6 called it. **It strengthens GAP-132** rather than weakening it: supersession is a relation the label never meets, not a special case of one it does
- **Status as published:** confirmed as built
- **Design system version:** 2.8

## GAP-135 [resolved in v2.8] The label rule had two floors and no ceiling, so a sweep derived from it can propose a tail longer than its ow
- **Type:** raised by the design system (v2.8)
- **Found while:** the request-lifecycle rounds, 2.8
- **Where needed:** see 2.8 in `changelog.md`
- **What is missing or wrong:** The label rule had two floors and no ceiling, so a sweep derived from it can propose a tail longer than its own window
- **Decision:** **The ceiling is stated as arithmetic, and the spec hole was mine.** The tail never exceeds `W - 1 - 2` characters **including the extension** — **12** at the strip's 15-character window — the head is `W - 1 - tail`, and the sweep runs over the tail from `extension + 3` up to 12 and back down to the bare extension (stem at most 8 for a four-character extension). 2.5 wrote the floors and not the bound, and an implementation grew the *stem* to `W - 1 - 2` and added the extension, proposing a 16-character tail in a 15-character box. Latent, not live, in this library; the code fix is the implement
- **Status as published:** resolved
- **Design system version:** 2.8

## GAP-136 [resolved in v2.8] The split I derived by subtraction, and what class of figure any of these counts are
- **Type:** raised by the design system (v2.8)
- **Found while:** the request-lifecycle rounds, 2.8
- **Where needed:** see 2.8 in `changelog.md`
- **What is missing or wrong:** The split I derived by subtraction, and what class of figure any of these counts are
- **Decision:** **16 separated, not the 19 I derived — and the split is three buckets, not two: 55 = 3 byte-identical + 16 separated + 36 unreachable.** `55 - 36` counts the byte-identical pairs as separated; they are **neither**, because the rule never runs where there is nothing to tell apart. That is the rule's **domain**, not a failure of it, and it is now stated as such. Second half, and it is a rule: **a figure counted from a re-implementation of a spec is "as specified", not "as rendered"**, and may not be quoted as the latter
- **Status as published:** resolved
- **Design system version:** 2.8

## GAP-137 [resolved in v2.9] `/prints:ro` is about **ownership**, not only safety
- **Type:** raised by the design system (v2.9)
- **Found while:** the request-lifecycle rounds, 2.9
- **Where needed:** see 2.9 in `changelog.md`
- **What is missing or wrong:** `/prints:ro` is about **ownership**, not only safety
- **Decision:** **New rule 7.** Nextcloud owns that tree; anything written behind it is invisible to the person it was written for. So **no screen may offer to put a file where the operator will look for it** — no "create folder", no "save to the prints folder", no "export here", and no empty state that tells them the app will make a place for their files. The portal reads that tree and writes to it never. This generalises past the mount: wherever another system owns a location, the design treats it as **read-only in principle**, not as a permission that might be widened
- **Status as published:** resolved
- **Design system version:** 2.9

## GAP-138 [resolved in v2.9] "Geen status" as a fourth choice in the dialog rather than a separate clear action
- **Type:** raised by the design system (v2.9)
- **Found while:** the request-lifecycle rounds, 2.9
- **Where needed:** see 2.9 in `changelog.md`
- **What is missing or wrong:** "Geen status" as a fourth choice in the dialog rather than a separate clear action
- **Decision:** **The implementer's call and it is right; it becomes the rule.** Absence is a **value**, not an operation: four radios, one of them "Geen status". A separate "Status wissen" would make clearing a different kind of act from setting, give the bulk report two shapes to explain, and offer a destructive-looking button for something that is not destructive. **It is also the precedent this system already set** — BulkDialogs' spool dialog has carried "Geen spoel" as the **last option in the list** since 1.4, not a remove button, and the Tags page has "Geen kleur" in the palette. I had not generalised 
- **Status as published:** resolved
- **Design system version:** 2.9

## GAP-139 [resolved in v2.9] A declined order is **named** in an invoice draft's exclusions instead of silently absent
- **Type:** raised by the design system (v2.9)
- **Found while:** the request-lifecycle rounds, 2.9
- **Where needed:** see 2.9 in `changelog.md`
- **What is missing or wrong:** A declined order is **named** in an invoice draft's exclusions instead of silently absent
- **Decision:** **Better than my spec, and adopted.** 2.8 said only "excluded from every total", which is satisfied by saying nothing — and silence is exactly what the operator cannot check. **An amount left out of a document is named in that document, with its reason.** This too was already the system's habit and I failed to state it: ScreenInvoiceExport has carried a `warning` alert naming the prints left out for having no price since 1.0. **One thing to confirm: which string does it use?** If the declined order is listed under `{n} prints zonder verkoopprijs zijn weggelaten: {namen}.` that line is false of
- **Status as published:** resolved**, with the copy key to confirm
- **Design system version:** 2.9

## GAP-140 [resolved in v2.9] The declined order is named through `invoice.omitted` — "{count} prints **zonder verkoopprijs** zijn weggelate
- **Type:** raised by the design system (v2.9)
- **Found while:** the request-lifecycle rounds, 2.9
- **Where needed:** see 2.9 in `changelog.md`
- **What is missing or wrong:** The declined order is named through `invoice.omitted` — "{count} prints **zonder verkoopprijs** zijn weggelaten" — in a `pp-alert warning` with `triangle-alert`
- **Decision:** **The list splits: two conditions, two lines, two tones.** A print quoted at EUR 24,50 and refused was announced as having no sale price, in orange: the reason false and the ink claiming something to do on the one line whose point is that nothing is. The `warning` alert keeps **only** the missing-price exclusions (there is something to do: set a price, remake the invoice). The declined ones become a **`muted` `.pp-reason` line in the preview card**, under the `Regels` row it qualifies, **no alert, no border, no glyph** — GAP-120's ruling applied to the same shape of fault. Not `info` either: `
- **Status as published:** resolved
- **Design system version:** 2.9

## GAP-141 [resolved in v2.9] Both exclusion lines: no plural form, and `{names}` unbounded
- **Type:** raised by the design system (v2.9)
- **Found while:** the request-lifecycle rounds, 2.9
- **Where needed:** see 2.9 in `changelog.md`
- **What is missing or wrong:** Both exclusion lines: no plural form, and `{names}` unbounded
- **Decision:** **ICU plurals and a cap of five.** "1 prints zonder verkoopprijs **zijn** weggelaten" renders today and n = 1 is the common case for that alert, so `invoice.omitted` **changes** (same key, correct grammar). And 83 price-less prints would list 83 names in one sentence in a 560px dialog: both lines name at most five, then `invoice.omittedMore` "en {count} andere". `do-dont.md` has required a cap on a growing list since 2.2 and this alert was exempt by oversight
- **Status as published:** resolved
- **Design system version:** 2.9

## GAP-142 [resolved in v2.9] 2.9's own wording: "an amount left out of a document is named in **that document**"
- **Type:** raised by the design system (v2.9)
- **Found while:** the request-lifecycle rounds, 2.9
- **Where needed:** see 2.9 in `changelog.md`
- **What is missing or wrong:** 2.9's own wording: "an amount left out of a document is named in **that document**"
- **Decision:** **Narrowed, and the fault is mine.** Read literally it puts the operator's internal exclusions on a **customer invoice**. The rule is: **the surface where the operator creates or reviews a document names what it leaves out.** Neither line appears in the Concept PDF, the final invoice, the Overzicht or the share page — a customer needs no list of what they declined, and internal reasoning has been barred from customer-facing output since 1.0
- **Status as published:** resolved
- **Design system version:** 2.9

## GAP-143 [resolved in v2.10] "Aanvragen die ik nog helemaal zelf moet designen" against "sliced and waiting for the printer": two groups, o
- **Type:** raised by the design system (v2.10)
- **Found while:** the request-lifecycle rounds, 2.10
- **Where needed:** see 2.10 in `changelog.md`
- **What is missing or wrong:** "Aanvragen die ik nog helemaal zelf moet designen" against "sliced and waiting for the printer": two groups, one list, or a distinction to refuse?
- **Decision:** **One group, and the difference is drawn by whether files exist — not by a fourth state.** Both are *his turn*; the difference is how long it takes, not what kind of act it is. A fourth state would make him **assert** what the app can **observe** (the files appeared), and rule 1 says an asserted stage goes stale in silence while an observed one cannot. So fileless rows **sort first** inside `Mee bezig` with `queue.noFiles` on each, and the summary carries "waarvan {n} zonder bestanden" — the one figure that answers *how much of my own labour is queued*. The word is the **observation**, never t
- **Status as published:** resolved
- **Design system version:** 2.10

## GAP-144 [open] "Geprint, nog niet geleverd" — the owner's third bucket
- **Type:** raised by the design system (v2.10)
- **Found while:** the request-lifecycle rounds, 2.10
- **Where needed:** see 2.10 in `changelog.md`
- **What is missing or wrong:** "Geprint, nog niet geleverd" — the owner's third bucket
- **Decision:** **No state exists, so it gets no group, and I am not inventing one.** 2.8 also flagged it as the group nobody would ever clear. My reading is still that *delivered* wants asserting at the moment payment is recorded rather than as an action of its own, which is one fewer thing to remember — but that is a flow question for the owner and nothing is designed for it
- **Status as published:** proposed, needs your confirmation
- **Design system version:** 2.10

## GAP-145 [open] The age thresholds on a queue row
- **Type:** raised by the design system (v2.10)
- **Found while:** the request-lifecycle rounds, 2.10
- **Where needed:** see 2.10 in `changelog.md`
- **What is missing or wrong:** The age thresholds on a queue row
- **Decision:** **Reused from ScreenOutstanding as a starting point and flagged as unmeasured:** neutral to 30 days, `warning` 31–90, `unpaid` over 90. Those were chosen for **money** ageing. A *request* sitting 30 days may already be bad — the owner says one can sit for weeks — so the escalation may be far too lenient here. The app picks the class, so the cut-offs move without a design change
- **Status as published:** needs your measurement
- **Design system version:** 2.10

## GAP-148 [resolved in v2.11] `outstanding.oldest` is two different strings in one copy deck
- **Type:** conflict
- **Found while:** implementing ScreenQueue (2.10) and looking for the summary badge's copy
- **Where needed:** `design-system/copy-deck.md` lines 84 and 529; `frontend/src/finance/OutstandingPage.tsx`
- **What is missing or wrong:** The copy deck lists `outstanding.oldest` twice with different values: "Oudste openstaande print" (line 84, the StatTile label) and "oudste {n} dagen" (line 529, the group summary badge). A key cannot be both. `nl.ts` imported the first, so the second has no key at all — the summary badge in `OutstandingPage` falls back to `status.daysOpen` and reads "118 dagen open" where ScreenOutstanding's own text and preview say "oudste 118 dagen".
- **Proposal:** Split them — keep `outstanding.oldest` as the tile label and add `outstanding.oldestDays` for the badge, or rename the tile label. Either way one of the two entries changes.
- **Blocked:** the group summary badge on both ScreenOutstanding and ScreenQueue.
- **Resolved in 2.11 and built:** the deck splits the key. `outstanding.oldest` stays the StatTile label and the badge becomes `outstanding.oldestDays` ("{days, plural, =0 {alles van vandaag} one {oudste # dag} other {oudste # dagen}}"), one key for both screens. `OutstandingPage` renders the summary badge from it instead of falling back to `status.daysOpen`; measured in the running app at 1400px, a group now reads "oudste 752 dagen" where it read "752 dagen open". The deck is also de-duplicated: every one of the seven keys this round touches now has exactly one row, and the three strings in `nl.ts` match their row byte for byte.

## GAP-149 [resolved in v2.11] ScreenQueue's group summary shows an age badge with no key for it
- **Type:** missing copy
- **Found while:** implementing ScreenQueue (2.10)
- **Where needed:** `design-system/components/ScreenQueue/preview.html`, the `<summary>` of each group
- **What is missing or wrong:** The preview renders `oudste 118 dagen` as the summary's age badge, but the 2.10 copy deck's thirteen `queue.*` keys do not include it. Only the per-row badge (`queue.waiting`) has copy. Reusing `outstanding.oldest` is not possible — see GAP-148 — and reusing `status.daysOpen` would say "dagen open", which is about money, not about a wait.
- **Proposal:** Add `queue.oldest` = "oudste {count, plural, one {# dag} other {# dagen}}", matching `queue.waiting`'s plural form. It is the same sentence the preview already shows.
- **Blocked:** the age badge in each queue group's summary. The group count, the "waarvan {n} zonder bestanden" meta and every row render as specified; only the badge is left out.
- **Resolved in 2.11 and built, through GAP-148 rather than a key of its own.** The proposal here was `queue.oldest`; 2.11 refused it, because the slot and the words are the same on both screens and a second name for one string is the fault GAP-148 is about. `QueuePage` now fills the `.age` slot from `outstanding.oldestDays`, with the oldest row's age bucket — the rows sort fileless-first rather than by age, so the oldest is the maximum. The stale comment explaining the omission is gone. **But see GAP-155:** at 360px that badge now collides with the `.amt` slot on this screen.

## GAP-150 [resolved in v2.11] `queue.waiting` reads "0 dagen geleden gevraagd" on the day a request is made
- **Type:** suspected design bug
- **Found while:** implementing ScreenQueue (2.10) and adding a request in the running app
- **Where needed:** `design-system/copy-deck.md` line 663, every queue row on its first day
- **What is missing or wrong:** `queue.waiting` is "{count, plural, one {# dag} other {# dagen}} geleden gevraagd". Dutch plural rules send 0 to `other`, so a request entered this morning reads "0 dagen geleden gevraagd". It is the first thing the owner sees after using "Aanvraag toevoegen" — the one row he is certain about — and it reads like a bug. Most requests are entered on the day they arrive, so this is the common case, not an edge one.
- **Proposal:** Add a `=0 {vandaag gevraagd}` arm: "{count, plural, =0 {vandaag gevraagd} one {# dag geleden gevraagd} other {# dagen geleden gevraagd}}". Same for `=1` if "gisteren" is wanted, though "1 dag geleden" is fine Dutch.
- **Blocked:** nothing — the row renders exactly as specified. Flagged because what it says is wrong, not because it is missing.
- **Resolved in 2.11 and built.** `queue.waiting` gains `=0 {vandaag gevraagd}`; no `=1` arm, which 2.11 rejected deliberately. `status.daysOpen` was changed with it, unraised, because it had no plural at all. Measured in the running app: a request entered today reads **"vandaag gevraagd"**, one entered yesterday **"1 dag geleden gevraagd"**. **The formatter did not support this.** 2.11's changelog says the `=0` arm is one "your formatter already supports"; it did not — `plurals()` in `frontend/src/i18n/nl.ts` matched a form name with `\w+`, which `=0` is not, and an exact arm would have been dropped silently and rendered the `other` arm. The formatter now reads `=N` and prefers it over `one`/`other`, with tests.

## GAP-151 [resolved in v2.11] At 360px a queue row's badge starves the name to 90px
- **Type:** suspected design bug
- **Found while:** implementing ScreenQueue (2.10) and measuring the real page at a 360px viewport
- **Where needed:** `.pp-line` at `@media (max-width:480px)` in `components/bundle.css`, every row of ScreenQueue
- **What is missing or wrong:** The phone rule is `grid-template-columns: 1fr auto` with only `.acts` sent to its own row. Measured on the running page at 360px: the badge takes **192px** of the 326px row and the name column is left with **90px**, so "Nog te ontwerpen kastje" breaks over three lines beside a one-line badge. ScreenOutstanding survives the same rule only because its badge is shorter — measured 127px for "20 dagen open", leaving the name 155px. ScreenQueue's row copy is "{n} dagen geleden gevraagd", about 50% longer, against the same grid. The preview's phone frame does not show this: it is a container at desktop viewport width, so the 480px media query never fires in it.
- **Proposal:** Send the badge to its own row below 480px, as `.acts` already is (`.pp-line .pp-badge { grid-column: 1/-1; justify-self: start }`), so the name keeps the full width. Alternatively shorten the row copy on phone the way StatusBadge already shortens, e.g. "118 dagen" — but that costs the word that makes it a wait rather than a debt.
- **Blocked:** the phone layout of a queue row. Desktop and tablet are correct, and the row is readable on a phone — the name wraps, nothing is clipped or overlapping.
- **Resolved in 2.11 and built; it arrives with the import, since it is a `bundle.css` change.** `.pp-line` at 480px and below is three bands: `>:first-child` spans both columns, `.pp-badge` takes column 1 row 2 and `.pp-right` column 2 row 2, `.acts` spans. Re-measured in the running app at a 360px viewport, which is where the 90px was measured: the name block is now **294px** on both screens, the badge sits on its own band at 144px ("vandaag gevraagd") to 176px ("1 dag geleden gevraagd"), and neither page scrolls sideways (`scrollWidth` 360 = `clientWidth` 360). ScreenOutstanding folds the same way; its badge shares a wrapper with the archived StatusBadge, so `.pp-line > .pp-badge` does not match there and the wrapper is placed by auto-flow instead — measured into the same cell (column 1, row 2), but by the algorithm rather than by the selector.

## GAP-152 [open] A source link and a note on a print: "alleen printen" against "zelf maken"
- **Type:** improvement idea (new feature, owner's request)
- **Found while:** reviewing ScreenQueue 2.10 with the owner after step 2 shipped
- **Where needed:** ScreenQueue rows, ScreenPrintDetail, ScreenShare, and the "Aanvraag toevoegen" dialog
- **What is missing or wrong:** The queue can say a job has no files, but not what kind of job it is. "Geen bestanden" covers two jobs that are nothing alike: *I have not downloaded it yet* (five minutes) and *I have to model this from scratch* (an evening). The owner holds that difference in his head today. 2.10 deliberately avoided a fourth state for it (GAP-143) and read the difference from an observation instead — this proposes a second observation in the same spirit, not a state.
- **Proposal:** Two fields on **every print record**, not on a request specially — a request is the same record without a folder, so it can fill them early exactly as it can already carry a price.
  - **Bron (URL)** — where the model came from. Visible to the klant on the share page (owner's decision).
  - **Notitie** — short free text, what still has to be made. **Internal**, never on the share page (owner's decision).

  A queue row then reads itself: a URL and no files means "download and print"; a note and no files means "design this"; files mean what it means today.

  **The `.url` files already on disk.** Measured in the owner's real tree: **15 of 84 project folders** hold a Windows `.url` shortcut, all of the same shape (an INI with a `URL=` line; makerworld, printables, thingiverse). One folder holds two; two sit one level below the project folder. `AssetType` already classifies `.url`, the indexer simply never reads inside one. So those 15 prints can carry a bron with nothing typed.

  **Typed and observed sit side by side, as everywhere else in the app** — a typed price never overwrites the measured grams, and a typed bron never overwrites a `.url` in the folder. Both are true and both show; the folder's version follows the file when it changes. A folder with two `.url` files shows two. No precedence rule is needed because nothing is ever a single value.

  What the design system is asked for: how a bron renders on a queue row, on ScreenPrintDetail and on ScreenShare; how a note renders where it is allowed; what a row with neither looks like; the Dutch copy; and the empty and multi-value cases.
- **Blocked:** nothing is built yet — this is the design request for the next feature.
- **Specified in 2.11, not yet built, so this stays `[open]`.** 2.11 resolves the design question: two fields on every print record, two new components (PrintSource, PrintNote), four new classes and thirteen copy keys, all present in the import and checked by `scripts/check-design-export.mjs`. **Nothing of it is implemented** — no fields, no components, no `.url` reading — because the owner split this round in two and asked for the copy and the phone fix first. The heading flips to `[resolved in v2.11]` when the code exists, not when the spec does. **One measurement 2.11 asks for is still owed with it:** how many of the 15 `.url` files parse to a URL the app can show.

## GAP-153 [open] Eleven phone rules had no preview twin; four still have none
- **Type:** raised by the design system (v2.11)
- **Found while:** resolving GAP-151, which could not be seen in the frame that specified it (2.11)
- **Where needed:** every `@media (max-width:480px)` rule in `components/bundle.css`; the phone frames of OrderSection, ScreenPrintDetail, AssetListItem, ScreenSettings, ScreenTags, ScreenQueue and ScreenOutstanding
- **What is missing or wrong:** `.pp-device.phone` is a 360px **container** inside a page at desktop viewport width, so `@media (max-width:480px)` never matches and a "phone" frame draws the desktop layout. 2.11 twins eight rules (`.pp-line`, `.pp-slot`, `.pp-asset.child`, `.pp-cols-2`, `.pp-printer .fields`, `.pp-pick` + `.pp-qty`, `.pp-tagrow` + `.cnt`, `.pp-order>summary` + `.ttl`/`.chev`/`.sum`) and leaves four without one on purpose: the 44px tap floor and `--pp-control-h` on `:root`, the 16px input font, `.pp-dialog.sheet` and `.pp-pop.at`.
- **Decision:** **Seven more twinned (eight with `.pp-line`), four left out on purpose**, with the app and the frames to be checked rather than guessed, because the design system renders nothing.
- **Status as published:** needs your measurement
- **Our measurement (v2.11 import):** the twins are preview-only markup (`.pp-device` never appears in `frontend/src`, verified by grep for the identifier), so **no app behaviour can change from them** — only `.pp-line`'s media-query rewrite touches the app, and that is GAP-151. The five frames the changelog names were opened at 1440px and at 390px in both themes and compared against their 2.10 renders; the twins reflow them as described and nothing clips, overlaps or scrolls sideways. `.pp-cols-2`, `.pp-pick` and `.pp-slot` are indeed in no published phone frame, so those three twins are inert today — confirmed by grep over `design-system/components/*/preview.html` for `pp-device` together with each class.
- **Blocked:** nothing. The twins are not app code and the one app-visible half of this round is GAP-151.
- **Temporary placeholder approved:** no
- **Design system version:** 2.11
- **Re-measured at the 2.12 import (2026-10-18), because 2.12 adds three more twins.** Rendering every published phone frame at 1400px: `.pp-btn-sm` is **44px** in all of them (the twin writes the literal), `.pp-line .acts` is `flex-wrap: wrap` and a two-action queue row stacks into two 44px lines inside the frame as it does in the app, `.pp-ogrp > summary .age` is `justify-self: start` and each badge is the width of its own words (128px to 141px, no 223px pill), and ScreenQueue's six summaries all draw an empty `.amt`. **Nothing clips in ScreenQueue's or OutstandingGroup's frames.** But the gap's own subject is unchanged and the export says so itself: measured inside a `.pp-device.phone` frame, `--pp-tap` and `--pp-control-h` are still **36px**, their desktop values, because `:root`'s media query cannot fire inside a container. So a phone frame still draws 36px icon buttons and palette buttons where the app draws 44px. 2.12 proposes twinning the two tokens for 2.13 and declines to do it blind; we agree, and the gap stays open for that.

## GAP-154 [resolved in v2.12] Three more day-count strings with no plural, and one that may be dead
- **Type:** raised by the design system (v2.11)
- **Found while:** the copy-deck de-duplication of GAP-148 (2.11)
- **Where needed:** `share.expiresIn`, `overview.expiryNotice`, `outstanding.groupMeta`, `date.daysOne`/`date.daysOther`, `share.expiresToday`/`share.expiresTomorrow`
- **What is missing or wrong:** three day-count strings carry no plural form, so each can render "1 dagen", and `outstanding.groupMeta` may be copy nobody renders since 1.9 split the group summary into `.ttl` and `.age`. 2.11 deliberately did not change them, because which of them is actually wrong depends on call sites the design system cannot see.
- **Decision:** **Not changed, because the answer depends on call sites I cannot see.**
- **Status as published:** needs your measurement
- **Our measurement (v2.11 import), one call site at a time:**
  - **`share.expiresIn` is dead.** It is not in `frontend/src/i18n/nl.ts` at all and no file references it — it was never imported, so there is nothing to re-import and nothing renders it. The design system can drop the row.
  - **`overview.expiryNotice` cannot render "Over 1 dagen".** Its only call site is `frontend/src/sharing/SharePage.tsx:167`, inside a three-way branch: 0 days takes `share.expiresToday`, 1 day takes `share.expiresTomorrow`, and the notice is reached only from 2 days up. So the 1.6 pair does already own the cases that would read wrong, and the key needs no plural.
  - **`date.daysOne` / `date.daysOther` already branch in code.** `ShareLinksPage.tsx:162` picks `date.daysOne` when `days === 1`; the second call site, `ShareLinksPage.tsx:428`, fills the "Verloopt" dropdown from `EXPIRY_CHOICES`, whose values are 7, 30 and 90. Neither path can produce "Over 1 dagen".
  - **`outstanding.groupMeta` is not dead, and it does have the fault.** It is imported (`nl.ts:497`) and rendered in exactly one place, `OutstandingPage.tsx:177`, as the `.ttl` block's second line under the klant name — beside the `.age` badge, not instead of it. With one line one day old it reads **"1 prints · oudste 1 dagen open"**. This is the one of the four that is a live wording bug, and it is the opposite of the changelog's guess. Confirmed by reading the rendered page rather than the source: at 360px and at 1400px the meta line of a klant with one line one day old reads **"1 prints · oudste 1 dagen open"**, two faults in six words. It also now **says the age twice**: since this round the `.age` badge beside it reads "oudste 1 dag" in nearly the same words, 20px away.
  - **A fifth string with the same fault, which 2.11 did not list.** `outstanding.groupLabel` — "{customer}, {count} prints, oudste {days} dagen, {amount}" — is the `aria-label` of every Openstaand group summary (`OutstandingPage.tsx:167`). It is not in the changelog's table and has no plural either, so a screen reader hears "1 prints, oudste 1 dagen". It is the accessible name of the same component whose visible badge this round fixed.
- **Proposal:** give `outstanding.groupMeta` ICU plurals on both counts, e.g. "{count, plural, one {# print} other {# prints}} · {days, plural, =0 {alles van vandaag} one {oudste # dag} other {oudste # dagen open}}" — or, since the badge beside it now says the age in exactly those words through `outstanding.oldestDays`, drop the age clause from the meta line and leave it "{count, plural, one {# print} other {# prints}}". The second is ours: the summary would then say the age once. Drop the `share.expiresIn` row; leave `overview.expiryNotice` and the `date.days*` pair alone.
- **Blocked:** nothing. Nothing was changed on this gap's account this round.
- **Temporary placeholder approved:** no
- **Design system version:** 2.11
- **Resolved in 2.12 and built, per key — the design system took every one of our four call-site answers.** `outstanding.groupMeta` is the count alone, `{count, plural, one {# print} other {# prints}}`; `outstanding.groupLabel` is **in the deck at last**, with plurals on the count and the badge's own three day arms, and our hand-written value is replaced by it; `share.expiresIn`'s row is dropped, which needed **no app change** — re-checked by grepping `frontend/src` for the identifier `expiresIn`, which matches only `expiresInDays` on the share-link API, an unrelated field; `overview.expiryNotice` and `date.daysOne`/`date.daysOther` keep their 1.6 shape. Measured in the running app at 1360px: a klant with one line now reads **"1 print"** where it read "1 prints · oudste 1 dagen open", and that summary's accessible name is **"<klant>, 1 print, oudste 737 dagen, € 0,21"**. The age is now stated once on screen, by the badge. Unit tests pin the `one`, `other` and `=0` arms of both keys.

## GAP-155 [resolved in v2.12] The queue summary's new age badge overlaps "waarvan {n} zonder bestanden" at 360px
- **Type:** suspected design bug
- **Found while:** verifying 2.11's resolution of GAP-148/GAP-149 in the running app (2026-10-18)
- **Where needed:** `.pp-ogrp > summary` at `@media (max-width:480px)` in `components/bundle.css`; ScreenQueue's group summary; also its own phone preview frame
- **What is missing or wrong:** 1.9 folded `.pp-ogrp > summary` into two columns and two rows on the phone, with `.age` at column 1 row 2 and `.amt` at column 2 row 2. That was designed for ScreenOutstanding, where `.amt` is money. **ScreenQueue puts a sentence in `.amt`** — "waarvan {n} zonder bestanden", which is 2.10's own design and ScreenQueue's README says so in as many words. Until this round the `.age` slot on that screen was empty (GAP-149), so the two never met. 2.11 fills it, and at 360px they collide.

  Measured in the running app at a 360px viewport, on the group whose summary carries both: `.amt` is **181px** in the `auto` column, which leaves the `1fr` column **109px**; the badge's content needs **130px** (`clientWidth` 107 against `scrollWidth` 130). The badge's painted text runs to x=160 and the `.amt` text starts at x=150, so **the two strings overprint by 10px** — visible as "alles van vandaa**g**" running into "**w**aarvan 2 zonder bestanden". Because `.amt` sizes the `auto` column for both rows, the group's `h3` is squeezed to 109px as well and "Nog niet besloten" wraps to two lines.

  **The design system's own preview shows it too, which is new.** 2.11's `.pp-device.phone` twins make phone frames render the phone layout for the first time; rendering `ScreenQueue/preview.html` at 1400px, the `.age` badges inside the phone frames overflow their boxes identically — 115px box against 138px content for "oudste 118 dagen" and 140px for "alles van vandaag". So this is reproducible without the app, and GAP-153's twin is what exposed it.
- **Why it matters:** two strings print on top of each other on the phone, on the one screen the owner was promised he could use away from his laptop ("ook als ik bij iemand op bezoek ben"). Openstaand is unaffected — measured over all eleven groups there, the badge's text ends at x≈161 and the money starts at x≈253 or later, so every one is clear.
- **Proposal:** one of three, and the choice is the design system's.
  1. **Give `.age` its own band**, as `.pp-line` just got for the same reason: `.pp-ogrp > summary` becomes three bands on the phone, `.amt` keeping the row with the title or taking a third row. This is GAP-151's own answer one level up and it makes a group and its lines fold alike, which 2.11 says is the point.
  2. **Let the badge keep its intrinsic width and let `.amt` wrap**: add `justify-self: start` to `.pp-ogrp > summary .age` — which 2.11's new `.pp-line > .pp-badge` rule *has* and the 1.9 summary rule does not — plus a `minmax` that does not let `.amt` take the column. On its own this stops the stretch but not the collision, because 109px is still less than 130px.
  3. **Take the sentence out of `.amt` on ScreenQueue** and put it in the `.ttl` block under the count, where it is a second muted line and competes with nothing.
- **Blocked:** the age badge in ScreenQueue's group summary. **The owner held it back** (2026-10-18): two strings printing over each other is worse than a badge that is not there yet, and the age is on every row below, so nothing is lost by waiting. The slot renders empty and `QueuePage.tsx` says why. **Openstaand keeps the badge** — measured clear in all eleven groups, and there the change is an improvement ("752 dagen open" became "oudste 752 dagen"). This does not re-open GAP-149: that gap was that no key existed for these words, and `outstanding.oldestDays` now exists and is rendered.
- **Re-measured after the badge was held back (2026-10-18):** the overprint is gone — no `.age` element on that screen, page `scrollWidth` 360 against `clientWidth` 360 — **but the squeezed heading is not**. "Nog niet besloten" still gets **109px and wraps to two lines**, while "Mee bezig", whose group carries no "waarvan …" sentence, gets **274px on one line**. So the badge was never the cause of that half: `.amt` sizing the `auto` column for both rows is, and it has been doing so since 2.10 shipped the sentence into that slot. Removing the badge removed the collision, not the squeeze. Proposal 3 (move the sentence out of `.amt`) is the only one of the three that addresses both.
- **A note for whoever fixes it:** the second half of the problem is the stretch, which was already there. `.pp-ogrp > summary .age` has no `justify-self`, so the badge box fills its column: measured on Openstaand at 360px, "oudste 752 dagen" paints 124px of text inside a **223px** tinted pill. Nothing overlaps there, so it has never been reported, but a status pill twice the width of its own words is not what StatusBadge draws anywhere else.
- **Temporary placeholder approved:** no
- **Design system version:** 2.11
- **Resolved in 2.12 and built: proposal 3, the sentence leaves `.amt`.** `queue.ofWhichWithoutFiles` is now the `.ttl` block's second muted line and `.amt` is `<span className="amt" />`, empty but present, so the summary keeps its four tracks. Re-measured in the running app at a 360px viewport, where the fault was 109px: the group heading **"Nog niet besloten" is 274px on one line** (the design system expected about 288px; the difference is the 16px chevron track and its gap, not a fault), each of the three `.ttl` lines is one line, `.amt` is 0px wide, and the summary is **113px** tall with the "waarvan" line and **93px** without. The badge is back on this screen and sits on its own band at 112px for "oudste 1 dag", nothing overprints, and the page does not scroll sideways (`scrollWidth` 360 = `clientWidth` 360).
- **The older half is built with it and is visible on Openstaand.** `justify-self: start` arrives with the import. Measured at 360px with the pre-2.12 declaration put back by hand for comparison: "oudste 750 dagen" painted in a **223px** pill and is now **140px**; "oudste 752 dagen" was 234px and is now 140px. Every group summary badge on that page is now the width of its own words.

## GAP-156 [resolved in v2.12] A queue row's two actions overflow their band at 360px and are 32px tall where the screen says 44px
- **Type:** suspected design bug
- **Found while:** the same verification pass; pre-existing, not caused by 2.11 (2026-10-18)
- **Where needed:** `.pp-line .acts` on ScreenQueue and ScreenOutstanding; `.pp-btn-sm` in `components/bundle.css`; ScreenQueue's *Phone* note
- **What is missing or wrong:** two things in one place, neither of them new.
  - **The actions row overflows.** `.pp-line .acts` spans both columns on the phone (it did in 2.10 too) and is `display:flex` with `nowrap`. On a fileless queue row it holds "Bestanden koppelen" and "Status wijzigen". Measured at 360px: the band is 294px wide and the two buttons need 308px, so the second button's right edge lands at x=341 against a band ending at x=327. Nothing is clipped — the card's own padding absorbs the 14px and `.pp-ogrp` is `overflow:hidden` — but the right gutter is gone on exactly the rows that carry two actions. The same overflow appears in ScreenQueue's own phone preview frame (300px band, 308px content), so it is not a data accident.
  - **The buttons are 32px, not 44px.** ScreenQueue's *Phone* paragraph says "actions wrap under each row at 44px" and `do-dont` has said since 1.2 not to shrink a touch target below 44px on a phone. `:root` does raise `--pp-tap` and `--pp-control-h` to 44px at 480px — but `.pp-btn-sm` sets `min-height:32px` as a literal, not through the token, so a small button ignores the floor at every width. Measured: 32px tall at a 360px viewport, on both screens. It passes axe (WCAG 2.1 AA has no target-size rule; 2.2's 24px minimum is met), so no automated check will ever raise it.
- **Why it matters:** the first is cosmetic and only on two-action rows; the second is the design system contradicting itself about the one metric `do-dont` states as a hard floor, everywhere `.pp-btn-sm` is used on a phone — which is most row actions in the app.
- **Proposal:** either `.pp-btn-sm{min-height:max(32px, var(--pp-tap))}` — or say in Button that `.pp-btn-sm` is deliberately exempt from the tap floor and correct ScreenQueue's "at 44px". For the overflow, `flex-wrap: wrap` on `.pp-line .acts` at 480px and below, which is what the word "wrap" in that paragraph already describes.
- **Blocked:** nothing. This repository changes neither of them: `.pp-btn-sm` and the `.acts` rule are both `bundle.css`, and the row markup is the one ScreenQueue specifies.
- **Temporary placeholder approved:** no
- **Design system version:** 2.11
- **Resolved in 2.12 and built; both halves arrive with the import, since both are `bundle.css`.** The 44px floor is written **inside** `@media (max-width:480px)` and nowhere else, with a `.pp-device.phone` twin that writes 44px as a literal — not the `max(32px, var(--pp-tap))` this entry proposed, which the design system rejected because `--pp-tap` is 36px outside the phone query and that form would have enlarged every small button on the desktop. The rejection is right and the export ships the narrow form; verified by reading `bundle.css` rather than the changelog. Measured in the running app at 360px: every row action is **44px** tall on Wachtrij and Openstaand, and still **32px** at 1400px. A fileless queue row's two actions now wrap into two lines — band 294px wide and **92px** tall, content 307px, nothing past the band (the last button ends at x=156 against a band ending at x=327). Openstaand's two actions need 253px, so they stay on one line there and only the height changes.
- **The cost, measured, so the owner can judge it.** The Wachtrij at 360px is **1492px** tall where the pre-2.12 rules give **1324px**: +12px for every row from the tap floor, and +48px more for each of the two rows that carry two actions. Openstaand with a group open is 2816px against 2708px — +12px per line and no wrap. `pp-nowrap` is removed from `.acts` in both screens, as the previews did, so nothing in the app re-asserts `nowrap`.

## GAP-157 [open] "Aanvraag toevoegen" has never been designed, and now two components say it carries their fields
- **Type:** missing component
- **Found while:** building GAP-152 part two (bron and notitie)
- **Where needed:** ScreenQueue's "Aanvraag toevoegen" dialog
- **What is missing or wrong:** ScreenQueue 2.10 specifies the button and the page but not the dialog behind it; the README calls its anatomy undesigned. It was built anyway in 2.10 from Dialog, `pp-field` and `pp-input`, because the page is useless without it. PrintSource and PrintNote both now say, in the same words, that this dialog "carries this field and PrintNote's **when it is designed**" — so two published components depend on a shape that does not exist.
- **Proposal:** Four fields in this order: klant (a Select of existing klanten), what was asked (text), bron (`input[type=url]`, the same validation as PrintSource), notitie (`textarea`, `maxlength` 280, the internal help line). Built that way now, from the components above and no invented values. The one real question is whether bron and notitie belong in the dialog at all or only on the print afterwards — and the measurement says they do: a request arrives with a link while the owner is somewhere else, and saving it first and then finding the print to paste the link undoes the capture this page exists for.
- **Blocked:** nothing. Marked `ds-gap: GAP-157` so the checker knows the dialog is improvised, and it stays open until the dialog is specified.
- **Temporary placeholder approved:** yes — the owner approved building part two; this dialog is the only piece of it with no spec.

## GAP-158 [open] A User has no "Deze print" card, so PrintSource's read-only row cannot appear
- **Type:** conflict
- **Found while:** building GAP-152 part two
- **Where needed:** ScreenPrintDetail for role User; `frontend/src/prints/PrintDetailPage.tsx:286`
- **What is missing or wrong:** PrintSource says the bron renders in the card "Deze print" and that "role User sees the row read-only, because the klant sees it too". A User's print page has no such card. Since 1.9 the page branches on the role: an Admin or Editor gets the media row with "Deze print" beside the viewer, and a User gets a two-column block with the viewer and their own order's payment panel, and nothing else. So the one surface the spec names for a User does not exist on that page.

  This matters more than it looks: the same klant can open the share page and see the bron there (the owner's decision), but a User signed in to the portal cannot see it at all. The two views disagree about the same fact.
- **Proposal:** Either give the User branch a reduced "Deze print" card — klant, project, date and bron, which is what a User may see of it anyway — or state in ScreenPrintDetail that the bron is Admin/Editor and share-page only, and drop the sentence about role User. The first is more consistent with the share page; the second is less work and is defensible if the portal's User view is meant to stay minimal. **This is a product decision about what a User's page is for, not a visual one.**
- **Blocked:** the bron for role User on ScreenPrintDetail. Everything else of GAP-152 is built: an Admin and an Editor see and edit both fields, the queue row shows both, and the share page shows the bron — including to the same klant.

## GAP-159 [open] "Geen status" is the only way to finish a job, and it says "no information" rather than "done"
- **Type:** unclear spec
- **Found while:** answering the owner's question "hoe haal ik iets van de wachtrij af?"
- **Where needed:** StatusBadge (the four-value control), ScreenQueue, ScreenPrintDetail's payment panel; `frontend/src/finance/PaymentPanel.tsx:502`
- **What is missing or wrong:** The control has four values — Geen status, Nog niet besloten, Mee bezig, Niet doorgegaan — and StatusBadge 2.9 justifies the fourth with one reason only: **a state must be able to go back**, because a klant can change their mind. That is "undo", and the word fits it.

  ScreenQueue 2.10 then gave the same value a second job without naming it. The Wachtrij lists exactly `undecided` and `inProgress`, so a job that is **finished** leaves the queue only by being set back to "Geen status". The owner asked how to take something off the queue and the honest answer is "mark it as having no status", which reads as deleting information about work that was in fact completed. The two meanings also collide: a print that was never a request and a print that is done both end up in the same value, and nothing afterwards can tell them apart.
- **Why it matters:** this is the one act every finished job needs, and the word for it describes an absence. It is also asymmetric: a refused job has its own word ("Niet doorgegaan") and keeps its badge on the dashboard, while a completed job — the more common ending — has none and leaves no trace of having been in the queue.
- **Proposal:** Preferred: **keep three stored states and give the act its own wording where it is performed.** The queue row's action reads "Uit de wachtrij halen" and writes the same null; the detail control keeps "Geen status", where undo is what it really means. Nothing is stored that is not stored today, and no badge is invented. Second option, if the owner wants the ending recorded: a fifth value "Klaar", neutral ink like "Niet doorgegaan" (a settled state takes no live ink, StatusBadge 2.9), absent from the Wachtrij and from every total. That is a new stored fact and a product decision, not a rename — and GAP-143 refused to *infer* a job's ending once; asserting one is a different question, so it is worth asking rather than assuming.
- **Blocked:** nothing is broken; the act works today. Held: any copy change to the control, and the question of whether a finished job is recorded as such.
- **Temporary placeholder approved:** no
- **Design system version:** 2.11

## GAP-160 [open] `.pp-line > .pp-badge` does not match on Openstaand's lines; the band is right by accident
- **Type:** suspected design bug
- **Found while:** the 2.12 import — the design system asked for this one in writing ("Log it as its own gap and I will decide it with the markup in front of me", `changelog.md` 2.12, *Where I was unsure*)
- **Where needed:** `.pp-line > .pp-badge` at `@media (max-width:480px)` and its `.pp-device.phone` twin in `components/bundle.css`; OutstandingGroup's line anatomy; `frontend/src/finance/OutstandingPage.tsx:232`
- **What is missing or wrong:** 2.11's phone rule for a line places the age badge with a **child** selector, `.pp-line > .pp-badge{grid-column:1;grid-row:2;justify-self:start}`. On ScreenQueue the badge is a direct child and the rule applies. On ScreenOutstanding it is not: since 1.9 the badge shares a wrapper, `span.pp-row.pp-gap-1`, with the *Gearchiveerd* StatusBadge, because a line can carry both and they must sit side by side. The wrapper has no class the rule names, so nothing places it.

  It lands in the right cell anyway. Measured at 360px with all eleven groups open, over all 40 lines: every badge wrapper computes `grid-column-start: auto`, `grid-row-start: auto`, `justify-self: auto` — the rule does not reach it — while the queue's six direct badges compute `grid-column-start: 1`, `grid-row-start: 2`, `justify-self: start` from the same stylesheet. Rendered, the wrapper still sits at the line's left edge in the second band (x=16 of a 294px line, 239px wide, with `.pp-right` beside it at x=267), because grid **auto-placement** fills the next free cell and the next free cell is that one: `>:first-child` spans both columns of row 1. The `justify-self: start` is missing too, and is invisible today only because the wrapper is a `.pp-row` flex box that shrink-wraps its children.
- **Why it matters:** the layout is correct today and depends on nothing that is written down. Adding an element to the line, reordering two, or giving the wrapper a width would move it with no rule to appeal to, and the screen it would break is the one the owner reads on a phone. It is also the second time a selector on this component has quietly not matched: 2.12 fixed `.pp-ogrp > summary .age`, which disagreed with this same rule about `justify-self`.
- **Proposal:** name the wrapper. A class on it — `.pp-badges`, say — placed by the phone rule alongside `.pp-badge`, so both screens are placed by the same declaration: `.pp-line > .pp-badge, .pp-line > .pp-badges{grid-column:1;grid-row:2;justify-self:start}`. That is a new class and a one-attribute markup change on the one screen that has the wrapper. A `:has()` selector would need no markup but would hide the dependency again, which is the fault being reported. The design system decides; this entry only reports that the rule does not match where the component says it does.
- **Blocked:** nothing. Openstaand's phone layout is correct as measured and no placeholder is in the code, so there is no `ds-gap` marker for this.
- **Temporary placeholder approved:** no
- **Design system version:** 2.12

## GAP-161 [open] SpoolPicker shows neither what is left on a spool nor that it is archived
- **Type:** missing state
- **Found while:** making archived Spoolman spools choosable again (the owner's request)
- **Where needed:** SpoolPicker's listbox option; `frontend/src/finance/SpoolPicker.tsx:283`
- **What is missing or wrong:** an option is swatch, name, "materiaal · leverancier" and the price per kg. Two things it cannot say:

  **1. Which of two identical spools this is.** Measured against the owner's own Spoolman: 31 spools, 29 active, and only **24 distinct names**. Three names cover several physical spools — one covers three, of which two are identical in *every* field Spoolman has (same filament, both unopened at 1000 g, no lot number, no location). The list draws them as two identical rows and the owner reported them as "double entries". They are not duplicates; they are two spools, and nothing on screen tells them apart.

  **2. That a spool is archived.** The client asked Spoolman for the active stock only, so a spool archived after being used up could not be chosen — which is exactly the spool an old print was made with. The backend now asks for the archive too and sorts it last; the list needs to say which rows those are.
- **Why it matters:** the grams are also what you choose *on*: a small print goes on the spool that is nearly empty. And without a mark, an archived spool is indistinguishable from stock, so the picker would quietly suggest filament the owner no longer has.
- **Proposal:** the remaining weight as a third part of the existing meta line — "PETG · Sunlu · 294 g over" — and, for an archived spool, the `pp-hintchip` this list already uses for provenance, reading "archief", with `title` "Gearchiveerd in Spoolman". Built that way now from existing classes and no invented values. Two things for the design system to decide: whether a state (archived) may use the chip that has so far only carried provenance ("uit de map", "slicer", "van de print"), and whether the 200px trigger still holds now that an option line is longer — a spool name is already clipped there today ("Creality Skin Hype…").
- **Blocked:** nothing. Marked `ds-gap: GAP-161`; the gap stays open until the option's anatomy is specified.
- **Temporary placeholder approved:** yes — the owner asked for both ("altijd zichtbaar onderaan, en zet het gewicht erbij"), 2026-10-18
- **Design system version:** 2.12

## GAP-162 [open] A klant with nothing in their folder has no designed tile, and its menu offers acts that have no object
- **Type:** missing state
- **Found while:** making a klant with no projects selectable (the owner's request)
- **Where needed:** CustomerCard, CustomerChips, ScreenDashboard's klant strip; `frontend/src/prints/CustomerStrip.tsx:162`
- **What is missing or wrong:** until now a klant was derived from the prints (`group by customer_folder`), so a klant always had at least one. A folder with nothing in it therefore existed nowhere in the portal — and that is exactly the klant a new request is for, which the Wachtrij made visible: the owner made the folder for a klant who had asked for something and then could not pick them anywhere. A klant is now a folder on disk, empty or not.

  Three things that follows from, none of them designed:
  1. **The tile reads "0 prints"** (`customers.printCount`'s `other` arm, since Dutch sends 0 there). Nothing says whether that is the right thing to show, or whether an empty klant should read differently, or sort apart from the rest.
  2. **The tile's menu offers "Klant verwijderen" and "Factuur"** on a klant with nothing to delete and nothing to bill. Deleting is harmless — it deletes zero prints — but a destructive-looking control for an act with no object is the pattern GAP-138 was written against.
  3. **Selecting the tile filters the grid to nothing**, which lands on the existing empty state. That may be exactly right; it has never been looked at.
- **Why it matters:** this is now an ordinary sight rather than an edge case — every new klant starts here, and the owner hits it the moment he makes a folder for someone who has asked for a print.
- **Proposal:** leave the count as it is and let the empty state do its work, which is what is built; and decide (2), for which the smallest honest answer is that the menu shows only what has an object. If the design system would rather mark an empty klant — a `pp-hintchip` "nog geen prints", or sorting them last — that is a decision we would rather take from you than invent.
- **Blocked:** nothing. No placeholder was built: the tile renders a klant with 0 prints without any new markup, so there is nothing marked `ds-gap`. The question is whether what it renders is right.
- **Temporary placeholder approved:** no
- **Design system version:** 2.12
