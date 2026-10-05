DatePicker picks a single date or a range start and end; the field shows `5 okt 2026`.

**Anatomy.** A text input with a calendar icon button; the popover (`pp-pop`) holds a month header with previous/next buttons and a 7-column grid starting on Monday (Ma Di Wo Do Vr Za Zo). Selected day uses `primary` fill, today an outline in `primary`.

**Tokens.** `surface`, `border`, `primary`, `on-primary`, `primary-tint-soft` (hover), `shadow-md`, `radius-lg`.

**States.** Day: default, hover, focus, selected, today, disabled (out of range). Popover opens below, flips above when there is no room, and is a full-width sheet at 480px and below.

**Accessibility.** Arrow keys move by day and week, PageUp/PageDown by month, Enter selects, Esc closes and returns focus to the input. Typing a date in `d-m-jjjj` also works; the grid has `role="grid"`.

**Dutch copy.** Datum, Vanaf, Tot en met, Vorige maand, Volgende maand, Vandaag. Error: "Kies een datum binnen de periode."
