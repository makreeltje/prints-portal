Design system for **3D Prints Portal**, a self-hosted web app that indexes print files, prices them, tracks payment and shares read-only pages with customers. The operator UI is a calm, precise workshop tool; the customer share page and the PDF invoice are the same brand, lighter and more spacious. All UI copy is Dutch (nl-NL). This is version 2.3 (see `changelog.md`).

## Principles

1. **Status first.** Show Betaald/Open, Gearchiveerd and missing-data badges before anything else on a card or row.
2. **Numbers are content.** Set every figure with tabular numerals (`font-variant-numeric: tabular-nums`), right-align money, always show units.
3. **Dense but breathable.** Compact tables on a 4px grid, generous gaps between sections (`space-6` to `space-8`).
4. **The filament colour is the only decoration.** Keep chrome neutral (`bg`, `surface`, `surface-2`, `border`); let spool swatches, tinted thumbnails and the 3D preview carry colour.
5. **Customer-facing is friendlier.** On the share page and invoice use `text-md`, larger `space-*` steps and `radius-xl`; never show internal cost.
6. **Accessible by default.** Meet WCAG 2.2 AA (see `contrast.md`), never use colour alone for status, keep touch targets at 44px or more on phones.

## Colour

- Default theme is `dark`; `light` is the second theme. Apply with `[data-theme]` on `html`, and fall back to `prefers-color-scheme` when no theme is stored. The consuming app must provide this fallback block; the generated `tokens.css` only has the `[data-theme]` blocks.
- Put pages on `bg`, cards, tables, dialogs and inputs on `surface`, nested or hover grounds on `surface-2`. Body text is `text`, headings and money are `text-strong`, secondary text is `muted`.
- Draw card edges and row dividers with `border`. Draw anything that identifies a control (input, checkbox, radio, toggle) with `border-strong`.
- Use `primary` for the single main action per view, links and active navigation; text on a primary fill is `on-primary`. Use `primary-tint-soft` for row hover, `primary-tint` for selection and live-update flashes, `primary-tint-strong` for pressed states.
- Status colours: `paid` (Betaald, check icon), `unpaid` (Open and Afgeschreven, clock or ban icon, also destructive actions), `warning` (missing spool, price or cost, triangle icon), `info` (notices, "voorgesteld"). Badge ground is the matching `*-tint`; badge text is the status colour. Pair `paid` and `unpaid` with an icon and a word every time; they differ in lightness, not only hue.
- Focus: draw `2px solid var(--focus-ring)` with a 2px offset on every interactive element. Dialogs and sheets sit on `overlay`. Skeletons use `skeleton`.
- Tags and spools carry user-chosen colours. Choose tag text between `#141a33` and `#ffffff` by relative luminance (pick the one with the higher contrast). Never recolour a spool swatch to fit the theme.
- Charts: use `viz-1` to `viz-5` in order for categories; they avoid the paid/unpaid/warning hues, so do not put `viz-4` beside `unpaid` in one chart. Use `viz-seq-1` to `viz-seq-5` for magnitude; label the two lowest steps in text.

## Typography

- Use the system sans stack (`--font-sans`) for all UI and `--font-mono` for file names (middle-truncate them), G-code names, hashes, paths and tokens. No web fonts are loaded.
- Body is `body` (15px/22px, tokens `text-base` and `leading-base`, set once by the `body` rule in `bundle.css`); every font size has a matching line-height token (`leading-xs` 16, `leading-sm` 20, `leading-base` 22, `leading-md` 24, `leading-lg` 26, `leading-xl` 28, `leading-2xl` 32, `leading-3xl` 40); dense table cells use `body-sm`; badges and meta use `caption`. Page titles use `heading-2xl`, section titles `heading-xl`, card and dialog titles `heading-lg`, stat-tile figures `heading-3xl`.
- Set inputs at 16px (`body-md`) on phones to prevent browser zoom. Keep text lines under about 80 characters on wide screens.
- The `text-xs` … `text-3xl` tokens are the raw sizes behind these styles.

## Spacing, radius, elevation, motion

