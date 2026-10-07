# Importing the design system

`design-system/` is the single visual source of truth for the app and is read-only for Claude Code. The only file in it Claude Code may edit is `DESIGN_GAPS.md`. `README.md` is the design system's own guide (principles, colour, type, components). This file covers how the folder is maintained.

## Contents (v1.0 export)

```
design-system/
├── VERSION              ← current version (1.0)
├── README.md            ← design-system guide (from the export)
├── tokens.css           ← all tokens; dark default, [data-theme="light"], prefers-color-scheme fallback,
│                          reduced-motion overrides
├── tokens.json          ← same tokens as JSON
├── components/          ← one folder per component: README.md (spec, ARIA, copy) + preview.html;
│   └── bundle.css         components/bundle.css holds all `pp-` component classes.
│                          components/Cover is the project's cover art, not an app component.
├── copy-deck.md         ← Dutch copy (key → text), component copy only for now
├── contrast.md          ← contrast ratios per text/background pair
├── do-dont.md           ← do / don't list for new screens
├── design-system.json   ← export manifest (metadata, not used by the app)
├── DESIGN_GAPS.md       ← gap log (Claude Code writes here)
├── FEEDBACK_PROMPT.md   ← prompt for taking gaps back to Claude's Design System
└── IMPORTING.md         ← this file
```

Since v1.1 the screens and documents are delivered as component folders, not a `screens/` folder: `components/Screen*` (pages), `components/AppShell` and `components/Doc*` (invoice, reminder and overview PDFs). These are the screen layouts referred to in `CLAUDE.md`. The export's own changelog is `changelog.md`.

## Using it in the app

- Import `design-system/tokens.css` and `design-system/components/bundle.css` **directly from this folder** (e.g. through the bundler). Don't copy them into the frontend source: copies would drift and fail the checker.
- Re-implement components in React one to one, keeping the `pp-` class names and the ARIA roles from each component's README (as the design-system README says).

## How to import or update

1. Export or download the design system from Claude's Design System.
2. Replace everything in `design-system/` **except** `DESIGN_GAPS.md`, `FEEDBACK_PROMPT.md` and `IMPORTING.md`.
3. Bump `VERSION` and add a changelog entry below, listing which `GAP-###` entries it resolves.
4. Commit it on its own, e.g. `design-system: import v1.1 (resolves GAP-001)`.
5. Tell Claude Code: *"Design system v1.1 is imported. Follow 'After a new export arrives' in CLAUDE.md."*

## Changelog

