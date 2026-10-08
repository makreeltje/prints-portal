# Changelog 2.0

Decides the 20 gaps open after 1.9 (GAP-071, GAP-072, GAP-088 to GAP-105). **Version 2.0, not 1.10**, because `--mix` leaves the contract and `.pp-thumb.tinted`, `.pp-plate.tinted` and the poster frame paint something else; every other round renamed nothing. Version 1.9 follows below.

**`version` in `tokens.json` is now the string `"2.0"`, not a number.** A JSON number cannot carry this: `2.0` parses back as `2` and `1.10` as `1.1`, which is *lower* than 1.9. Your importer takes `VERSION` from this field, so it has to be a string from here on.

| Gap | About | Result |
|---|---|---|
| GAP-071 | Dark filament tint swallows the model | **resolved**: no ground tint at all. The colour moves to the object (4px bar, swatch, the model in the render); the render carries a baked `#6f7a96` outline; `--mix` and `color-mix()` are gone |
| GAP-072 | Card subtitle repeats the print name | **resolved**: yes, the 1.9 proposal as it stands, now official for card, row, breadcrumb and share line |
| GAP-088 | Internal link label still in two specs | **resolved**: dropped from DocOverview (no sub-line) and from ScreenSharePage's Anatomy, which contradicted its own 1.9 section |
| GAP-089 | No video decoder in the container | **resolved**: the spec stops asking for a poster frame anywhere; a video is a neutral ground, a `file-video` icon, a play badge and a duration |
| GAP-090 | Show which files a print lacks | **resolved**: one `pp-lacks` chip, "Ontbreekt: G-code, 3MF, STL" in that fixed order, absent when nothing is missing. Bare icons rejected, video and "incomplete 3MF" stay out by your measurement |
| GAP-091 | The tile looks selectable but only its checkbox selects | **resolved**: one rule for all four affordance gaps — one target per tile or row, controls above it, text that leads nowhere is not styled like a target. In README under *Targets* |
| GAP-092 | Klant chip sets name and count in the same weight | **resolved**: `span.nm` at 600 in the chip's ink, `span.n` and `span.amt` at 400 with a `·` separator; no new colour pair |
| GAP-093 | Grid opens on the whole card, list only on the title | **merged into GAP-091**: the name cell gets `pp-rowlink`, stretched over the row |
| GAP-094 | Model picker shows file names, and a Select above six | **resolved**: the Select above six is **rejected** (two controls for one job); the strip is the control at any count and fades when it overflows. The button is the per-model render when one exists, else the type glyph and the name — never the print's own thumbnail |
| GAP-095 | Empty space beside the capped viewer, the page reads wrong | **resolved**: `pp-pdtop`, a two-column media row — viewer and strip left, the card "Deze print" (facts plus the print's spool) right |
| GAP-096 | Timelapse buried in the file list | **resolved in a changed form**: taken into the media strip as you proposed, but as a neutral button with a play glyph and a duration, never a poster, and it swaps the viewer for the inline player |
| GAP-097 | Every file listed inside every order | **resolved in a changed form**: the inventory moves to print level (`pp-pdfiles`), the costing stays in the order ("In deze bestelling"), because a locked order must keep its own counts and slot spools |
| GAP-098 | Column menu in Toegang is painted over | **resolved**: the cell that holds an open popover carries `has-pop` (z-index `z-popover`); a popover's own z-index cannot win against a sticky sibling cell |
| GAP-099 | A user's name in Toegang looks interactive | **merged into GAP-091**: the matrix's first cell becomes `text` with `cursor: default` |
| GAP-100 | Reused password shown as "Er ging iets mis" | **resolved**: official copy `auth.pw.unchanged`, a changed help line that prevents it, and the rule that every error code an endpoint can return has its own key |
| GAP-101 | Instellingen and Tags leave most of their width empty | **resolved**: `pp-settings` and `pp-taggrid` — columns of at least 300–320px up to a 1080px measure, never a third column of form fields and never a stretched short row |
| GAP-102 | API-docs still a box in a box | **resolved**: `pp-bleed` and `--pp-pad` — a renderer that brings its own frame fills the content area through the page padding; only the heading keeps it |
| GAP-103 | The share page offers no way to pay | **resolved**: the "Betalen" block from 1.9 is the answer and can no longer be silently absent (a warning in Bedrijfsgegevens and in the create dialog when no IBAN is set). An online payment button is **rejected with a reason**: it needs a payment provider and cannot carry the amount |
| GAP-104 | An uploaded SVG logo silently loses its text | **resolved**: the file contract is checked at upload — no `<text>`, `<tspan>` or `textPath`, nothing external, with the Dutch refusals |
| GAP-105 | Nothing says what a logo must satisfy | **resolved**: six points in README (3:1 on both `surface` values, no text in SVG, self-contained, legible at 32px with no tagline, readable in black and white), plus a preview on both grounds at once |

## The two corrections you made

- **GAP-071, the `--mix` floor does ship.** Noted, and it changes nothing about the answer: the measurements are of the shipped rule, and they are what killed it. Thank you for the retraction — it is the reason this gap got a direction instead of a fourth number.
- **GAP-072 was never resolved, only proposed.** Correct, and it was my fault for making a proposal that read like a decision. It is resolved now, unchanged, so the half you built is right and `placeOf` is the only thing left to do.

## What I decided against your suggestion

- **GAP-096** — accepted, with the poster taken out of it (there is no decoder, so there is no frame) and with the group label spelled out.
- **GAP-097** — accepted in a narrower form. Moving *everything* to print level would have made the per-order counts and slot spools print-level values, which breaks the locked order of 1.6. The line is: the inventory is the print's, the costing is the order's.
- **GAP-094, the Select above six models** — rejected. The gap is "the strip says too little"; a Select says less.
- **GAP-090, icons rather than a chip** — the owner asked for small icons; it is a chip with one icon and the type names instead. Three slashed glyphs would be three inventions and a legend to learn, and at `text-xs` the words are shorter than the legend.
- **GAP-103, an online payment button** — rejected, with the reason in ScreenSharePage. It is a product decision; if you want it, log it and I will design the slot.

## New and changed

- **Tokens:** none added, renamed or removed. `border-strong`'s usage note now also names the baked outline value. **Removed from the contract:** the inline data property **`--mix`**. Remaining allowed data properties: `--c1`, `--c2`, `--tag`, `--tag-ink`, `--v`, `--w`.
- **New classes** `.pp-lacks`, `.pp-rowlink`, `.pp-pdtop`, `.pp-pdfiles`, `.pp-pdnew`, `.pp-settings`, `.pp-taggrid`, `.pp-bleed`, `.pp-logo-pair`, `.pp-w-1080`, and the modifiers `.has-pop` (matrix cell), `.span-2` (settings section), `.video` (`pp-modelbtn`), `.on-light` and `.on-dark` (`pp-logo-box`), plus the parts `.nm` (chip), `.dur` (model button), `.ord` (asset row), `.is-overflow` on `.pp-models`.
- **Changed classes** `.pp-thumb.tinted` (neutral ground; `::after` is now the filament bar on a card thumbnail and is suppressed at `sm` and in the model strip), `.pp-plate.tinted` (neutral ground), `.pp-thumb.poster` (never a frame), `.pp-main` and `.pp-phone-main` (padding through `--pp-pad`, same computed value), `.pp-matrix th:first-child`/`td:first-child` (`text`, `cursor: default`), `.pp-matrix th.has-pop`/`td.has-pop`, `.pp-chip` (ink `text`) with `.nm`/`.n`/`.amt`, `.pp-table tbody tr` (`position: relative`), `.pp-print .pp-sel` (hairline, full tap area), `.pp-order .pp-detail` at 900px and below (Betaling first, hairline moved).
- **Components changed:** ScreenPrintDetail, ModelPicker, PrintCard, PrintRow, OrderSection, AssetListItem, SpoolSwatch, VideoPlayer, CustomerChips, AccessMatrix, ScreenAccess, ScreenSettings, ScreenTags, ScreenApiDocs, ScreenSharePage, ScreenLogin, DocOverview.
- **Previews redrawn:** ScreenPrintDetail (1280px with one order, 980px with two, 360px with and without a model), ModelPicker (strip with a timelapse, the timelapse chosen, twelve models overflowing, phone, loading, video-only print), PrintCard (the filament bar on black, dark purple, yellow, white and no spool; two of seven cards carry a missing-files chip, matching the 24%/2% distribution), PrintRow, ScreenAccess (1360px with the leftmost column menu open over the sticky column), ScreenSettings (two columns, the logo on both grounds, the IBAN warning, the SVG refusal), ScreenTags (three columns), ScreenApiDocs (bleeding renderer), CustomerChips, VideoPlayer.
- **Contrast report:** 20 new rows, **163 pairs**, 0 fail among the pairs the system uses. Two rows are recorded as **failing on purpose** (`primary` as a logo ink on the opposite theme's ground, 2.52 and 2.79) to document a forbidden pair, and one pair is retired: "rendered model on its filament ground" cannot be measured and no longer exists.
- **Copy deck:** "Added in 2.0" (27 keys), two changed keys (`auth.passwordHelp`, `settings.logoHelp`), nothing removed. The duplicated *Added in 1.7* section is deleted; no key changed. The duplicated *Versie 1.7* paragraph in README is deleted too.
- **do-dont.md:** a new 2.0 section with the rules behind this round (Targets, colour that belongs to the data, width, absence).

## Breaking changes

1. **`--mix` is out of the contract.** The app can stop computing a luminance; the property is ignored if it stays. Every thumbnail and plate loses its coloured ground — visible on every card and row.
2. **The poster frame is out of the spec** (GAP-089). `pp-thumb.poster` and the inline player never hold an extracted frame; the `<video>` carries no `poster` attribute.
3. **The print detail's structure changes.** "Spoel voor de hele print" moves into the card "Deze print" in the media row; the card "Nog niet in een bestelling" is gone (its rows are rows of the print's file list with the badge); an order's "Bestanden" section becomes "In deze bestelling" and holds only the items that order bills; STL, 3MF-without-plates, video, PDF and link rows are no longer inside Bestelling 1. At 900px and below an order's sections are ordered Betaling, Totaalkosten, In deze bestelling.
4. **The order of `pp-main`'s children on a phone** is set by flex `order` on `pp-pdfiles` and `pp-pdnew`; an app that reorders the DOM itself will fight it.
5. **Not breaking, but worth knowing:** `.pp-table tbody tr` is now `position: relative` so a row link can stretch. If relying on that is unwelcome, delegate a row click to the name link instead; same behaviour, same single target.

## What I need you to measure

1. **GAP-071 / the render.** The measured contrast between the rendered model (with the new 1px `#6f7a96` outline) and the thumbnail ground in **both themes**, for a black spool, a white spool and a dark purple one. The outline is 3.69 light / 3.53 dark against `surface-2` by calculation; I want it from the app. If a *white* model on light `surface-2` is under 3:1 without the outline reaching it, the outline is drawn too thin, not the rule wrong.
2. **GAP-094 / GAP-096.** Does the renderer produce **one PNG per model file or one per print**? And the 1.9 question: the largest and median number of models per print, and how many prints hold both models and a timelapse. The spec covers both branches; the numbers only tell me whether the strip needs a second row above some count.
3. **GAP-095.** The y-position of the price field at 1360×900 and 390×844 after this round, and whether the right-hand card of the media row at 1360px is much shorter than the viewer beside it. If it is, the row has dead space again and I would move the newest order's Betaling into it.
4. **GAP-098.** After the fix, the left edge of the open panel and the right edge of the sticky column at 1360px. I expect the full 140px and "Alles selecteren". If any is still cut off, the scroll box *is* clipping it and the answer is a portal, not a z-index.
5. **GAP-101.** How many tags the real library has. Under four and I would rather cap the Tags card at 560px and leave the width empty on purpose.
6. **GAP-103.** Is an IBAN filled in in Bedrijfsgegevens, and does the "Betalen" block appear on a link with an open amount? If the IBAN is set and the block is missing, this is an app bug, not a design gap.
7. **GAP-089.** Still unanswered from 1.9: how many of the videos are `.mkv`. If it is most of them, the "cannot play in the browser" alert is the normal state and the button should say so.
8. **GAP-090.** Not needed — your distribution was enough, and it decided the form of the answer. Thank you for measuring the thing that was actually in doubt.

## Proposals, for you to log as gaps if the owner wants them

- **A payment link on the share page.** An optional "Betaallink" in Bedrijfsgegevens whose URL becomes a primary button "Betalen" at the top of the Betalen block, with the amount still shown as text because a generic link cannot carry it. Product decision; not designed until asked.
- **A per-model render.** If the renderer only makes one PNG per print, one per model would make the media strip say what GAP-094 asked for. Cost is in the indexer, not here.
- **`api.endpoints` as the renderer region's name**, still optional from 1.8.

---

# Changelog 1.9

Resolves GAP-062 to GAP-087 (26 gaps from the walkthrough of app 1.0.0). Version 1.8 follows below.

| Gap | About | Result |
|---|---|---|
| GAP-062 | Checkbox hops 4.5px when ticked | **confirmed as built**: `vertical-align: top` on `.pp-opt` is now in `bundle.css` |
| GAP-063 | Sidebar footer unreachable on tall pages | **confirmed as built**: `.pp-app>.pp-side` is sticky, `100vh`, `overflow-y:auto`; the page scrollbar stays on the page |
| GAP-064 | Viewer 4:3 and 1090x830 | **resolved**: `.pp-viewer.fluid` caps at 560px (420px high); no model is `pp-viewer is-empty`, a 72px strip |
| GAP-065 | Theme control always a moon | **resolved**: icon shows the current state (monitor, sun, moon); accessible name names state and next state |
| GAP-066 | No sort and no status filter | **resolved**: Sorteren and Status Selects in FilterBar, server-side, in the URL |
| GAP-067 | Klant strip grows without limit | **resolved** (your decision): one scrollable chip row on all widths plus "Overzicht" dialog with the tiles; about 56px |
| GAP-068 | No thumbnail in the list view | **resolved**: 40px `pp-thumb sm` first column in PrintRow, rule for the phone block |
| GAP-069 | Bulk bar not sticky above 480px | **resolved**: sticky at every width (`bottom: space-4` floating, flush on phones) |
| GAP-070 | Only the klant name is clickable | **confirmed as built, whole tile** (stretched button, `aria-pressed`, controls above it) |
| GAP-071 | Dark tint swallows the model | **proposed, needs your measurement**: `--mix` floor towards `border-strong` (40% minimum); I need the model/ground ratio |
| GAP-072 | Subtitle repeats the print name | **proposed, needs your confirmation**: klant alone when the project equals the print name; share page shows the date |
| GAP-073 | "Kosten ontbreken" twice | **resolved**: PaymentPanel line is official; the cost card says "Onvolledig" and names the missing input |
| GAP-074 | Order block nests three cards | **resolved**: one order card, sections with hairlines; 360, 768 and 1280px drawn |
| GAP-075 | Verwijderen too prominent | **resolved** (your decision): OverflowMenu "⋯" on the print detail and the klant tile; ConfirmDialog stays |
| GAP-076 | Missing cost has no link to the setting | **resolved**: `pp-missing` line "Geen vermogen voor {printer}." with link; "Vermogen ontbreekt" badge in Printers |
| GAP-077 | Share page shows the internal label | **resolved** (your decision): label dropped, header studio, klant, expiry; dialog says it is internal |
| GAP-078 | Share page gives no payment instructions | **resolved** (your decision): "Betalen" block with IBAN, t.n.v., bedrag, kenmerk and contact, copy buttons |
| GAP-079 | No thumbnails on the share page | **resolved** (your decision): 48px neutral `surface-2` thumbnail per line, no tint |
| GAP-080 | Openstaand is one long list, age invisible | **resolved** (your decision): collapsed groups, age badge in three steps (30 and 90 days), max 10 lines then "Toon alle"; thresholds to be measured |
| GAP-081 | Deel-links cannot be filtered, duplicates | **resolved**: Actief / Inactief / Alle, numbered duplicate suffix, create warning; "shown once" line once per page (deviation) |
| GAP-082 | No payment status on invoices | **resolved**: Status column with Betaald / Open / Deels betaald / Afgeschreven, creditnota "—"; preview **rejected** (browser viewer) |
| GAP-083 | Settings saves without unsaved warning | **resolved** (your decision): per section, "Niet opgeslagen" marker, Opslaan only when dirty, leave confirmation |
| GAP-084 | Card around Scalar | **resolved**: no card; the renderer meets the page padding; rule point 5 for third-party renderers |
| GAP-085 | No video player or thumbnail | **resolved with a new component**: VideoPlayer (dialog, poster, states, mkv fallback), poster as thumbnail with play badge |
| GAP-086 | Only one model viewable | **resolved with a new component**: ModelPicker (strip up to 6, Select above, caption "Model n van m") |
| GAP-087 | Loss of connection announced twice | **resolved**: bar is the state, loss toast dropped, "Weer verbonden." toast kept |

## Decisions you made (asked in this round)
GAP-077 label is internal; GAP-078 payment block with IBAN, t.n.v., bedrag, kenmerk and contact; GAP-079 neutral thumbnail ground; GAP-063 sticky sidebar; GAP-080 collapsed groups and age steps; GAP-067 one scrollable chip row; GAP-075 overflow menu; GAP-083 per-section save with a changed state.

## Defaults I chose; please confirm or change
- **GAP-072** (shown as proposed): klant alone when the project equals the print name. It changes what the card's second line means.
- **GAP-070**: whole tile as the control; **GAP-073**: PaymentPanel's sentence is official; **GAP-087**: bar kept, loss toast dropped; **GAP-065**: icon shows the current state; **GAP-069**: sticky at every width.
- **GAP-066**: five sort options, six status options (the ones you listed), both server-side.
- **GAP-081**: "shown once" is one line on the page, not on every row (deviation). **GAP-082**: no in-app invoice preview.
- **GAP-064**: cap of 560px; **GAP-086**: strip up to 6 models, Select above that.

## What I need you to measure
- **GAP-080:** days-open distribution of the open lines (thresholds 30 and 90).
- **GAP-071:** the rendered model colour and the ground colour of a black and a dark-purple thumbnail after the change (aim 3:1).
- **GAP-086:** how many models a print holds (largest and median).
- **GAP-085:** how many prints are video-only, and how many videos are `.mkv`.
- **GAP-064:** the y-position of the price field at 1360x900 and 390x844.

## Long screens drawn at real size
Openstaand with 90 lines and 10 klanten (desktop and 360px, collapsed and one group open); the dashboard strip with 20 klanten at 1280 and 360px, plus the overview dialog with 20 tiles; the print detail at 360px with and without a model; the order block at 360, 768 and 1280px. Checked for horizontal overflow; the only flags are the known preview artefacts.

## New and changed
- **Tokens:** none added, renamed or removed. New allowed inline data property: `--mix` (thumbnail tint floor).
- **New components:** ModelPicker, VideoPlayer, OverflowMenu.
- **New classes:** `pp-sharepay`, `pp-sharepay-row`, `pp-share-lead`, `pp-share-thumb`, `pp-models`, `pp-modelbtn`, `pp-model-cap`, `pp-video`, `pp-play`, `pp-menu`, `pp-missing`, `pp-strip`, `pp-allcust`, `pp-ogrp` (with `-bar`, `-more`, `-list`), `pp-sl-tools`, `pp-sec-hd`, `pp-sec-ft`, `pp-theme`, `pp-warnico`, `pp-scrollframe`, helpers `pp-w-160`, `pp-w-720`, `pp-w-768`, `pp-w-1280`, modifiers `is-empty` (viewer), `poster` and `sm` (thumb), `is-overflow` (chips), `sel` (filter selects), `dup`.
- **Changed classes:** `.pp-viewer.fluid` (560px cap), `.pp-order` family (flattened cards, sections), `.pp-cust` and `.pp-cust-name` (whole tile), `.pp-bulk` (sticky at every width), `.pp-opt` (`vertical-align: top`), `.pp-app>.pp-side` (sticky), `.pp-thumb.tinted` (`--mix` floor, inset ring), `.pp-dialog h2` (`min-width: 0`).
- **Components changed:** ScreenSharePage, ScreenShareLinks, ShareLinkRow, Viewer3D, OrderSection, CostBreakdown, PaymentPanel, AssetListItem, ScreenPrintDetail, CustomerCard, CustomerChips, FilterBar, BulkActionBar, PrintRow, PrintCard, ScreenDashboard, AppShell, Checkbox, ScreenApiDocs, Toast, ScreenSystemStates, LiveIndicator, OutstandingGroup, ScreenOutstanding, ScreenInvoices, ScreenSettings.
- **Contrast report:** seven new pairs, 143 in all, 0 fail.
- **Copy deck:** "Added in 1.9" (about 90 keys); one removed (the loss toast).

## Breaking changes
- **Visual only, no renamed or removed names:** the viewer on the print detail shrinks from unbounded to 560px; cards inside an order are flattened by CSS; the dashboard no longer shows the klant card strip on the page (the tiles moved into the overview dialog) and the klant tile has no delete icon; a klant tile and a print have a changed second line (GAP-072, if confirmed); Openstaand groups are `<details>` and their group actions moved from the header into the body.
- **App changes needed:** the share-page header and PDF title drop the label; the loss-of-connection toast is removed.

---

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
