OutstandingGroup lists everything one klant still owes, with age and actions.

**Anatomy.** Card with a header (`surface-2`): klant name (600), "N prints · oudste 12 dagen open", total (`MoneyDisplay`), and the buttons Herinnering (PDF) and Alles als betaald. Lines: print name and project, days-open badge (`unpaid` after 14 days, neutral before), amount, and per-line actions Markeer als betaald and Afschrijven. At 480px and below the actions wrap under each line.

**Tokens.** `surface`, `surface-2`, `border`, `unpaid`, `unpaid-tint`, `radius-lg`.

**States.** Default, line busy (spinner), group fully paid (collapses with a toast), error (inline alert). Alles als betaald and Afschrijven always open a ConfirmDialog that names the klant and the amount.

**Accessibility.** Header is an `<h3>`; lines are a list; days-open is text with a clock icon, not colour alone.

**Dutch copy.** Joey · 4 prints · oudste 12 dagen open | € 47,56 | Herinnering (PDF) | Alles als betaald | 12 dagen open | Markeer als betaald | Afschrijven.