- Use `space-1` … `space-8` (4, 8, 12, 16, 20, 24, 32, 40px). Card padding is `space-4`, table cell padding `space-2`/`space-3`, gap between sections `space-7`.
- `radius-sm` badges and chips, `radius-md` buttons and inputs, `radius-lg` cards, tables and popovers, `radius-xl` dialogs and share-page panels, `radius-pill` segmented controls and avatars.
- Prefer borders over shadows. Use `shadow-sm` for hover, `shadow-md` for popovers and the spool picker, `shadow-lg` for dialogs and the sticky mobile bulk bar.
- Transition with `motion-fast` (hover, focus, toggle) and `motion-base` (popovers, dialogs, toasts, row flash) using `motion-ease`. Under `prefers-reduced-motion: reduce` set every duration to 0ms and replace the live-update flash by a static `primary-tint` background.

## Responsive

Breakpoints: up to 480px phone, 481–900px tablet, 901px and up desktop, 1440px and up wide. On phones tables become stacked cards, the bulk bar sticks to the bottom, dialogs become full-height sheets and the 3D viewer sits above the fold at a fixed aspect ratio. The app shell switches with media queries (see AppShell): sidebar above 900px, a 56px icon rail from 481 to 900px, top bar, bottom bar and drawer at 480px and below; the app never sets a `.phone` class. Never scroll the page horizontally; scroll wide tables inside their own container with a visible edge shadow.

## Floating panels (2.2)

Everything that floats beside a trigger — Popover, SpoolPicker, TagEditor, OverflowMenu, DatePicker, Tooltip — obeys one rule: **it is never drawn outside the window, and it never makes the page scroll to reveal it.** Measured in the app: a spool picker (320x302) on a file row low in a long print detail opened at y=831 in a 900px window, so 233px of it was below the fold, and a tooltip on a card in the last column ran 116px past the right edge. Both were the same hole in this page — no rule at all — not two bugs.

