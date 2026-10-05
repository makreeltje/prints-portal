StatusBadge states payment, record or completeness status at a glance; it always carries an icon and a word.

**Anatomy.** Pill-ish tag (`radius-sm`), 16px icon, 12px label in 500. Payment: Betaald (`paid`, circle-check), Open (`unpaid`, clock), Afgeschreven (`unpaid`, ban). Record: Gearchiveerd (neutral, archive), Verwijderd (neutral, trash-2). Completeness: Geen spoel, Geen prijs, Kosten ontbreken (`warning`, triangle-alert). Show at most one payment badge plus the completeness badges that apply.

**Tokens.** `paid`/`unpaid`/`warning` on their `*-tint` grounds, `surface-2`, `muted`, `border`.

**States.** Static. In dense tables the label may collapse to the icon at 480px and below, keeping `aria-label` and a tooltip.

**Accessibility.** Text and icon colour pass 4.5:1 on the tint (see contrast.md). Never rely on the colour; the word is always in the DOM.

**Dutch copy.** Betaald, Open, Afgeschreven, Gearchiveerd, Verwijderd, Geen spoel, Geen prijs, Kosten ontbreken.
