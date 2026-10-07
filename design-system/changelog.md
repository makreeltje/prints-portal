# Changelog 1.8

Resolves GAP-060 and GAP-061. Version 1.7 follows below.

| Gap | Result |
|---|---|
| GAP-060 ScreenApiDocs: Scalar's endpoint list not reachable by keyboard on a phone | **confirmed as built, and generalised.** The app makes every scrollable-but-unfocusable region of the renderer a labelled, focusable region (`tabindex="0"`, `aria-label` = `api.title`), `role="region"` on generic elements only (never on a list), removed again when it stops scrolling. Written into the ScreenApiDocs README together with a four-point rule for screens drawn by a third-party renderer. Verified by the app at 360px; I have not run Scalar myself |
| GAP-061 Contrast report: translucent over translucent | **resolved.** `contrast.md` has a table *Translucent token inside a translucent row* (the four state tints over row hover and selected row, both themes) and a rule. The table shows that the nested composite would fall below AA in several light pairs (for example `unpaid` 4.10 on a selected row, 4.44 on a hovered row; `paid` 4.41 and `info` 4.33 on a selected row; dark `unpaid` 4.12 on a selected row), so badges now carry an opaque `surface` base: their ground is `surface` in every row state |

## Decisions
- **Badges on tinted rows (your choice):** the tint sits on an opaque `surface` base, so a badge on a hovered, selected or `surface-2` row is a slightly lighter pill and always measures like a badge on `surface` (4.93 to 5.33 light). This also settles the open v1.7 finding about light `unpaid` and `warning` badges over `surface-2` (4.29 and 4.32) without a token change.
- **Your app measurement and mine differ.** You measured 4.98 and 4.97 on a hovered row, because in the app the hover tint does not lie under the badge. The design system's own selected table row (`.pp-table tr.is-selected td`, `primary-tint`) does put the tint under a badge, and your measurement did not cover a selected row. The opaque base makes the result independent of that structure.
- **Region name:** `api.title` stays as the accessible name; `api.endpoints` ("Lijst met endpoints") is an optional improvement, not added.

## New and changed
- **Tokens:** none added or changed.
- **Changed classes:** `.pp-badge.paid/.unpaid/.warning/.info`, `.pp-hint` and the hint inside `.pp-money` (background is the tint over an opaque `surface` base; look: only on tinted grounds).
- **Contrast report:** new nested table and rule. 129 paired checks, 0 fail.
- **Components changed:** StatusBadge (preview with a selected row, README), ScreenApiDocs (README: GAP-060 and the third-party renderer rule).
- **Copy:** none (optional `api.endpoints`).

## Breaking changes
- None. Visible change: badges on a hovered, selected or `surface-2` row are a slightly lighter pill than before.

---

# Changelog 1.7

Resolves GAP-054 and GAP-056 to GAP-059. Version 1.6 follows below.

| Gap | Result |
|---|---|
| GAP-056 ScreenApiDocs: Swagger UI or Scalar | **resolved: Scalar is official, Swagger UI is dropped.** Scalar 0.9.78 with `theme: "none"`; the complete variable mapping (every one of the 102 declared variables plus the three `button-1` ones) is in the ScreenApiDocs README and shipped as `.pp-scalar` in `bundle.css`; preview of the themed result in both themes; the three unused Swagger classes are removed |
| GAP-059 Contrast report does not name the ground | **resolved:** `contrast.md` has a Ground column on every pair, a table *Translucent tokens over every ground* (7 tokens, 3 grounds, 2 themes) with the grounds each is approved over, and a rule at the top. Real alpha values are used |
| GAP-054 `.pp-lockhelp` does not wrap | **resolved:** `flex-wrap: wrap`; column layout at 480px and below; checked at 360px |
| GAP-057 First-run folder diagram wraps | **resolved:** `.pp-tree` is `nowrap`; it sits in `.pp-scroll` (focusable, labelled region); verified at 360px |
| GAP-058 ScreenAccess empty state | **confirmed as built:** EmptyState "Nog geen gebruikers om toegang te geven" with link "Naar Gebruikers"; previews desktop and phone |

## Decisions
- **Scalar mapping.** Colours: GET `info`, POST `paid`, PUT `warning`, DELETE `unpaid`; text `text-strong`, `text`, `muted`; grounds `surface`, `surface-2`, `bg`. Where I changed what the app built: `--scalar-background-accent` is `primary-tint-soft` (was `primary-tint`, which fails AA over `surface-2` in the light theme); `--scalar-background-alert` and `-danger` are `warning-tint` and `unpaid-tint` (they defaulted to solid orange and red); `button-1`, `-color` and `-hover` are mapped (primary buttons, not black or white); links follow `.pp-link`; borders are 1px; Scalar's 10px text becomes `text-xs` (12px); radius, text, leading and shadow follow our scales. Structural variables (header and address-bar height, brightness, tooltip padding, text-decoration colours, font weights) keep Scalar's value.
- **The dump list is incomplete.** The section "Still on a value of their own" of the Scalar dump leaves out `--scalar-button-1`, `--scalar-button-1-hover` and the literal heading, line-height, paragraph and size variables of the group "other". All of them are decided in the README mapping now. Regenerate the dump after a Scalar upgrade and compare.
- **Open question (new, from the matrix):** where do badges on `surface-2` occur in the app? If they do, the light `unpaid` and `warning` tokens need a slightly darker value, or those rows use `surface` instead.
- **Check in the app:** the callouts that use `--scalar-background-alert` and `-danger` (text colour on the tint) and the `Test request` button.