- **1.0**: initial export: tokens, 42 components plus `bundle.css`, copy deck (component copy), contrast report, do/don't. Open gaps: GAP-001, GAP-002, GAP-003.
- **1.1**: 17 screen and document specs (`components/Screen*`, `components/Doc*`), new components AppShell, CostOverrideDialog and WriteOffDialog, ten changed components, about 150 new copy keys, no token changes (details in `changelog.md`). Resolves GAP-001, GAP-004, GAP-005, GAP-006, GAP-007, GAP-008, GAP-009, GAP-010, GAP-011 and GAP-012.
- **1.2**: responsive AppShell rules, `leading-*` tokens and a `body` rule, classes `pp-auth`, `pp-state`, `pp-iwrap.compact`, `pp-dialog.sm`, `pp-drawer`, `pp-sr`; updated login, users, access, share-link and share-page screens; breaking AppShell markup and removed copy keys `share.noShareLink`, `share.notBilled`, `access.adminAlways`, `auth.email` (details in `changelog.md`). Resolves GAP-013, GAP-014, GAP-015, GAP-016, GAP-017, GAP-018, GAP-019, GAP-020, GAP-021 and GAP-022.
- **1.2.1**: patch release: wrapper classes `pp-only-wide` and `pp-only-phone` for swapping a table for phone cards, and `pp-center` padding `space-4` at 480px and below; Gebruikers, Toegang and Login updated; no token changes (details in `changelog.md`). Resolves GAP-023.
- **1.3**: 10 `tag-*` palette tokens (tag colours become palette keys via `data-c`); new components CustomerCard, CustomerChips and TagEditor; new screen ScreenTags and a Tags nav item for Admin and Editor; classes for dimmed deleted/archived thumbnails, row flash and muted row text, phone customer chips, toolbars, the tag popover and palette; Viewer3D fullscreen; inline values removed from the dashboard, print detail and asset list previews (details in `changelog.md`). Resolves GAP-024, GAP-025, GAP-026, GAP-027 and GAP-028.
- **1.4**: tokens `space-9`, stacking family `z-*` and opacity family `opacity-*`; `.pp-anchor` for floating popovers (`.pp-pop` now `position:relative`, `z-popover`); new components OrderSection, NabestellingDialog and BulkDialogs; ScreenSettings gets Stroomtarief, Materiaalprijzen and Printers; summed PrintCard/PrintRow; selected CustomerCard and deleted customer chip; Dutch palette names; classes and helpers that replace the inline values in the M6/M7 previews; breaking: tooltip layer 40, popover markup, OrderSection on the print detail (details in `changelog.md`). Resolves GAP-029, GAP-030, GAP-031, GAP-032, GAP-033, GAP-034, GAP-035 and GAP-036.
- **1.5**: no token changes; calendar classes `pp-cal`, `pp-cal-hd`, `pp-cal-ft`, `pp-calpop` and the new DatePicker component; `pp-logo` (logo in the AppShell), `pp-text-lg/xl/2xl/3xl`, `pp-gap-6`, `pp-viewer-sm`, `pp-cust-name`; Openstaand per-line payment dialog, "Factuur" on phones, whole-print spool placement, invoice footer rules; full READMEs again; inline values removed from the M8 previews; `pp-btn-focus` renamed `pp-focus` (details in `changelog.md`). Resolves GAP-037, GAP-038, GAP-039, GAP-040, GAP-041, GAP-042, GAP-043, GAP-044, GAP-045 and GAP-046.
- **1.6**: no token changes (129 contrast pairs, 0 fail) and no new components; new classes `--pp-share-act`, `pp-lockhelp`, `pp-qty-text`, `pp-api-head`, `pp-api-row`, `pp-method`, `pp-minh-180/420/560`, `pp-w-980`, `pp-w-520`, `pp-left-t`, `pp-tree`, `pp-indent-1`…`4`, `.pp-alert.banner`, `.pp-state.is-inline` and `.pp-iwrap>.pp-btn.r`; share page and Overzicht drop their totals when nothing is priced; ShareLinkRow gets a fixed action column; the five v1.5 placeholders are confirmed as built and specified; "Spoel voor de hele print" skips locked orders; inline values removed from the ScreenSystemStates and ScreenApiDocs previews, which gain loading and error states (details in `changelog.md`). Resolves GAP-047, GAP-048, GAP-049, GAP-050, GAP-051, GAP-052 and GAP-053.
- **1.7**: no token changes (129 contrast pairs, 0 fail) and no new components; Scalar is the official API-docs renderer and Swagger UI is dropped, with the complete variable mapping shipped as `.pp-scalar` in `bundle.css`; `contrast.md` gains a Ground column and a table of the translucent tokens over `bg`, `surface` and `surface-2`; `.pp-lockhelp` wraps and goes to a column at 480px; `.pp-tree` is `nowrap`; the ScreenAccess empty state is confirmed as built; new preview-only classes `.pp-sc*`; breaking: `.pp-api-head`, `.pp-api-row` and `.pp-method` are removed (details in `changelog.md`). Resolves GAP-054, GAP-056, GAP-057, GAP-058 and GAP-059.
- **1.8**: no token changes (129 contrast pairs, 0 fail), no new components; `contrast.md` gains a table *Translucent token inside a translucent row* and a rule, and the four state badges plus `.pp-hint` now paint their tint over an opaque `surface` base, so a badge measures the same on a hovered, selected or `surface-2` row; ScreenApiDocs gains a four-point rule for screens drawn by a third-party renderer, which confirms the GAP-060 placeholder as the official behaviour (details in `changelog.md`). Resolves GAP-060 and GAP-061.
- **1.9**: no token changes (143 contrast pairs, 0 fail); the big "real size" round. New components ModelPicker, VideoPlayer and OverflowMenu; the share page drops the internal label and gains a "Betalen" block and per-line thumbnails; the viewer caps at 560px with a 72px "no model" strip; the order block becomes one card with sections; the dashboard gains sort and status filters and a scrollable klant chip row with an "Overzicht" dialog; Openstaand collapses per klant with a three-step age badge; Deel-links gains Actief/Inactief/Alle; Facturen gains a Status column; the theme icon shows the current state; the bulk bar sticks at every width; the loss-of-connection toast is dropped in favour of the bar; no card around Scalar (details in `changelog.md`). Confirms GAP-062 and GAP-063 as built; resolves GAP-064 to GAP-070 and GAP-073 to GAP-087; GAP-071 and GAP-072 are proposals awaiting our measurement and confirmation.
