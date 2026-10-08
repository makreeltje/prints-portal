Design system for **3D Prints Portal**, a self-hosted web app that indexes print files, prices them, tracks payment and shares read-only pages with customers. The operator UI is a calm, precise workshop tool; the customer share page and the PDF invoice are the same brand, lighter and more spacious. All UI copy is Dutch (nl-NL). This is version 2.0 (see `changelog.md`).

## Principles

1. **Status first.** Show Betaald/Open, Gearchiveerd and missing-data badges before anything else on a card or row.
2. **Numbers are content.** Set every figure with tabular numerals (`font-variant-numeric: tabular-nums`), right-align money, always show units.
3. **Dense but breathable.** Compact tables on a 4px grid, generous gaps between sections (`space-6` to `space-8`).
4. **The filament colour is the only decoration, and it belongs to the object.** Keep chrome neutral (`bg`, `surface`, `surface-2`, `border`); let the spool swatch, the 4px filament bar under a card thumbnail and the model in the 3D preview carry colour. A user-chosen colour is never a ground behind content (2.0, GAP-071).
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
- **A user-chosen colour marks an object, never a ground.** A thumbnail, a plate and a model-strip button sit on `surface-2` in both themes; the filament colour is the model in the render, the 4px bar under a card thumbnail and the swatch. The render separates itself from its ground with a 1px `#6f7a96` outline baked into the PNG (3.53:1 or more on both `surface-2` grounds). There is no blend factor and no `--mix`: an arbitrary colour and a fixed ground have no guaranteed contrast in either direction.
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

Show the studio name in `heading-lg` type in the app shell, on the share page and on the invoice, with an optional uploaded logo image that replaces it when set in Instellingen.

**What an uploaded logo must satisfy** (2.0, GAP-104 and GAP-105). One file is shown in both themes with no adaptation, in an `<img>` and in a PDF, and the container that rasterises it ships no fonts.

1. **Both grounds, one file:** every ink reaches 3:1 against both `#ffffff` and `#1a1b26` (the two `surface` values; a logo is a non-text graphic, WCAG 2.2 1.4.11). Mid-tones only. `#5878d6` measures 4.14 and 4.13 and is a good example; the system's own `primary` cannot do it (2.52 / 2.79 on the opposite ground) and must never be used as a logo ink.
2. **No text in an SVG:** `<text>`, `<tspan>` and `textPath` are refused at upload — there are no fonts, so they render as nothing at all. Outline lettering to paths, or upload a PNG.
3. **Self-contained:** no external reference, no `@import`, no `currentColor`, no CSS-dependent fill.
4. **Legible at 32px** (`--space-7` in the sidebar and drawer, `--space-6` in the phone top bar) and **no tagline or second line**; a ratio between about 1:1 and 4:1.
5. **Readable without colour:** documents print in black and white.
6. Instellingen shows the stored file on both grounds at once (`pp-logo-pair`), because no validator can measure point 1 for an arbitrary file.

## Targets

One rule, from 2.0 (GAP-091, with GAP-093 and GAP-099 merged into it):

- A tile or row that leads somewhere has **exactly one** target, and it covers the whole tile or row: one real link stretched with a `::after` (`pp-rowlink` in a table, `pp-cust-name` on a klant tile, the card link on a print tile). The grid and the list behave the same.
- Every other control sits above that link (`position: relative; z-index: 1`) with its own hit area and its own name. Selection is the checkbox's job only; a tile shows `is-selected` after it is ticked, never before, and a click never does both jobs.
- **Text that leads nowhere is never styled like a target.** In a table, `text-strong` at weight 500 in the identifying cell means "this opens something"; a cell that opens nothing is `text` with `cursor: default` and no hover.

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
- Screens contain no raw layout values: use tokens and `bundle.css` classes. Only the data properties `--c1`, `--mix`, `--tag`, `--tag-ink` and preview scaffolding (`min-height` on `.pp-device`) remain inline.

## Orders, settings and stacking (1.4)

- A print (project folder) has one or more orders. Order 1 always exists; a Nabestelling is added by Admin or Editor. An order owns its items (each file or plate with its own "Aantal keer geprint"), Verkoopprijs, payments, write-off and, from M7, its invoice line. Files that are in no order wait until a Nabestelling is made. A print shows the summed price and the least settled status.
- A payment is at most the open remainder of its order; Admins can undo the most recent payment, and undone payments stay in the history.
- Instellingen (Admin) has the sections Algemeen, Prijzen (Standaardmarge, Stroomtarief, Materiaalprijzen), Printers, Bedrijfsgegevens, Klanten and Spoolman.
- Stacking: popovers use `.pp-anchor` and `z-popover` (30); sticky bars 10, tooltips 40, drawers, sheets and dialogs 50. Apps never choose a z-index. **Inside a table with sticky cells a popover's own z-index is not enough** — a z-index is only compared inside its own stacking context, so the cell that holds the open popover carries `has-pop` while it is open (2.0, GAP-098).
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

## Versie 2.0 (2026-10-08)
The first breaking round. The print detail is reorganised around what belongs to a print and what an order bills (one media row with the viewer and a strip that now holds the timelapse, one file list at print level, orders that show only what they charge for); the filament colour stops being a thumbnail's ground and becomes a 4px bar on the object, so `--mix` leaves the contract; a print says which files it lacks; one rule covers every "this looks clickable" gap; a popover inside a sticky table raises its cell; Instellingen and Tags lay out in columns up to a 1080px measure; the API renderer bleeds through the page padding; and an uploaded logo has a contract it can be checked against. No token added, renamed or removed. Details: `changelog.md`.
