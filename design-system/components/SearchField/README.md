SearchField filters lists as you type; on desktop the `/` key focuses it.

**Anatomy.** Magnifier icon on the left, input, optional clear button (appears when not empty), and a `/` key hint on the right when empty (hidden at 900px and below, and on touch).

**Tokens.** `surface`, `border-strong`, `muted`, `surface-2` (key hint), `focus-ring`.

**States.** Empty, focused, filled (clear button), loading (spinner replaces the magnifier), no results (the list shows its own empty state).

**Accessibility.** `role="search"` on the wrapper, `type="search"`, label via `aria-label="Zoeken"`. The `/` shortcut is ignored while typing in another field.

**Dutch copy.** Zoek op naam, klant of tag; "Wis zoekopdracht".
