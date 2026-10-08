OverflowMenu holds the actions that are rare or hard to undo, so they do not compete with the screen's main action (GAP-075, new in 1.9). It is a Popover (`pp-pop pp-menu`) with menu items, not a new surface.

**Anatomy.** Trigger: ghost icon button (`pp-btn-icon`, 48px tap area) with the `ellipsis` icon, `aria-label="Meer acties"`, `aria-haspopup="menu"`, `aria-expanded`. Panel: `.pp-anchor.end` + `.pp-pop.pp-menu`, items `role="menuitem"` (min height 48px, `text-sm`, icon at the left, `text-strong`), a divider `.sep` between groups, a destructive item in `unpaid` (`danger`) and always last. **Where:** print detail, top right of the header (holds *Verwijderen*; for an Admin on a deleted print *Herstellen* sits there too); klant tile, in the tile's `.end` group beside the print count (holds *Factuur maken* and *Klant verwijderen*). Choosing a destructive item opens the existing ConfirmDialog; nothing is deleted from the menu itself. **What takes the freed top-right spot on the print detail:** nothing; the "⋯" is small and the header is calmer, the status badge stays beside the tags. **Phone:** at 480px and below the panel is a bottom sheet (Popover rule), items keep 48px height. **Tile:** the menu button sits above the tile's stretched hit area (`z-index:1`), so pressing it never filters the dashboard.

**Tokens.** `surface`, `border`, `shadow-md`, `radius-lg`/`radius-md`, `text-strong`, `unpaid`, `primary-tint-soft`, `muted`, `focus-ring`, `z-popover`.

**States.** Closed, open, item hover, item focus-visible, item disabled (`aria-disabled="true"`, `muted`, with the reason in `title`/help text when it matters), destructive item.

**Accessibility.** Focus moves to the first item on open and back to the trigger on close; Up/Down move between items, Home/End jump, Esc closes, Tab closes and moves on; the menu has `aria-label="Meer acties"`; a destructive item is named by its text, never by colour alone; screens that depend on an action never put it only in this menu.

**Dutch copy.** Meer acties | Verwijderen | Herstellen | Factuur maken | Klant verwijderen | Print {naam} verwijderen? | Klant {naam} verwijderen?

**Contrast.** `unpaid` on `surface` and on `primary-tint-soft` (hover) are in `contrast.md` (rows "OverflowMenu").

**Where the panel goes (2.2, GAP-112).** The menu is a Popover and takes Popover's placement rule in full: side chosen per axis, `--pp-pop-max` capping the height, the sheet form under 240px of room. A capped `.pp-menu` scrolls itself (it is its own panel, with no inner region), and its items keep their `--pp-tap` height while scrolling. A menu is usually short enough that only the side matters; the column menu in Toegang is the one that is not.