## New and changed
- **Tokens:** none added or changed.
- **Contrast report:** new column Ground, new table of translucent tokens over `bg`, `surface` and `surface-2`; alphas are the real ones from `tokens.css` (until 1.6 rounded: .08, .14, .20; no verdict changed). Not approved (below 4.5:1; light theme unless noted): `primary` on `primary-tint` over `surface-2` (4.34); `muted` on `primary-tint` over `surface-2` (4.27); `primary` on `primary-tint-strong` over `bg` (4.26) and `surface-2` (3.98), and in dark over `surface-2` (4.05); `unpaid` on `unpaid-tint` over `surface-2` (4.29); `warning` on `warning-tint` over `surface-2` (4.32). Everything else is approved over all three grounds. **New finding, not changed in 1.7:** the last two mean a light Open or missing-data badge is below AA when it sits on a `surface-2` ground (for example a hovered table row or a table header). Fixing it needs either darker `unpaid` and `warning` text colours in the light theme (a token change) or a rule that these badges never sit on `surface-2`; please decide (see the open question below). 129 paired checks, 0 fail.
- **New classes:** `.pp-scalar` (variable mapping), `.pp-sc`, `.pp-sc-side`, `.pp-sc-search`, `.pp-sc-grp`, `.pp-sc-main`, `.pp-sc-op`, `.pp-sc-m`, `.pp-sc-code`, `.pp-sc-note`, `.pp-sc-btn` (illustration of the themed renderer in the preview only).
- **Changed classes:** `.pp-lockhelp` (wrap, column at 480px), `.pp-tree` (nowrap, `width: max-content; min-width: 100%`).
- **Components and screens changed:** ScreenApiDocs (preview and README rewritten), AssetListItem, AccessMatrix, ScreenAccess, ScreenSystemStates.
- **Copy:** `access.empty.title`, `access.empty.body`, `access.empty.link`, `api.title`, `api.noLoginField`, `api.search`, `api.testRequest`, `api.loadErrorBody` (changed text: "De documentatie kon niet worden opgehaald. Probeer het opnieuw.").

## Breaking changes
- `.pp-api-head`, `.pp-api-row` and `.pp-method` are removed from `bundle.css` (added in 1.6 for the Swagger layout; unused in the app).
- The `ds-gap: GAP-056`, `GAP-057` and `GAP-058` markers can come out; GAP-056 can use `.pp-scalar` instead of the app's `.app-api` block.

---

# Changelog 1.7

Resolves GAP-054 and GAP-056 to GAP-059. Version 1.6 follows below.

| Gap | Result |
|---|---|
| GAP-056 ScreenApiDocs: Swagger UI or Scalar | **resolved: Scalar is official, Swagger UI is dropped.** Scalar 0.9.78 with `theme: "none"`; the complete variable mapping (every one of the 102 declared variables plus the three `button-1` ones) is in the ScreenApiDocs README and shipped as `.pp-scalar` in `bundle.css`; preview of the themed result in both themes; the three unused Swagger classes are removed |
| GAP-059 Contrast report does not name the ground | **resolved:** `contrast.md` has a Ground column on every pair, a table *Translucent tokens over every ground* (7 tokens, 3 grounds, 2 themes) with the grounds each is approved over, and a rule at the top. Real alpha values are used |
| GAP-054 `.pp-lockhelp` does not wrap | **resolved:** `flex-wrap: wrap`; column layout at 480px and below; checked at 360px |
| GAP-057 First-run folder diagram wraps | **resolved:** `.pp-tree` is `nowrap`; it sits in `.pp-scroll` (focusable, labelled region); verified at 360px |
| GAP-058 ScreenAccess empty state | **confirmed as built:** EmptyState "Nog geen gebruikers om toegang te geven" with link "Naar Gebruikers"; previews desktop and phone |

## Decisions
- **Scalar mapping.** Colours: GET `info`, POST `paid`, PUT `warning`, DELETE `unpaid`; text `text-strong`, `text`, `muted`; grounds `surface`, `surface-2`, `bg`. Where I changed what the app built: `--scalar-background-accent` is `primary-tint-soft` (was `primary-tint`, which fails AA over `surface-2` in the light theme); `--scalar-background-alert` and `-danger` are `warning-tint` and `unpaid-tint` (they defaulted to solid orange and red); `button-1`, `-color` and `-hover` are mapped (primary buttons, not black or white); links follow `.pp-link`; borders are 1px; Scalar's 10px text becomes `text-xs` (12px); radius, text, leading and shadow follow our scales. Structural variables (header and address-bar height, brightness, tooltip padding, text-decoration colours, font weights) keep Scalar's value.
- **The dump list is incomplete.** The section "Still on a value of their own" of the Scalar dump leaves out `--scalar-button-1`, `--scalar-button-1-hover` and the literal heading, line-height, paragraph and size variables of the group "other". All of them are decided in the README mapping now. Regenerate the dump after a Scalar upgrade and compare.
- **Check in the app:** the callouts that use `--scalar-background-alert` and `-danger` (text colour on the tint) and the `Test request` button.

