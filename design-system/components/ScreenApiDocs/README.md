API-docs (`/api-docs`) is the page frame around the rendered OpenAPI document of the app.

**Anatomy.** Standard page header "API-docs" and one card (`pp-card pp-flush`) that holds the renderer with the full remaining height. **Renderer (1.7, decision GAP-056): Scalar** (`@scalar/api-reference-react`, version 0.9.78) with `theme: "none"`, so Scalar applies no theme of its own; every colour, font, radius and shadow comes from our tokens through Scalar's own CSS variables, set once on the container by the class `.pp-scalar` (see "Variable mapping" below). Swagger UI is no longer part of the system. The document is generated from the route schemas: 73 endpoints, each with a Dutch summary and one of six tags: Prints, Kosten, Facturen, Deel-links, Toegang, Systeem. Scalar's AI assistant and its Configure, Share and Deploy tools are switched off and the page contacts no host outside the instance. The document declares no security scheme, so there is no credential field: the browser sends the session cookie by itself, and the page description says so ("Er is geen inlogveld: de documentatie gebruikt je sessie."). "Test request" works with that cookie. The theme follows the app theme (`data-theme`). **Loading:** the card holds Skeleton lines (`aria-busy="true"`, visually hidden "Laden…") after 200 ms. **Error:** `.pp-state.is-inline` in the card: "API-docs konden niet worden geladen", "De documentatie kon niet worden opgehaald. Probeer het opnieuw." and the primary button "Opnieuw proberen". **Phone (480px and below):** the Scalar sidebar stacks above the content (`.pp-sc` becomes one column), the card fills the width. **Tablet (601 to 900px):** one column as on phones, the sidebar as a block above the operation.

**Tokens.** All of them through `.pp-scalar`: `text-strong`, `text`, `muted`, `primary`, `primary-hover`, `on-primary`, `primary-tint`, `primary-tint-soft`, `paid`, `info`, `warning`, `unpaid`, `warning-tint`, `unpaid-tint`, `surface`, `surface-2`, `bg`, `border`, `border-strong`, `focus-ring`, the radius, text, leading and shadow scales, `font-sans`, `font-mono`, `space-3`, `space-5`.

**States.** Loading, default, error, offline (the offline bar above the content). The preview shows the themed renderer as an illustration built from the same variables (`.pp-sc*` classes); the real Scalar markup differs, the variables are the contract.

**Accessibility.** One `<h1>`; Scalar's own landmarks and keyboard handling are kept; method colour is never the only cue (the method is written out and outlined); every mapped text pair is approved in the contrast report over the grounds it is used on (`color-1/2/3` on `background-1/2/3`, `accent` and `link` on all three, `sidebar-color-active` on `primary-tint` over `surface`). Focus uses `focus-ring`. Scalar sets no text smaller than 12px (see below).

**Dutch copy.** API-docs | Zoeken | Test request | Er is geen inlogveld: de documentatie gebruikt je sessie. | Laden… | API-docs konden niet worden geladen | De documentatie kon niet worden opgehaald. Probeer het opnieuw. | Opnieuw proberen. Tags: Prints, Kosten, Facturen, Deel-links, Toegang, Systeem.

**Variable mapping (GAP-056, complete for Scalar 0.9.78: 102 declared variables plus the three `button-1` ones; the dump is regenerated after a Scalar upgrade).**

