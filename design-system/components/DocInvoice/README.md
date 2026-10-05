The invoice PDF is the A4 document for a klant: a final numbered Factuur (YYYY-NNN), an unnumbered Concept and a negative Creditnota. It has no VAT.

**Anatomy.** A4, 20mm margins, light only, black text on white, printable in black and white: status is always a word, rules are solid black or grey, there are no fills. Header: the document title (Factuur, Creditnota) with the number line on the left; right-aligned company details (name, address, IBAN in the footer, optional e-mail and phone) or the uploaded logo (PNG/SVG) in place of the name. Meta grid: Klant, Factuurdatum, Periode, Factuurnummer. Table columns **Print · Project · Datum · Gram · Bedrag · Status**; Status is Betaald, Open or Deels betaald (written-off lines never appear; a credit note corrects a final invoice). Prints without a customer price are left out. A full invoice includes paid prints; totals show **Totaal, Betaald, Openstaand** (right-aligned, tabular figures). Footer: payment instructions with IBAN and reference, and "Pagina {n} van {m}"; the table header repeats on each page. **Concept:** the title reads Factuur with the sub-line "Concept", a boxed band "CONCEPT — nog niet definitief", no number and the reference "je naam". **Creditnota:** negative amounts (`€ -11,89`), the sub-line with its own number from the same sequence, "Betreft factuur {nummer}", Status shown as "—", total only, and the footer "Deze creditnota corrigeert factuur {nummer}."

**Tokens.** Light theme tokens only (`#141a33` text, white paper), `font-sans`; no colour fills.

**States.** Final, concept, credit note; single page and multi-page (header repeats, totals only on the last page).

**Accessibility.** Tagged PDF with a real table; the document title is the file title; no colour-only cues.

**Dutch copy.** Factuur | Concept | CONCEPT — nog niet definitief | Creditnota | Factuurnummer | Factuurdatum | Periode | Klant | Betreft factuur {nummer} | Print | Project | Datum | Gram | Bedrag | Status | Totaal | Betaald | Openstaand | Graag € {bedrag} overmaken naar IBAN {iban} t.n.v. {naam}, onder vermelding van {referentie}. | Pagina {n} van {m}