## New and changed
- **Tokens:** none added or changed.
- **Contrast report:** new column Ground, new table of translucent tokens over `bg`, `surface` and `surface-2`; alphas are the real ones from `tokens.css` (until 1.6 rounded: .08, .14, .20; no verdict changed). Not approved: `primary` text on `primary-tint` over light `surface-2` (4.34) and over `primary-tint-strong` over `bg` and `surface-2`, and `muted` text on `primary-tint` over light `surface-2` (4.27). 129 paired checks, 0 fail.
- **New classes:** `.pp-scalar` (variable mapping), `.pp-sc`, `.pp-sc-side`, `.pp-sc-search`, `.pp-sc-grp`, `.pp-sc-main`, `.pp-sc-op`, `.pp-sc-m`, `.pp-sc-code`, `.pp-sc-note`, `.pp-sc-btn` (illustration of the themed renderer in the preview only).
- **Changed classes:** `.pp-lockhelp` (wrap, column at 480px), `.pp-tree` (nowrap, `width: max-content; min-width: 100%`).
- **Components and screens changed:** ScreenApiDocs (preview and README rewritten), AssetListItem, AccessMatrix, ScreenAccess, ScreenSystemStates.
- **Copy:** `access.empty.title`, `access.empty.body`, `access.empty.link`, `api.title`, `api.noLoginField`, `api.search`, `api.testRequest`, `api.loadErrorBody` (changed text: "De documentatie kon niet worden opgehaald. Probeer het opnieuw.").

## Breaking changes
- `.pp-api-head`, `.pp-api-row` and `.pp-method` are removed from `bundle.css` (added in 1.6 for the Swagger layout; unused in the app).
- The `ds-gap: GAP-056`, `GAP-057` and `GAP-058` markers can come out; GAP-056 can use `.pp-scalar` instead of the app's `.app-api` block.

---

# Changelog 1.6

Resolves GAP-047 to GAP-053 and cleans the two milestone 9 previews (ScreenSystemStates, ScreenApiDocs). Version 1.5 follows below.

| Gap | Result |
|---|---|
| GAP-053 Share page and PDF: totals read "€ 0,00" with no prices | resolved: with no priced line the totals card (page) and totals block (PDF) are left out; list, "Prijs volgt", footnote and "Download overzicht" stay; "Er staat niets open." wins with "Alleen openstaand" on; the PDF footer then has no payment instruction. Previews added to ScreenSharePage and DocOverview |
| GAP-052 ShareLinkRow columns shift without Intrekken | resolved: last column fixed at `--pp-share-act: 88px` (no subgrid), also at 900px and below |
| GAP-047 DatePicker calendar button | confirmed as built, specified: `.pp-iwrap>.pp-btn.r` ghost icon button, label "Kies een datum", click in the field does not open the calendar; previews of DatePicker and ScreenInvoiceExport now show the button |
| GAP-048 Locked order controls | confirmed as built (visible `pp-help` line with `aria-describedby` instead of a tooltip, as you reasoned); added decision: "Spoel voor de hele print" skips locked orders and names the reason; locked previews in AssetListItem and CostBreakdown, rules in OrderSection, PaymentPanel and ScreenPrintDetail |
| GAP-049 "Geldig tot" without expiry | confirmed as built: row left out; preview added |
| GAP-050 Close TokenReveal without copying | confirmed as built: ConfirmDialog "Sluiten zonder kopiëren?" with "Terug" and "Sluiten"; preview added |
| GAP-051 Day counts 0 and 1 | confirmed as built: ICU plurals and "Vandaag", "morgen"; previews in ShareLinkRow and ScreenSharePage |
| M9 inline values | resolved: no layout `style` is left in ScreenSystemStates and ScreenApiDocs (only the data property `--w`); loading and error states added |

## Decisions applied
- **Share page and PDF:** one line per order; archived prints stay; written-off orders and deleted prints never appear; header shows logo, else company name, else "3D Prints Portal"; a niet-factureren klant sees Print, Project and Datum only; all dead links show the same page; the Overzicht says "Dit is een overzicht, geen factuur." and adds payment instructions only while something is open (reference: klant name).
- **Link expiry:** 7, 30 or 90 dagen, or Nooit; no notice and no "Geldig tot" row for Nooit.
- **No prices:** totals omitted, not "Prijs volgt" amounts (your choice).
- **Locked order:** "Spoel voor de hele print" skips it (your choice).

## New and changed
- **Tokens:** none added or changed (129 contrast pairs, 0 fail; no new colour pair).
- **New classes:** `--pp-share-act` (variable on `.pp-share`), `pp-lockhelp`, `pp-qty-text`, `pp-api-head`, `pp-api-row`, `pp-method`, `pp-minh-180/420/560`, `pp-w-980`, `pp-w-520`, `pp-left-t`, `pp-tree`, `pp-indent-1` to `pp-indent-4`, `.pp-alert.banner`, `.pp-state.is-inline`, `.pp-iwrap>.pp-btn.r`.
- **Changed classes:** `.pp-share` grid columns (fixed last column); `.pp-share-amt .pp-muted` no longer wraps.
- **Components:** changed DatePicker, AssetListItem, CostBreakdown, OrderSection, PaymentPanel, TokenReveal, ShareLinkRow, ScreenSharePage, DocOverview, ScreenPrintDetail, ScreenInvoiceExport, ScreenSystemStates, ScreenApiDocs. No new components.
- **Copy:** `date.pick`, `share.closeUncopied`, `share.closeUncopiedBody`, `common.back`, `date.daysOne`, `date.daysOther`, `date.agoOne`, `share.expiresTomorrow`, `share.expiresToday`, `spool.wholePrintSkipped`, `api.loadError`.

## Breaking changes
- None. The ApiDocs operation row padding changes from 10px to `space-2` (8px) and the method badge from 56px to 72px minimum.
- The `ds-gap: GAP-0xx` markers in the app code can come out for GAP-047 to GAP-051.

---

# Changelog 1.5

Resolves GAP-037 to GAP-045 and removes the remaining inline values from the milestone 8 previews. Version 1.4 follows below.

