StatusBadge states payment, record, billing, asset or document status at a glance; it always carries an icon and a word.

**Anatomy.** Pill-ish tag (`radius-sm`), 16px icon, 12px label in 500. **Payment:** Betaald (`paid`, circle-check), Open (`unpaid`, clock), Deels betaald (`unpaid`, circle-dashed; the print stays open for the remainder), Afgeschreven (`unpaid`, ban). **Record:** Gearchiveerd (neutral, archive), Verwijderd (neutral, trash-2). **Completeness:** Geen spoel, Geen prijs, Kosten ontbreken (`warning`, triangle-alert). **Billing:** Niet factureren (neutral, receipt; replaces the payment badge for customers flagged niet factureren). **Asset:** Mogelijk dubbel (`warning`, copy). **Document:** Op factuur {nummer} (`info`, file-text, on locked prints), Concept (neutral, file-text), Definitief (`info`, lock), Creditnota (neutral, file-text). Show at most one payment or billing badge plus the completeness badges that apply. A partially paid print also shows `status.remaining` ("Nog € 6,89 open") as a separate `pp-remaining` line, never inside the badge.

**Tokens.** `paid`/`unpaid`/`warning`/`info` on their `*-tint` grounds, `surface-2`, `muted`, `border`.

**States.** Static. In dense tables the label may collapse to the icon at 480px and below, keeping `aria-label` and a tooltip.

**Accessibility.** Text and icon colour pass 4.5:1 on the tint (see contrast.md, including the neutral badge). Never rely on the colour; the word is always in the DOM. Deels betaald and Open share a colour on purpose; the dashed icon and the word tell them apart.

**Dutch copy.** Betaald, Open, Deels betaald, Afgeschreven, Gearchiveerd, Verwijderd, Geen spoel, Geen prijs, Kosten ontbreken, Niet factureren, Mogelijk dubbel, Op factuur {nummer}, Concept, Definitief, Creditnota, Nog {bedrag} open.
