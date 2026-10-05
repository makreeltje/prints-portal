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