| Gap | Result |
|---|---|
| GAP-043 DatePicker calendar classes | resolved: `.pp-cal`, `.pp-cal-hd`, `.pp-cal-ft`, `.pp-pop.pp-calpop` in `bundle.css`; new component DatePicker with README and preview (open, error, phone bottom sheet); the export dialog uses it |
| GAP-041 Per-line "Markeer als betaald" in Openstaand | resolved: dialog in ScreenOutstanding (amount, default the remainder); one line per order; a Nabestelling reads "{print} (nabestelling {n})", Bestelling 1 shows the print name |
| GAP-040 "Spoel voor de hele print" placement | resolved: ScreenPrintDetail and OrderSection READMEs and preview; "Nog niet in een bestelling" section for unassigned files; files that never count are marked |
| GAP-042 "Factuur" button on phones | resolved: CustomerChips toolbar; hidden for niet-factureren klanten (variant added) |
| GAP-037 Invoice footer | resolved (option "Voorstel overnemen"): "Definitief maken" is refused without name and IBAN (aria-disabled, hint with link to Instellingen; Concept still works without the payment sentence); "Deze factuur is volledig betaald." replaces the payment sentence when nothing is open |
| GAP-038 18 truncated READMEs | resolved: cause was a write helper that truncated the file before reading it; fixed and every README holds the full spec (anatomy, tokens, states, accessibility, Dutch copy) |
| GAP-039 `pp-text-lg/xl/2xl` undefined | resolved: defined, plus `pp-text-3xl` and `pp-gap-6` |
| GAP-044 `.pp-anchor.up` off screen on phones | resolved: on phones the sheet pins to the bottom; `.pp-device.phone .pp-anchor` is static so it anchors to the device |
| GAP-045 Three footer buttons overflow 440px | resolved: the footer wraps (primary on its own row); export dialog at 440px (`pp-dialog.sm`) and 360px phone stack verified |

## Decisions applied
- **Order date:** modification time of the newest counted G-code in the order, else the creation date; used for the Datum column, the Van/Tot en met filter and the OrderSection header.
- **Days open:** from the invoice date, else the date the Verkoopprijs was set, else the order date.
- **Payment reference:** final invoice uses its number; Concept and Herinnering use the klant name.
- **Finalising:** "Voorstel uit marge" becomes the order's Verkoopprijs; price, cost adjustments and "Aantal keer geprint" lock with "Op factuur {nummer}"; payments and write-offs still work.
- **Credit notes (Admin):** write off only what is still open; what was paid stays paid.
- **Role User:** Openstaand is read-only, no buttons, only granted klanten.
- **Logo:** PNG or SVG upload (max 1 MB), stored and served as PNG; it replaces the studio name in the AppShell sidebar, phone top bar and drawer (max height, alt text); the icon rail keeps the initial tile.
- **PDFs:** built-in Helvetica, Western European characters only. Reindex progress bar: unchanged.

## New and changed
- **Tokens:** none added or changed (129 contrast pairs, 0 fail).
- **Classes:** `pp-cal`, `pp-cal-hd`, `pp-cal-ft`, `pp-calpop`, `pp-logo`, `pp-viewer-sm`, `pp-text-lg/xl/2xl/3xl`, `pp-gap-6`, `pp-cust-name`, plus layout helpers that replace inline values in the share, document and skeleton previews.
- **Components:** DatePicker (new); changed: AppShell (logo), CustomerChips, CustomerCard, ScreenOutstanding, ScreenInvoiceExport, ScreenPrintDetail, OrderSection, DocInvoice, DocOverview, ScreenShareLinks, ScreenSharePage.
- **Previews:** `class="sel"` removed (state is `aria-selected`); `<style>` blocks removed from DocInvoice, DocOverview, DocReminder, PrintCard and Viewer3D (only the Cover keeps one).

## Breaking changes
- None. Class `pp-btn-focus` (a typo) is now `pp-focus`.

---

# Changelog 1.4

Resolves GAP-029 to GAP-036 and removes the inline values from the M6 and M7 previews. Version 1.3 follows below.

| Gap | Result |
|---|---|
| GAP-033 Instellingen: printers, tariff, material prices | resolved: Prijzen gets Stroomtarief and Materiaalprijzen; new section Printers (`pp-printer`); ScreenSettings desktop, errors, empty state and phone |
| GAP-029 No stacking level for popovers | resolved: stacking tokens `z-raised`, `z-sticky`, `z-popover`, `z-tooltip`, `z-overlay`; `.pp-pop` carries `z-popover`; `.pp-anchor` floats it |
| GAP-035 Several orders in one print (Nabestelling) | resolved: OrderSection, NabestellingDialog, "Niet in een bestelling" badge and hint, summed PrintCard/PrintRow, PaymentPanel rules, ScreenPrintDetail variant |
| GAP-034 Bulk dialogs "Spoel toewijzen" and "Prijs instellen" | resolved: BulkDialogs with the per-print result (toast plus alert with reasons); price goes on the newest order |
| GAP-036 Inline sizes in the M6 previews | resolved: classes and one token (`space-9`); no layout `style` is left in PaymentPanel, CostBreakdown, CostOverrideDialog, SpoolPicker, MoneyDisplay, ScreenSettings, ScreenOutstanding, ScreenInvoiceExport and ScreenInvoices |
| GAP-030 CustomerCard selected state; restore on phones | resolved: `.pp-cust.is-selected`; deleted chip `.pp-chip.is-deleted` and "Herstellen" in the toolbar |
| GAP-031 Palette colours announced in English | resolved: Dutch accessible names and keys `tags.colour.*` |
| GAP-032 ConfirmDialog README and copy deck differ | resolved: the README and preview now use the copy deck text |

