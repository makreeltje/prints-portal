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

`screens/` doesn't exist yet. See GAP-001.

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
