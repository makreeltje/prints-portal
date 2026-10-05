Popover shows a small interactive panel anchored to a trigger, such as the spool picker or tag editor.

**Anatomy.** Panel `pp-pop` (`surface`, `border`, `radius-lg`, `shadow-md`), 8px offset from the trigger, optional arrow-less. Max width 360px; at 480px and below it becomes a bottom sheet.

**Tokens.** `surface`, `border`, `shadow-md`, `radius-lg`.

**States.** Closed, open; opens on click/Enter, closes on Esc, outside click or selection.

**Accessibility.** Trigger has `aria-expanded` and `aria-haspopup`; focus moves into the panel on open and back to the trigger on close.

**Dutch copy.** "Kies een spoel", "Tags bewerken".