## Decisions applied
- **Bulk price:** "Prijs instellen" always sets the price on the newest order of each selected print; a print whose newest order is paid, written off or invoiced fails with a reason, the others continue.
- **Orders on the detail page:** stacked sections, newest first, settled orders closed; same on phone and desktop.
- **Instellingen:** Stroomtarief and the Materiaalprijzen table under Prijzen, plus a separate section Printers.
- **Deleting a Nabestelling:** Admin and Editor, only without payment or write-off and not on an invoice; Bestelling 1 never; the files return to "Niet in een bestelling".

## New tokens
- `space-9` 48px (slot indent).
- Family `zIndex`: `z-raised` 1, `z-sticky` 10, `z-popover` 30, `z-tooltip` 40, `z-overlay` 50.
- Family `opacity`: `opacity-deleted` 0.45, `opacity-archived` 0.6, `opacity-disabled` 0.5.
- No colour token is new or changed. Contrast report: 129 pairs, 0 failures (new rows: selected customer card, progress bar on its track, selected card border).

## Changed tokens
None changed. The raw numbers in `bundle.css` now read the new tokens: z-index 10, 20 (tooltips, now `z-tooltip` 40), 50 and the matrix cells, and the opacity values 0.45, 0.6 and 0.5.

## New and changed classes in `components/bundle.css`
- **Stacking and popovers:** `.pp-anchor` (with `.end` and `.up`); `.pp-pop` now has `position:relative` and `z-index: var(--z-popover)`.
- **Orders:** `.pp-orders`, `.pp-order` (a `details` element, with `.ttl`, `.sum`, `.chev`, `.bd`, `.is-open-order`), `.pp-pick`, `.pp-results`.
- **Settings:** `.pp-printer`, `.pp-mprices`, `.pp-progress` with `.pp-bar` (width from the data property `--v`), `.pp-logo-box`, `.pp-setrow`, `.pp-kv.narrow`, `.pp-kv.tight`, `.pp-time`, `.pp-cols-2`, `.pp-cost tr.slot` and `.pp-slotname`.
- **States:** `.pp-cust.is-selected`, `.pp-chip.is-deleted`, `.pp-hint` (standalone), `.pp-scrim.sheetframe`.
- **Helpers:** `pp-m0`, `pp-fw-regular|medium|bold`, `pp-right`, `pp-grow`, `pp-minw-0`, `pp-minw-200`, `pp-self-start`, `pp-items-start`, `pp-items-center`, `pp-pushr`, `pp-info`, `pp-unpaid`, `pp-dim`, `pp-bg-2`, `pp-mb-1`, `pp-p3`, `pp-p4`, `pp-rel`, `pp-reset`, `pp-plain`, `pp-minh-64`, `pp-minh-700` and the fixed widths `pp-w-120|160|200|260|320|340|420|440|480|600` (all capped at 100% of the container). They already existed from before: `pp-between`, `pp-end`, `pp-start`, `pp-push`, `pp-nowrap`, `pp-fill`, `pp-gap-*`, `pp-text-*`, `pp-strong`.

## New components and screens
- **New components:** OrderSection, NabestellingDialog, BulkDialogs.
- **Changed components:** Popover (floating, `z-popover`), FilterBar and TagEditor (stacking notes), PaymentPanel (overpayment error, undone payments in the history), PrintCard and PrintRow (several orders), AssetListItem (not in an order), CustomerCard (selected), CustomerChips (deleted klant), ConfirmDialog (text from the copy deck, new confirmations), BulkActionBar (what the buttons open), CostBreakdown, CostOverrideDialog, SpoolPicker and MoneyDisplay (no inline values).
- **Changed screens:** ScreenSettings (Prijzen, Printers), ScreenPrintDetail (orders), ScreenDashboard (notes), ScreenTags (Dutch colour names), ScreenOutstanding, ScreenInvoiceExport, ScreenInvoices (no inline values).

## Inline audit (GAP-036)
In the nine listed previews and the new ones, every `style` attribute is gone except the data properties `--c1`, `--c2`, `--v`, `--tag` and `--tag-ink`. The values that had no token: slot indent 48px (`space-9`), the 110px label column (`pp-kv.narrow`), the two time inputs (`pp-time`), the reindex progress bar (`pp-progress`), the logo box (`pp-logo-box`), the Klanten rows (`pp-setrow`), the two-column Bedrijfsgegevens grid (`pp-cols-2`, one column on phones) and the Standaardmarge field (`pp-w-200`). Two values map to the nearest token: 6px gaps became `space-2` (8px) and 13px text became `text-sm` (13.5px).
Previews of other components still contain layout `style` attributes (for example the share page, API-docs and the loading skeletons); they are not part of the contract and will be cleaned in the next round if you want that.

## Breaking changes
- **Tooltip layer:** rail and nav tooltips moved from `z-index` 20 to `z-tooltip` (40); anything between 20 and 40 in the app now sits below them.
- **Popover markup:** `.pp-pop` now has `position:relative`. Floating popovers must sit in `.pp-anchor`; a `.pp-pop` placed elsewhere keeps its place in the page flow.
- **Print detail:** the page lists OrderSection blocks; a print with one order shows one open "Bestelling 1" section instead of a single Bestanden, costs and payment column.
- **PrintCard and PrintRow:** price, status and open amount are sums over the orders.
- **Copy:** `confirm.deleteTagBody` and the README example for `confirm.deleteCustomerBody` now match the copy deck (the deck text did not change).

---

# Changelog 1.3