1. **The app chooses the side, per axis, before the first paint**, from the trigger's rect and the panel's own height: down by default, `.up` when the room below is less than the panel's height and the room above is more; left-aligned by default, `.end` when a left-aligned panel would pass the right edge less `space-4`. A panel that reopens after a scroll is measured again.
2. **The app passes the room it has**, less `space-4`: `--pp-pop-max` for a popover, `--pp-tip-x`/`--pp-tip-y` for a tooltip's rect. These are inline data properties, like `--c1`: the app passes numbers it measured, never lengths it chose. Every length — offset, radius, maximum width, the sheet's height — stays in `bundle.css`.
3. **The panel caps itself and scrolls its own region.** A list inside the panel keeps its 240px as the height it *prefers* and shrinks below it only when the panel is capped, so a panel with room looks exactly as it did and the search field above the list stays in view.
4. **Under 240px of room on the better side, the panel becomes a bottom sheet** at any width (`.pp-anchor.sheet`), the form phones already get. 240px is the height of the list caps: below it a panel cannot show its list, and a sliver of scroller is worse than moving.
5. **A tooltip whose trigger sits inside anything that clips or scrolls** (`.pp-print` is `overflow:hidden`, a table lives in `.pp-scroll`) uses the window-placed form `.pp-tip.at`. Stacking tokens do not help there: a sticky cell paints over `z-popover` inside a scroll box (GAP-098), and `overflow:hidden` cuts off whatever `z-index` says.
6. **Every floating thing has that window-placed form (2.3).** 2.2 gave it to the tooltip only, so a popover inside a clipping card was still cut off: `.pp-pop.at` is the same rule with the same words (`--pp-pop-x`, `--pp-pop-y`, `--pp-pop-max`). A panel in `.at` form is re-measured while the page scrolls and closed when its trigger leaves the window, because a fixed box does not follow the page.
7. **A window-placed panel resets the edges it does not use, and never sits inside a `.pp-anchor` (2.3).** An anchor is an offset parent; a window-placed panel has no offset parent. The one that leaked cost a real bug: `bottom` survived from the anchored rule into `.pp-tip.at`, and a fixed box with both edges set is sized between them — the bubble collapsed to 8px. If a trigger needs the anchor's *other* quiet effect, sitting above a stretched card or row link, use **`.pp-lift`**.
8. **Nothing above a trigger carries a `transform`, `filter` or `backdrop-filter` (2.3).** Each of them makes that element the containing block of a fixed box, which re-clips the panel the `.at` form exists to free. (`.pp-art`'s filter is on the picture itself, which never has a panel inside it.)

A tooltip appears **at once** on hover and on focus — no delay. Details and the name-or-description rule: Tooltip's README.

## Three rules this round wrote down (2.3)

**A control states what is in force, not what is unset.** Where a value can be inherited — the slot spool that falls back to the print's, and anything like it later — the trigger shows the inherited value and names where it came from with a `pp-hintchip` ("van de print"), in normal ink. It never shows its empty placeholder while a value is costing something. The placeholder is for the one case where nothing is in force. Measured: a print's total moved from EUR 7,05 to EUR 5,13 on a spool whose own control said "Kies een spoel" throughout. The chip belongs on the control that can override the value, not beside it. Details: SpoolPicker.

**A card that something important follows is capped; the last card on a page is as long as its content.** The print detail's file list is 585px of a 1892px page and up to 48 rows, and the answer is its position, not a disclosure, a fold or an inner scroller — all three are rejected under GAP-117. A long list costs nothing when nothing is behind it. One consequence: a page has **one** order of blocks at every width, not a desktop order and a phone order.

**We never rewrite a picture we did not make.** 79 of 83 thumbnails are images the slicer embedded and we pass through. Where a picture needs separating from its ground, the page draws the separation — `.pp-art` outlines the silhouette from the picture's own alpha channel in `border-strong`, which is a token and therefore right in both themes. Nothing visual is baked into an asset, because a baked value cannot read a theme and cannot be changed without re-encoding the library.

## Components

Components are plain HTML plus `components/bundle.css` (classes prefixed `pp-`); there is no JavaScript bundle. Load `tokens.css`, then `bundle.css`, and write the markup shown in each component's `preview.html`. Re-implement them in React one to one by keeping the class names and the ARIA roles from each component's README. Wrap a page in `.pp-stage` only for previews; the app supplies its own page background. Controls are 36px high on desktop and 44px at 480px and below (`--pp-control-h`).

## Roles

Admin sees everything, including Deel-links, Toegang, Gebruikers, Instellingen, Verwijderde prints with Herstellen, and the undo actions. Editor sees every klant (no grants needed, so Editor rows in Toegang are disabled and checked), Dashboard, Openstaand, Facturen, print detail with costs and payment, and can export and "Definitief maken", but cannot credit, delete users or change settings. User only sees the klanten an Admin granted. User sees customer price and status only: no internal cost, breakdown, notes or file controls, and no Facturen page. Never render a control a role cannot use.

## Screens and documents

The Screens group in Components shows every page at desktop (980px frame) and phone (360px) width; switch the theme in the page to see both. The AppShell page also shows the tablet icon rail (481–900px); wide (1440px and up) adds columns, as stated under Responsive. Each screen's README lists its layout, states, roles and Dutch copy. The three Doc pages show the A4 documents (20mm margins, light only, printable in black and white).

## Iconography

Use Lucide line icons (`lucide-react`), 1.75px stroke, in sizes 16 (inline with text), 20 (buttons, nav) and 24 (empty states, headers). Colour icons with `currentColor`; status icons take the status colour.

| Meaning | Icon |
|---|---|
| G-code | `file-code` |
| 3MF | `package` |
| STL | `box` |
| Video | `file-video` |
| Fusion 360 | `pen-tool` |
| PDF | `file-text` |
| URL | `link` |
| Other file | `file` |
| Betaald | `circle-check` |
| Open | `clock` |
| Afgeschreven | `ban` |
| Gearchiveerd | `archive` |
| Verwijderd | `trash-2` |
| Missing data | `triangle-alert` |

No logo has been supplied. Show the studio name in `heading-lg` type in the app shell, on the share page and on the invoice, with an optional uploaded logo image that replaces it when set in Instellingen.

## Content fundamentals

- Write Dutch, informal "je" on the share page, neutral and short in the operator UI. Use the exact vocabulary: Klant, Project, Print, Bestand, Openstaand, Betaald/Open, Markeer als betaald, Alles als betaald, Afschrijven, Verkoopprijs, Voorstel uit marge, Kosten/Totaalkosten, Materiaal, Stroom, Spoel, Factuur, Concept, Definitief maken, Creditnota, Herinnering, Overzicht, Deel-link, Intrekken, Verloopt, Toegang, Gebruikers, Instellingen, Opnieuw indexeren, Verwijderen, Herstellen, Gearchiveerd, Deels betaald, Niet factureren, Toon verwijderde, Aantal keer geprint, Plaat, Slot, Mogelijk dubbel, Op factuur, Reden, Telt niet mee in kosten, Tags.
- Format with nl-NL: money `€ 1.234,56`, dates `5 okt 2026` (with "12 dagen open" where useful), durations `1 u 20 min`, units `87 g`, `0,42 kWh`.
- Name the object in destructive confirmations: "Print 'Babybox locks' verwijderen?" and say that deleting hides the print but keeps its financials.
- Show where a cost value came from (Spoolman, handmatig, geschat). A print without a price shows "Prijs volgt" on the share page.
- There is no VAT anywhere: no BTW toggle, rate or number, and no KvK, on screens or documents. Company details on documents are name, address, IBAN and optional e-mail and phone, plus an optional uploaded logo (PNG or SVG) that replaces the studio name.
- Documents: an unnumbered **Concept** invoice; a final **Factuur** numbered `YYYY-NNN` (yearly reset) created with "Definitief maken"; a **Creditnota** (negative, "Betreft factuur {nummer}", same number sequence); a **Herinnering** (unpaid lines only, no number); and the share-page **Overzicht** (no number, customer price only). Invoice table columns are Print · Project · Datum · Gram · Bedrag · Status; status is Betaald, Open or Deels betaald, and prints without a customer price are left out.
- Payment rules: a partial payment keeps the print open for the remainder ("Nog € 6,89 open"); Afschrijven covers only the remainder and takes an optional reason; only Admins can undo a payment or a write-off, both with confirmation.
- A klant flagged **Niet factureren** shows cost only: no sale price, payment, Openstaand or invoice. Such a klant may get a Deel-link; its share page lists the prints only (Print, Project, Datum), without amounts, payment status or PDF buttons.
- Search fields show a small `/` key hint on desktop; the `/` key focuses search.

## Sample values for previews

Customers Joey, Denise, Wouter (and Rick, niet factureren); project "Babybox locks"; PLA, 87 g, 1 u 20 min; material € 2,18, electricity € 0,12, total € 2,30; suggested price € 11,89 from a 400% markup; printer Creality K1 Max at about 350 W. These price, markup and wattage figures are illustrative layout data, not business rules.
- Deel-links: Verloopt offers Over 7, 30 or 90 dagen and **Nooit**; a link without expiry shows "Verloopt niet" in `muted`.
- Sign-in: local sign-in with e-mail address or name plus password (at least 12 characters), or Authentik (OIDC) when configured; members of the Authentik admin group become Admin. A temporary password must be replaced at the first sign-in. A session ends after 60 minutes without activity or 12 hours after signing in; login is limited to 5 attempts per minute. The last Admin can never be removed or demoted.
- A credited print (whole invoice or chosen lines) becomes Afgeschreven.
- Contract for the app: only tokens and the classes in `components/bundle.css`. Inline `style` attributes in the previews are demo layout only and are not part of the contract; sizes the app needs exist as tokens or classes (`pp-auth`, `pp-state`, `pp-iwrap compact`, `pp-dialog sm`, `pp-drawer`, `leading-*`).
- Table or cards: put both layouts in the DOM and wrap them in `pp-only-wide` (above 480px) and `pp-only-phone` (480px and below); wrappers carry no display of their own. Gebruikers and Toegang use this.

## Roles, tags and deleting (1.3)

- **Admin** and **Editor** delete prints (a project folder is one print) and whole klanten, and manage tags on the page "Tags". Only **Admin** sees and restores deleted prints and klanten ("Toon verwijderde"). **User** sees name, price, status, thumbnail, 3D model and tags read-only: no files, downloads, costs or notes, and no Tags page.
- The print colour sits behind the thumbnail through `.pp-thumb.tinted` and `--c1`.
- Tags are case-insensitively unique, at most 64 characters, with an optional colour from ten tokens (`tag-rose` to `tag-grey`). Chip text is `#141a33` or `#ffffff`.
- Screens contain no raw layout values: use tokens and `bundle.css` classes. The only things that may be inline are **data properties the app measured or read**, and preview scaffolding (`min-height` on `.pp-device`). The whole list, current at 2.3: `--c1` and `--c2` (spool colours), `--tag` and `--tag-ink` (tag colours), `--pp-pop-max` (the room a popover has), `--pp-tip-x` and `--pp-tip-y` (a tooltip trigger's rect), `--pp-pop-x` and `--pp-pop-y` (a popover trigger's rect, 2.3). **`--mix` left the contract in 2.0** when the filament colour stopped being the thumbnail's ground; if you still find it set anywhere, it does nothing.

## Orders, settings and stacking (1.4)

- A print (project folder) has one or more orders. Order 1 always exists; a Nabestelling is added by Admin or Editor. An order owns its items (each file or plate with its own "Aantal keer geprint"), Verkoopprijs, payments, write-off and, from M7, its invoice line. Files that are in no order wait until a Nabestelling is made. A print shows the summed price and the least settled status.
- A payment is at most the open remainder of its order; Admins can undo the most recent payment, and undone payments stay in the history.
- Instellingen (Admin) has the sections Algemeen, Prijzen (Standaardmarge, Stroomtarief, Materiaalprijzen), Printers, Bedrijfsgegevens, Klanten and Spoolman.
- Stacking: popovers use `.pp-anchor` and `z-popover` (30); sticky bars 10, tooltips 40, drawers, sheets and dialogs 50. Apps never choose a z-index.
- Fixed-size helpers (`pp-w-*`, `pp-minh-*`, `pp-gap-*`, `pp-text-*`, `pp-fw-*`) replace inline values; the previews no longer need `style` attributes except for data properties.



## Versie 1.5 (2026-10-07)
Date picker (`.pp-cal`), per-line payment in Openstaand, invoice footer rules, logo in the shell, one invoice line per order. Details: `changelog.md`.

## Versie 1.6 (2026-10-07)
Share page and PDF without prices, aligned share-link columns, calendar button, locked-order help line, M9 previews without inline values. Details: `changelog.md`.

## Versie 1.7 (2026-10-07)
Scalar is the API-docs renderer (`.pp-scalar` mapping), the contrast report names the ground of every pair, wrapping lock help, scrolling folder diagram, empty Toegang. Details: `changelog.md`.

## Versie 1.8 (2026-10-07)
Badges sit on an opaque `surface` base, the contrast report covers translucent tokens inside tinted rows, and a rule for third-party renderers (focusable scroll regions). Details: `changelog.md`.

## Versie 1.9 (2026-10-07)
A round driven by the real app (83 prints, 10 klanten): the share page (studio header, payment block, thumbnails), a print detail that fits the screen (capped viewer, one order card with sections, "⋯" menu), a finite dashboard and Openstaand (klant strip as one row, collapsed groups with age steps), sort and status filter, and three new components: ModelPicker, VideoPlayer and OverflowMenu. No token added, renamed or removed. Details: `changelog.md`.

## Versie 2.0 and 2.1 (2026-10-08)
*Recorded here in 2.2: both rounds updated the component files and `bundle.css` but not this page, `changelog.md` or `copy-deck.md`. What follows is the summary those component files carry; read them for the reasoning.* **2.0:** the filament colour stops being the thumbnail's ground and becomes a 4px bar along its bottom edge, the render carries a baked `#6f7a96` outline and `--mix` leaves the contract (GAP-071); missing files become one worded chip (GAP-090); one target per tile (GAP-091, with 093 and 099); the file list moves to print level and an order lists only what it bills (GAP-097); the card subtitle rule becomes official (GAP-072). **2.1:** the missing-file chip becomes three slashed type icons on the card and the row, worded only on the print detail (GAP-106, overruling 2.0 at the owner's second asking); the selection box is 24px of ink in a 36/44px target (GAP-107); each slot of `.pp-foot` holds the thing it is about (GAP-108).

