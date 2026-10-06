CustomerChips replaces the customer cards on phones: one horizontally scrolling row of filter chips, followed by a toolbar for the selected klant.

**Anatomy.** `div.pp-chips[role=group][aria-label="Klanten"]` with `button.pp-chip[aria-pressed]` per klant (name plus `.n` print count); "Alle klanten" first. Exactly one chip is pressed. Below it `.pp-toolbar`: the print count and, for Admin and Editor and only while one klant is selected, the ghost button "Klant verwijderen". Chips are 44px high; the row scrolls without a visible scrollbar and the page itself never scrolls sideways.

**Tokens.** `surface`, `surface-2`, `primary-tint`, `border`, `primary`, `radius-pill`, `space-*`, `focus-ring`.

**States.** Default, pressed, hover, focus-visible, overflowing row.

**Accessibility.** Native buttons with `aria-pressed`; the group is labelled "Klanten"; focus ring is 2px `focus-ring`.

**Dutch copy.** Alle klanten | Klant verwijderen | {n, plural, one {# print} other {# prints}}