Resolves GAP-024 to GAP-028 and removes inline values from the dashboard, print detail and asset list. Version 1.2.1 follows below.

| Gap | Result |
|---|---|
| GAP-024 Dimmed deleted and archived thumbnails, row flash, muted row text | resolved: `.is-deleted` (45%), `.is-archived` (60%), `.pp-row.flash` and `.pp-row .muted` in `bundle.css`; no inline opacity |
| GAP-025 Phone customer chip row | resolved: `.pp-chips` and `.pp-chip` with `aria-pressed`, component CustomerChips |
| GAP-026 Delete a whole klant | resolved: ghost icon button on CustomerCard, "Klant verwijderen" in the filtered phone view, destructive ConfirmDialog, deleted card with Herstellen; keys `customers.delete`, `confirm.deleteCustomer`, `confirm.deleteCustomerBody` |
| GAP-027 Tag editor and tag management | resolved: TagEditor popover (`.pp-tagpop`), palette `.pp-pal`, new page ScreenTags (Admin and Editor); keys `tags.*`, `confirm.deleteTag*`, `error.tagExists`, `error.tagTooLong` |
| GAP-028 Copy for fullscreen and print count | resolved: `viewer.fullscreen`, `viewer.exitFullscreen`, `customers.printCount` (ICU plural) |

## New and changed
- **Tokens (new, 10):** `tag-rose`, `tag-orange`, `tag-amber`, `tag-lime`, `tag-teal`, `tag-sky`, `tag-blue`, `tag-violet`, `tag-lilac`, `tag-grey`, per theme. Chip text `#141a33` or `#ffffff`; all new pairs pass WCAG 2.2 AA (121 pairs, 0 failures).
- **Classes (new):** `.pp-chips`, `.pp-chip`, `.pp-cust`, `.pp-custs`, `.pp-toolbar`, `.pp-tagpop`, `.pp-pal`, `.pp-tagrow`, `.pp-plate`, `.pp-detail`, `.pp-showcase`, `.pp-card-hd`, `.pp-viewer .full`, `.pp-viewer.fluid`, `[data-c=…]`, text, gap and layout utilities. **Changed:** thumbnails, cards and rows (`.is-deleted`, `.is-archived`, `.flash`).
- **Components (new):** CustomerCard, CustomerChips, TagEditor. **Changed:** PrintCard, PrintRow, AssetListItem (40px plate thumbnail), TagChip (`data-c`), Viewer3D (fullscreen), ConfirmDialog (klant, tag), AppShell (Tags nav item for Admin and Editor).
- **Screens (new):** ScreenTags, desktop and phone. **Changed:** ScreenDashboard, ScreenPrintDetail, User role view.
- **Audit:** inline values in the dashboard, print detail and asset list previews moved to classes. Remaining inline: `--c1`, `--tag`, `--tag-ink` (data) and `min-height` on preview devices (scaffolding, not for the app).

## Breaking changes
- Tag colours are now palette keys; an old free hex still renders through `--tag` and `--tag-ink` but is no longer offered in the editor.
- Print-detail delete and "Toon verwijderde" are role-gated as described in the README.
- The app can remove its temporary `ds-gap` styles for GAP-024 to GAP-028.

# Changelog 1.2.1

Patch release: resolves GAP-023. Version 1.2 follows below.

| Gap | Result |
|---|---|
| GAP-023 No class to swap a table for cards at 480px and below; login page padding stays 24px on phones | resolved: wrapper classes `pp-only-wide` and `pp-only-phone`, and `pp-center` pads the page with `space-4` (16px) at 480px and below |

- **How to use it:** put both layouts in the DOM, each in its own wrapper without a display of its own: `<div class="pp-only-wide">table</div>` and `<div class="pp-only-phone">cards</div>`. Above 480px only the first shows; at 480px and below only the second. The wide table keeps its own `pp-scroll` box as a fallback. The preview container `pp-device.phone` forces the same rules at a fixed width.
- **Screens changed:** Gebruikers and Toegang (table and cards in one DOM), Login (phone padding from the class instead of an inline value).
- **Tokens:** none new or changed. **Breaking changes:** none; the temporary `ds-gap: GAP-023` stylesheet in the app can be removed.
- **Not changed:** other tables (Facturen, Openstaand, print lists) keep their current phone behaviour; the swap classes are available for them.

---

# Changelog 1.2

Version 1.2 resolves GAP-013 to GAP-022 from the implementation of 1.1. Version 1.1 is kept below for history.

## Gap resolution

