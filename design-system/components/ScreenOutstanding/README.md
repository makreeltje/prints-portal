Openstaand (`/openstaand`) lists everything still owed, grouped per klant, with actions to collect, write off or remind.

**Anatomy.** Three StatTiles (Totaal openstaand, Aantal klanten, Oudste openstaande print), then one OutstandingGroup per klant ordered by oldest open item. Totals are sums of remaining amounts, so partially paid prints count only their remainder; written-off prints and klanten that are niet factureren never appear. Per line: Markeer als betaald (asks the amount, default the remainder) and Afschrijven (WriteOffDialog). Per group: Herinnering (PDF) and Alles als betaald (ConfirmDialog naming klant, number of prints and amount). **Lines:** each line is one order of a print; a Nabestelling is named "{print} (nabestelling {n})", as on the invoice PDF, and Bestelling 1 shows the print name. **Days open** count from the invoice date, else from the date the Verkoopprijs was set, else from the order date. **Role User:** the page is read-only for the klanten the user was granted: no buttons, no Herinnering, no Alles als betaald; the stat tiles and lines stay. **Phone:** the tiles become two columns with the first spanning, lines stack their actions underneath. **Empty:** "Niets openstaand" with a check icon and the sentence "Alle prints zijn betaald."

**Tokens.** StatTile, OutstandingGroup, ConfirmDialog tokens.

**States.** Loading (Skeleton), default, group busy, empty ("Niets openstaand"), error.

**Accessibility.** Groups are headings with lists; amounts and days are text; every destructive action confirms.

**Dutch copy.** Openstaand | Totaal openstaand | Aantal klanten | Oudste openstaande print | Herinnering (PDF) | Alles als betaald | Markeer als betaald | Afschrijven | Niets openstaand | Alle prints zijn betaald. | Alles als betaald markeren voor Joey (3 prints)?

**Inline values (1.4).** The preview no longer uses `style` attributes for layout: widths, gaps, alignment and weights come from `pp-w-*`, `pp-gap-*`, `pp-between`, `pp-end`, `pp-nowrap`, `pp-setrow`, `pp-kv tight`, `pp-bg-2`, `pp-sheetframe` and the other helpers listed in `changelog.md`. Spool and print colours remain the data properties `--c1` and `--c2`.
