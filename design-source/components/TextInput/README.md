TextInput is a single-line text field for names, labels and e-mail addresses.

**Anatomy.** `.pp-input` on an `<input>`, always inside a FormField with a visible label. Height 36px (44px at 480px and below), 16px text on phones.

**Tokens.** `surface`, `border-strong`, `text-strong`, `muted` (placeholder), `focus-ring`, `unpaid`, `surface-2` (disabled), `radius-md`.

**States.** Default, hover (border to `muted`), focus (2px `focus-ring`), error (`aria-invalid="true"`, red border plus error text with icon), disabled.

**Accessibility.** Label via `<label for>`; help and error text linked with `aria-describedby`; errors never rely on colour alone.

**Dutch copy.** Naam, E-mailadres, Wachtwoord, Label. Error: "Vul een geldig e-mailadres in."