| Gap | Result |
|---|---|
| GAP-013 Deel-link for niet-factureren klanten | resolved: the disabled create dialog is gone; the Klant field shows the help "Deze klant wordt niet gefactureerd. De link toont alleen de printlijst, zonder bedragen." and Maken stays enabled; ScreenSharePage gets a not-billed variant (Print, Project, Datum only, intro "Hier zie je de prints die voor je gemaakt zijn.", no amounts, payment badges, totals or PDF button). DocOverview is unchanged: a niet-factureren klant has no Overzicht PDF |
| GAP-014 "Nooit" as expiry | resolved: fourth option Nooit with the help "De link blijft werken tot je hem intrekt."; ShareLinkRow shows "Verloopt niet" in `muted` (class `never`); the share page omits the expiry notice |
| GAP-015 AppShell has no responsive CSS | resolved: media queries at 900px (56px icon rail with tooltips) and 480px (top bar, bottom bar, `.pp-drawer`); phone rules exist as media queries, so the app never sets `.phone`; one DOM for every size; rail and drawer are drawn in the AppShell page |
| GAP-016 No line-height tokens or base typography | resolved: 8 `leading-*` tokens and a `body` rule in `bundle.css`; all raw line-heights in `bundle.css` now use the tokens |
| GAP-017 Raw sizes in login and system states | resolved: classes `pp-auth`, `pp-auth .or`, `pp-state`, `pp-state.wide`, `pp-iwrap.compact`, `pp-dialog.sm`; the 22px state heading is merged into `text-xl` / `leading-xl` (20/28), so no 22px token was added |
| GAP-018 Local sign-in by name or e-mail | resolved as proposed: field "E-mailadres of naam" (`type="text"`, `autocomplete="username"`), key `auth.identifier` |
| GAP-019 Choosing a password after a temporary one | resolved: new login-card state "Nieuw wachtwoord kiezen" (with errors) and a small dialog "Wachtwoord resetten voor '{naam}'" where the admin types the temporary password |
| GAP-020 "Rol wijzigen" on phones | resolved: the same native Select inside the card; the button and its copy are dropped |
| GAP-021 Editor rows in the access matrix | resolved: Editor rows look like Admin rows (disabled, checked, "· Editor"); note "Admin en Editor hebben altijd toegang."; phone cards show a disabled, checked list |
| GAP-022 Error copy for sign-in and users | resolved: `auth.oidcFailed`, `error.passwordTooShort`, `error.userExists`, `confirm.deleteUserBody`, all drawn in their screens |

## New tokens

`leading-xs` 16px, `leading-sm` 20px, `leading-base` 22px, `leading-md` 24px, `leading-lg` 26px, `leading-xl` 28px, `leading-2xl` 32px, `leading-3xl` 40px. They sit in the `fontSize` family of `tokens.json` (the format has no separate line-height family) and appear in `tokens.css` as `--leading-*`. No colour token is new or changed; the contrast report has 6 more rows (107 pairs, all pass).

## Changed tokens

None.

## New classes in `components/bundle.css`

`body` base rule, `pp-drawer-backdrop`, `pp-drawer`, `pp-auth` (with `.or`), `pp-state` (and `.wide`), `pp-iwrap.compact`, `pp-dialog.sm`, `pp-sr` (visually hidden), `pp-main > h1`, `pp-share .never`, plus the responsive rules for `pp-app`, `pp-side`, `pp-nav`, `pp-phone-top`, `pp-bottomnav`. The preview containers `pp-device.rail` and `pp-device.phone` force the same rules at a fixed width.

## New or changed components

- **AppShell:** responsive spec, DOM contract, icon rail, drawer.
- **ShareLinkRow:** "Verloopt niet" state.
- **AccessMatrix:** Editor rows, new note.
- **ConfirmDialog:** `pp-dialog sm`, delete-user confirmation with its consequence sentence.

## New or changed screens

- **ScreenLogin:** identifier field, Authentik-failed, session-ended and new-password states.
- **ScreenUsers:** compact role select, native select on phones, reset-password dialog, create-dialog errors, delete icon button.
- **ScreenShareLinks:** Nooit and not-billed creation, a link without expiry in the list.
- **ScreenSharePage:** not-billed variant, no expiry notice.
- **ScreenAccess:** Editor rows.
- **ScreenSystemStates:** classes instead of inline sizes (title 20px instead of 22px).
- **ScreenSettings:** README text about the Deel-link for niet-factureren klanten.

## Decisions applied

- **Credited prints:** a credited print becomes Afgeschreven. This is stated in the README rules; no new component was needed because the status already exists.
- **Sign-in rules:** Authentik admin group becomes Admin, a 60-minute idle and 12-hour session limit, 5 login attempts per minute, passwords of at least 12 characters and the last-Admin guard are recorded in README and the screen specs.

## Additions beyond the gaps

- An `info` notice "Je sessie is verlopen. Log opnieuw in." on the login card.
- A ghost button "Uitloggen" on the new-password card, so the user is never stuck.
- The user Denise added to the sample data (a second User row).

## Breaking changes

- **Markup:** AppShell. Nav links need `<span class="lbl">` and `data-tip`, the brand needs `.ini` and `.full`, and on phones `header.pp-phone-top`, `nav.pp-bottomnav` and the drawer sit inside `.pp-app` instead of next to it. `.pp-phone-main` and the `.phone .pp-stats` rule still exist for compatibility but are no longer used.
- **Copy keys removed:** `share.noShareLink`, `share.notBilled`, `access.adminAlways` (use `access.allAccessRoles`), `auth.email` (use `auth.identifier`).
- **Copy key text changed:** `auth.wrong` is now "Verkeerd e-mailadres, naam of wachtwoord."
- **Visual:** state-page titles are 20px instead of 22px; dialogs with a maximum width of 400px or less now use the 380px `pp-dialog sm`, wider ones the 440px default.

## Known limits

- Many previews still contain inline `style` attributes for demo layout. They are not part of the contract; the app uses only tokens and the classes above. The inline values in login, state pages, role select and ConfirmDialog (GAP-017) are gone; a full audit of every preview is not done.
- Wide layouts (1440px and up) are specified in the README text, not drawn.

---

# Changelog 1.1

Version 1.1 resolves every open gap from the implementation of 1.0.

## Gap resolution

