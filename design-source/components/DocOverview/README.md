The overview PDF ("Overzicht") is what a customer downloads from the share page: their prints, customer price and status, never internal cost.

**Anatomy.** Same A4 layout, light only, no number. Title "Overzicht", **no sub-line** (2.0, GAP-088), the meta grid has Klant, Datum and "Geldig tot" (the expiry of the link). Table columns Print · Project · Datum · Gram · Bedrag · Status; prints without a customer price show "Prijs volgt" and "—" and are excluded from the totals. With "Alleen openstaand" only unpaid and partially paid lines appear and the totals follow. Totals: Totaal, Betaald, Openstaand. Footer: the sentence "Dit is een overzicht, geen factuur.", payment instructions and the page number. Costs, margins, notes and file names never appear.

**Tokens.** Light theme tokens only.

**States.** Full overview, only open, multi-page.

**Accessibility.** Tagged PDF with a real table.

**Dutch copy.** Overzicht | Geldig tot | Prijs volgt | Dit is een overzicht, geen factuur.

**1.5.** One line per order, Datum is the order date, Helvetica (Western European characters only). The payment reference on an Overzicht is the klant name.

**1.6.** (2026-10-07) **No expiry (GAP-049), confirmed as built.** For a link without expiry (Nooit) the meta grid leaves out the "Geldig tot" row (Klant and Datum remain), as the share page leaves out its notice. **No prices yet (GAP-053).** When no line has a price the totals block is left out and the table keeps "Prijs volgt" and "—" on every line. The footer then holds only "Dit is een overzicht, geen factuur." and the page number: payment instructions (amount, IBAN, name, reference) appear only while something is open, and the reference is the klant name. One line per order; archived prints stay, written-off orders and deleted prints never appear; the header shows the logo, else the company name, else "3D Prints Portal". Helvetica only (Western European characters).

**2.0.** (2026-10-08) **The link label is gone from here too (GAP-088, resolved).** 1.9 (GAP-077) decided the Deel-link label is internal and dropped it from the share page, its PDF title and the tab title, but this file still specified it as the document's sub-line. It is removed: the head is the title "Overzicht" and nothing under it, because Klant and Datum are already in the meta grid and the label is for the operator only. The label must not appear on any document, page or file name a customer can see.
