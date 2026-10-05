FormField wraps any control with a label, optional help text and an error message.

**Anatomy.** `.pp-field`: label (13.5px, 500), control, help text (12px, `muted`) and error text (12px, `unpaid`, with alert icon). Error replaces help text. Required fields show "(verplicht)" in the label, not an asterisk.

**Tokens.** `text-strong`, `muted`, `unpaid`, `space-1`.

**States.** Default, with help, with error, disabled (label stays `text-strong`).

**Accessibility.** `for`/`id` pair, `aria-describedby` for help and error, `aria-invalid` on the control, error announced with `role="alert"` after submit.

**Dutch copy.** Label (verplicht), "Wordt getoond op de factuur.", "Dit veld is verplicht."
