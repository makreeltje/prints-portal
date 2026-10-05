Design system for **3D Prints Portal**, a self-hosted web app that indexes print files, prices them, tracks payment and shares read-only pages with customers. The operator UI is a calm, precise workshop tool; the customer share page and the PDF invoice are the same brand, lighter and more spacious. All UI copy is Dutch (nl-NL).

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
- Body is `body` (15px/22px); dense table cells use `body-sm`; badges and meta use `caption`. Page titles use `heading-2xl`, section titles `heading-xl`, card and dialog titles `heading-lg`, stat-tile figures `heading-3xl`.
- Set inputs at 16px (`body-md`) on phones to prevent browser zoom. Keep text lines under about 80 characters on wide screens.
- The `text-xs` … `text-3xl` tokens are the raw sizes behind these styles.

## Spacing, radius, elevation, motion

- Use `space-1` … `space-8` (4, 8, 12, 16, 20, 24, 32, 40px). Card padding is `space-4`, table cell padding `space-2`/`space-3`, gap between sections `space-7`.
- `radius-sm` badges and chips, `radius-md` buttons and inputs, `radius-lg` cards, tables and popovers, `radius-xl` dialogs and share-page panels, `radius-pill` segmented controls and avatars.
- Prefer borders over shadows. Use `shadow-sm` for hover, `shadow-md` for popovers and the spool picker, `shadow-lg` for dialogs and the sticky mobile bulk bar.
- Transition with `motion-fast` (hover, focus, toggle) and `motion-base` (popovers, dialogs, toasts, row flash) using `motion-ease`. Under `prefers-reduced-motion: reduce` set every duration to 0ms and replace the live-update flash by a static `primary-tint` background.

## Responsive

Breakpoints: up to 480px phone, 481–900px tablet, 901px and up desktop, 1440px and up wide. On phones tables become stacked cards, the bulk bar sticks to the bottom, dialogs become full-height sheets and the 3D viewer sits above the fold at a fixed aspect ratio. Never scroll the page horizontally; scroll wide tables inside their own container with a visible edge shadow.

## Components

Components are plain HTML plus `components/bundle.css` (classes prefixed `pp-`); there is no JavaScript bundle. Load `tokens.css`, then `bundle.css`, and write the markup shown in each component's `preview.html`. Re-implement them in React one to one by keeping the class names and the ARIA roles from each component's README. Wrap a page in `.pp-stage` only for previews; the app supplies its own page background. Controls are 36px high on desktop and 44px at 480px and below (`--pp-control-h`).

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

- Write Dutch, informal "je" on the share page, neutral and short in the operator UI. Use the exact vocabulary: Klant, Project, Print, Bestand, Openstaand, Betaald/Open, Markeer als betaald, Alles als betaald, Afschrijven, Verkoopprijs, Voorstel uit marge, Kosten/Totaalkosten, Materiaal, Stroom, Spoel, Factuur, Herinnering, BTW, Deel-link, Intrekken, Verloopt, Toegang, Gebruikers, Instellingen, Opnieuw indexeren, Verwijderen, Herstellen, Gearchiveerd, Telt niet mee in kosten, Tags.
- Format with nl-NL: money `€ 1.234,56`, dates `5 okt 2026` (with "12 dagen open" where useful), durations `1 u 20 min`, units `87 g`, `0,42 kWh`.
- Name the object in destructive confirmations: "Print 'Babybox locks' verwijderen?" and say that deleting hides the print but keeps its financials.
- Show where a cost value came from (Spoolman, handmatig, geschat). A print without a price shows "Prijs volgt" on the share page.
- Invoice numbers use the form `2026-007` (year, dash, three-digit sequence).
- Search fields show a small `/` key hint on desktop; the `/` key focuses search.

## Sample values for previews

Customers Joey, Denise, Wouter; project "Babybox locks"; PLA, 87 g, 1 u 20 min; material € 2,18, electricity € 0,12, total € 2,30; suggested price € 11,89 from a 400% markup; printer Creality K1 Max at about 350 W. These price, markup and wattage figures are illustrative layout data, not business rules.