| Group | Scalar variable | Our token |
|---|---|---|
| color | `--scalar-color-1` / `-2` / `-3` | `text-strong` / `text` / `muted` |
| color | `--scalar-color-accent`, `-purple` | `primary` |
| color | `--scalar-color-blue` | `info` (GET) |
| color | `--scalar-color-green` | `paid` (POST) |
| color | `--scalar-color-orange`, `-yellow`, `-alert` | `warning` (PUT) |
| color | `--scalar-color-red`, `-danger` | `unpaid` (DELETE) |
| color | `--scalar-color-query` | `muted` |
| background | `--scalar-background-1` / `-2` / `-3` | `surface` / `surface-2` / `bg` |
| background | `--scalar-background-accent` | `primary-tint-soft` (was `primary-tint`: see 1.7 below) |
| background | `--scalar-background-alert` / `-danger` | `warning-tint` / `unpaid-tint` (were solid fills; check the callouts in the app) |
| sidebar | `-background-1`, `-border-color`, `-color-1`, `-color-2`, `-color-active` | `surface`, `border`, `text-strong`, `muted`, `primary` |
| sidebar | `-item-active-background` | `primary-tint` (approved over `surface` for `primary` text) |
| sidebar | `-item-hover-background`, `-item-hover-color` | `primary-tint-soft`, `text-strong` |
| sidebar | `-indent`, `-padding` | `space-5` (20px), `space-3` (12px) |
| sidebar | `-indent-border`, `-active`, `-hover` | `border`, `primary`, `border-strong` |
| sidebar | `-search-background`, `-border-color`, `-color` | `surface-2`, `border`, `muted` |
| border | `--scalar-border-color`, `--scalar-border-width` | `border`, `1px` (our hairline; Scalar's .5px is not used) |
| radius | `--scalar-radius`, `-md` / `-lg` / `-xl` / `-2xl` / `-3xl` / `-full` / `-max` | `radius-md`, `radius-md` / `radius-lg` / `radius-xl` / `radius-xl` / `radius-xl` / `radius-pill` / `radius-xl` |
| font | `--scalar-font`, `--scalar-font-code` | `font-sans`, `font-mono` |
| font size | `--scalar-font-size-1` to `-7` | `text-xl`, `text-md`, `text-sm`, `text-sm`, `text-xs`, `text-xs`, `text-xs` (Scalar's 10px becomes 12px) |
| line height | `--scalar-line-height-1` to `-5` | `leading-2xl`, `leading-md`, `leading-sm`, `leading-sm`, `leading-xs` |
| headings | `--scalar-heading-1` to `-6`, `--scalar-paragraph`, `--scalar-page-description` | `text-2xl`, `text-xl`, `text-md` (4 times), `text-md`, `text-md` |
| text sizes | `--scalar-small`, `-mini`, `-micro` | `text-sm`, `text-sm`, `text-xs` |
| shadow | `--scalar-shadow-1` / `-2` | `shadow-sm` / `shadow-lg` |
| button | `--scalar-button-1`, `-color`, `-hover` | `primary`, `on-primary`, `primary-hover` (not in the dump's "still on their own" list, but literal black or white in Scalar: now mapped) |
| link | `--scalar-link-color`, `-hover`, `--scalar-text-decoration` | `primary`, `primary-hover`, `underline` (as `.pp-link`) |
| other | `--scalar-focus-color` | `focus-ring` |
| other | `--scalar-scrollbar-color`, `-active` | `border`, `border-strong` |
| other | `--scalar-address-bar-bg`, `--scalar-tooltip-background`, `--scalar-tooltip-color` | `surface`, `text-strong`, `bg` (as `pp-tip`) |
| keep Scalar's value (structural, not visual identity) | `--scalar-header-height`, `--scalar-address-bar-height`, `--scalar-backdrop-brightness`, `--scalar-lifted-brightness`, `--scalar-loaded-api-reference`, `--scalar-refs-heading-spacing`, `--scalar-text-decoration-color(-hover)`, `--scalar-text-decoration-hover`, `--scalar-tooltip-padding-x/y`, weights (`--scalar-font-normal/medium/bold`, `--scalar-regular/semibold/bold`) | unchanged |

The class `.pp-scalar` (also on `.light-mode` and `.dark-mode` descendants, so Scalar's own mode classes cannot override it) carries all of these; the app may copy it as is instead of the `ds-gap: GAP-056` block, and the marker comes out. A literal colour, font or radius from Scalar that survives anywhere is a bug.

**1.7.** (2026-10-07) **Decision GAP-056.** Scalar is the official renderer; Swagger UI is dropped. `.pp-api-head`, `.pp-api-row` and `.pp-method`, added in 1.6 for the Swagger layout and used by nothing, are removed from `bundle.css` (a breaking change, listed in the changelog). `--scalar-background-accent` moved from `primary-tint` to `primary-tint-soft` because `primary` text on `primary-tint` fails AA over `surface-2` in the light theme (4.34, GAP-059); the soft tint is approved over all three grounds.

**1.8.** (2026-10-07) **Scrollable renderer regions (GAP-060, confirmed as built; the placeholder is now the rule).** Scalar's markup is not ours, so "Scalar's own landmarks and keyboard handling are kept" holds on desktop but not at 480px and below, where its endpoint list (`ul.endpoints`) scrolls sideways (measured at 360px: 338px of content in a 276px box) while holding no focusable element, which is axe `scrollable-region-focusable` (serious). The app therefore makes **every region the renderer leaves scrollable but not focusable** reachable, exactly as `.pp-scroll` does for our own wide tables: `tabindex="0"` and an accessible name `aria-label` from the existing key `api.title` ("API-docs"), applied after render (an effect on the page, because the markup is Scalar's), and removed again when a wider window stops the region from scrolling, so nothing is left behind at 1280px. **`role="region"` only on a generic element** (a `div`): on a list it replaces the implicit `list` role and orphans its `li` (axe reports that as its own serious violation); a list keeps its role and only becomes focusable and labelled. Verified at 360px: the list takes focus and scrolls by keyboard with its semantics intact; nothing changes on desktop. No new colour, size or copy key. The name "API-docs" repeats the page heading; a more specific name ("Lijst met endpoints") would read better to a screen reader and would be one new key (`api.endpoints`), optional.

**Rule for third-party renderers (new in 1.8).** When a screen's content is drawn by a third-party renderer: (1) its colours, fonts, radii and shadows come from our tokens through the renderer's variables, set by one class in `bundle.css` (`.pp-scalar`); (2) the spec does not promise accessibility that the renderer owns, it lists what the app must verify (axe at 360px and 1280px, both themes); (3) any region the renderer leaves scrollable and unfocusable is made a focusable, labelled region by the app, with `role="region"` on generic elements only; (4) the page frame (header, card, loading, error) stays ours.

**1.9.** (2026-10-07) **Frame (GAP-084, resolved).** The card goes: Scalar draws its own sidebar and panels, so wrapping it in a bordered `pp-card pp-flush` only put a box inside a box. The page is now the title row (h1 "API-docs") on the page padding, and the renderer fills the content area directly under it, meeting the page padding on its sides (`.pp-scalar` keeps the token mapping and has no border or radius of its own). Rule for third-party renderers, **point 5 (new)**: the renderer is not wrapped in a card; the page supplies the heading, the padding and the loading and error states; if a renderer has no frame of its own, the page may give it a `border` and `radius-lg`, never both. Loading and error states stay cards. The preview shows the page without the card.

**2.0.** (2026-10-08) **Still a box in a box (GAP-102, resolved).** 1.9 took the card away, but Scalar draws its own sidebar, its own panels and its own borders, and it was still sitting inside the page's `space-6` padding — so a framed thing floated in a padded page, which reads as a box in a box even without our card.

**A renderer that brings its own frame gets the whole content area.** The page keeps its heading on the page padding; the renderer wrapper gets **`.pp-bleed`**, which cancels that padding on the left, the right and the bottom (`margin: 0 calc(-1 * var(--pp-pad)) calc(-1 * var(--pp-pad))`). `.pp-main` and `.pp-phone-main` now declare their padding as **`--pp-pad`** (`space-6` on desktop, `space-4` at 480px and below) and read it back, so the bleed is always exactly the page's own padding and nothing has to be kept in step by hand. Scalar's sidebar hairline becomes the only vertical rule on the page, its content gets its own padding, and the page has one frame instead of two.

Loading and error states keep their card: they are ours, they are short, and a full-bleed skeleton reads as a broken page.

**Rule for third-party renderers, point 6 (new).** A renderer that draws its own frame (sidebar, panels, borders) is given the full content area and bleeds through the page padding with `.pp-bleed`; only the page heading keeps the padding. A renderer with no frame of its own keeps the padding and may have a `border` or a `radius-lg`, never both (point 5, 1.9).

**Changed classes.** `.pp-main` and `.pp-phone-main` (padding through `--pp-pad`, same computed value), new `.pp-bleed`.