| Gap | Result |
|---|---|
| GAP-001 No screens, screen copy or invoice layout | resolved: 17 screen and document pages added (below), screen copy in each README and in `copy-deck.md` |
| GAP-002, GAP-003 | not in the list received; nothing done |
| GAP-004 No "partially paid" status | resolved: badge Deels betaald, remaining-amount line, PaymentPanel, OutstandingGroup, PrintCard, PrintRow, share page, documents |
| GAP-005 Per-slot filament usage | resolved: slot rows and slicer-colour swatch in AssetListItem; CostBreakdown slot sub-rows; tint fallback rule in SpoolSwatch |
| GAP-006 Aantal keer geprint | resolved: compact input in AssetListItem, "× n" in meta, "n × …" in CostBreakdown |
| GAP-007 Duplicate file warning | resolved: badge Mogelijk dubbel plus visible hint line (see deviations) |
| GAP-008 3MF plates as rows | resolved: child rows "Plaat n" with their own controls and slots |
| GAP-009 Manual price per kg, grams and time | resolved: new CostOverrideDialog opened by "Aanpassen" |
| GAP-010 Niet factureren customers | resolved: badge, "Kosten" display, PaymentPanel note, Instellingen toggle; no Deel-link for such klanten (your decision) |
| GAP-011 Write-off states | resolved: written-off PaymentPanel state, admin undo, new WriteOffDialog with optional reason |
| GAP-012 Invoice register, finalise, credit notes | resolved: new Facturen screen, finalise dialog, credit-note dialog, "Op factuur" badge and locked state |

No gap was rejected or merged. Decisions you made while resolving: Facturen is visible to Admin and Editor and only Admins create a Creditnota; a Creditnota covers the whole invoice or chosen lines; a klant that is niet factureren cannot get a Deel-link.

## New tokens

None. Every new state uses existing tokens. Version in `tokens.json` is now 1.1.

## Changed tokens

None. Values, names and the `tokens.css` fallback are unchanged.

## New components

- **AppShell** (Screens group): sidebar, icon rail, top bar, bottom bar and drawer.
- **CostOverrideDialog**: manual price per kg, weight and print time.
- **WriteOffDialog**: partial write-off with optional reason.

## Changed components

- **StatusBadge:** added Deels betaald, Niet factureren, Mogelijk dubbel, Op factuur {nummer}, Concept, Definitief, Creditnota; added the `pp-remaining` line.
- **MoneyDisplay:** remaining-amount and negative variants, "Kosten" label.
- **SpoolSwatch:** `.slicer` variant with the "slicer" hint chip; thumbnail tint rule.
- **AssetListItem:** times-printed input, slot rows, plate child rows, duplicate hint, automatic and manual exclusion with reason; layout now adapts to container width.
- **CostBreakdown:** header with Aanpassen, per-slot sub-rows, times-printed calculation text, "Niet meegeteld" line.
- **PaymentPanel:** states for partial, written off, niet factureren, rol User, locked by invoice, missing cost; admin-only undo actions.
- **OutstandingGroup:** partial line variant; totals are sums of remainders.
- **PrintCard, PrintRow:** partial, niet factureren, deleted (with Herstellen) variants.
- **ConfirmDialog:** finalise variant and the new undo and finalise copy.

## New screens and documents (group Screens)

ScreenLogin, AppShell, ScreenDashboard, ScreenPrintDetail, ScreenInvoiceExport, ScreenOutstanding, ScreenShareLinks, ScreenAccess, ScreenUsers, ScreenSettings, ScreenApiDocs, ScreenSharePage, ScreenInvoices (new page), ScreenSystemStates, DocInvoice (Factuur, Concept, Creditnota), DocReminder (Herinnering), DocOverview (Overzicht).

## Changed screens

None; there were no screens in 1.0.

## New files and copy

- `copy-deck.md`: about 150 new keys, grouped by area.
- `contrast.md`: 11 new rows (neutral badge text, remaining-amount line, duplicate hint, document text on white paper); all pass.
- `bundle.css`: classes `pp-slot`, `pp-hintchip`, `pp-qty`, `pp-reason`, `pp-remaining`, `pp-assetlist`, `pp-device`, `pp-app`, `pp-side`, `pp-nav`, `pp-main`, `pp-bottomnav`, `pp-paper` and layout helpers.
- README: roles, documents, screens, payment rules and the "no VAT" rule.

## Deviations from the proposals

- **GAP-007:** the explanation is a visible hint line instead of a tooltip, so it is readable on touch and by screen readers; the badge itself is as proposed.
- **GAP-009:** when Spoolman supplies the price per kg the price field is disabled with "Prijs komt uit Spoolman.", which follows the precedence you gave (Spoolman, then handmatig, then standaard per materiaal).
- **GAP-001:** screens are shown at desktop (980px) and phone (360px) widths, with both themes through the page's theme switch. Tablet and wide behaviour is specified in text under Responsive and AppShell, not drawn.
- **GAP-012:** concept PDFs are not stored, so the register lists only final invoices and credit notes.

## Breaking changes

- **Copy:** the vocabulary entry "BTW" is removed from the README; no token or component used it. Any implementation of a VAT toggle, rate, VAT number or KvK field from the brief must be removed.
- **Behaviour:** "Betaling ongedaan maken" is now Admin-only and always confirms.
- **Layout (AssetListItem):** `.pp-asset` is now a two-line grid by default and switches to one line inside a `.pp-assetlist` container that is 760px wide or more; `.pp-slot` is now a wrapping flex row. Consumers that copied the 1.0 three-column grid must wrap the list in `.pp-assetlist`.
- **Payment status:** a print with `0 < paid < price` now shows Deels betaald instead of Open, and counts only its remainder in Openstaand.
- **Invoice numbers:** only final invoices and credit notes are numbered; a Concept download and a Herinnering have no number.

## Notes

IBAN, address and e-mail on the documents are placeholders. The Swagger operations on the API-docs screen are illustrative.
