OutstandingGroup lists everything one klant still owes, with age and actions.

**Anatomy.** Card with a header (`surface-2`): klant name (600), "N prints · oudste 12 dagen open", the open total (`MoneyDisplay`, the sum of remaining amounts), and the buttons Herinnering (PDF) and Alles als betaald. Lines: print name and project, days-open badge (`unpaid` after 14 days, neutral before), the line amount and per-line actions Markeer als betaald and Afschrijven. **Partial line:** the badge Deels betaald, the remaining amount as the line total (600) with "van € 11,89" in `muted` and "Nog € 6,89 open" below it; Afschrijven then covers only the remainder. Prints of customers that are niet factureren never appear here. At 480px and below the actions wrap under each line.

**Tokens.** `surface`, `surface-2`, `border`, `unpaid`, `unpaid-tint`, `radius-lg`.

**States.** Default, partial line, line busy (spinner), group fully paid (collapses with a toast), error (inline alert). Alles als betaald and Afschrijven always open a ConfirmDialog that names the klant and the amount.

**Accessibility.** Header is an `<h3>`; lines are a list; days-open and remaining are text with an icon, not colour alone.

**Dutch copy.** Joey · 4 prints · oudste 16 dagen open | € 40,67 | Herinnering (PDF) | Alles als betaald | 12 dagen open | Deels betaald | van € 11,89 | Nog € 6,89 open | Markeer als betaald | Afschrijven.

**1.5.** Lines are orders: a Nabestelling line is named "{print} (nabestelling {n})" and Bestelling 1 shows the print name. Days open count from the invoice date, else the date the Verkoopprijs was set, else the order date. "Markeer als betaald" opens the amount dialog (see ScreenOutstanding). For the role User the group is read-only: no buttons.