## Versie 2.2 (2026-10-08)
Where floating things go: popovers choose their side, cap their height and fall back to a sheet, and the tooltip finally has a placement and no delay (GAP-112, GAP-110, section *Floating panels*). The file row's name column keeps a 240px floor so a badge is never drawn over the controls (GAP-111). The missing-file icons ride behind the print name instead of making a tag row of their own (GAP-109) and say "Ontbreekt: G-code, 3MF en STL" in one line, with the full sentence kept as the accessible name (GAP-113). No token added, renamed or removed. Details: `changelog.md`.

## Versie 2.3 (2026-10-08)
The five gaps that were left. The thumbnail outline moves out of the renderer and into the page (`.pp-art`, GAP-071): it covered 2 prints of 83 where it was, and we do not rewrite the 79 pictures the slicer made. Floating panels get the two fixes 2.2 left: `.at` resets the edges it does not use and the popover gains the window-placed form the tooltip had (GAP-114), with `.pp-lift` for the job the anchor was doing quietly. A spool trigger shows the spool that is in force instead of "Kies een spoel" (GAP-115). The media strip keeps one sideways-scrolling line at every count and, with no per-model renders to show, puts the file name first (`.pp-models.compact`, GAP-116). The print detail has one order of blocks at every width, with the file list last (GAP-117). No token added, renamed or removed. Details: `changelog.md`.
