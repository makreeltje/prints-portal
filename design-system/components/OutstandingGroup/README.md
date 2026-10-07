OutstandingGroup lists everything one klant still owes, with age and actions.

**Anatomy.** Card with a header (`surface-2`): klant name (600), "N prints · oudste 12 dagen open", the open total (`MoneyDisplay`, the sum of remaining amounts), and the buttons Herinnering (PDF) and Alles als betaald. Lines: print name and project, days-open badge (`unpaid` after 14 days, neutral before), the line amount and per-line actions Markeer als betaald and Afschrijven. **Partial line:** the badge Deels betaald, the remaining amount as the line total (600) with "van € 11,89" in `muted` and "Nog € 6,89 open" below it; Afschrijven then covers only the remainder. Prints of customers that are niet factureren never appear here. At 480px and below the actions wrap under each line.

**Tokens.** `surface`, `surface-2`, `border`, `unpaid`, `unpaid-tint`, `radius-lg`.

**States.** Default, partial line, line busy (spinner), group fully paid (collapses with a toast), error (inline alert). Alles als betaald and Afschrijven always open a ConfirmDialog that names the klant and the amount.

**Accessibility.** Header is an `<h3>`; lines are a list; days-open and remaining are text with an icon, not colour alone.

**Dutch copy.** Joey · 4 prints · oudste 16 dagen open | € 40,67 | Herinnering (PDF) | Alles als betaald | 12 dagen open | Deels betaald | van € 11,89 | Nog € 6,89 open | Markeer als betaald | Afschrijven.

**1.5.** Lines are orders: a Nabestelling line is named "{print} (nabestelling {n})" and Bestelling 1 shows the print name. Days open count from the invoice date, else the date the Verkoopprijs was set, else the order date. "Markeer als betaald" opens the amount dialog (see ScreenOutstanding). For the role User the group is read-only: no buttons.

**1.9.** (2026-10-07) **Collapsible group (GAP-080).** OutstandingGroup is now `<details class="pp-card pp-group pp-ogrp">`. Closed summary: `.ttl` (klant name `h3` and "{n} prints"), `.age` (badge of the oldest line), `.amt` (open amount, `text-lg`), `.chev`; min height 48px, hover `primary-tint-soft`, focus-visible ring inside the summary, open: `surface-2` ground and a bottom hairline. Open body: `.pp-ogrp-bar` (Herinnering (PDF), Alles als betaald, right aligned), `.pp-ogrp-list` (the lines, at most 10), `.pp-ogrp-more` with "Toon alle {n} regels". Lines keep their layout; the days badge uses the three age steps (neutral up to 30 days, warning 31 to 90, unpaid over 90; text "{n} dagen open"). The line's second row shows the klant alone when the project equals the print name (GAP-072, proposed). Role User: no bar. **Accessibility:** native disclosure (Enter and Space), the summary's name is "Joey, 18 prints, oudste 741 dagen, € 640,12"; status is text plus icon. **Tokens.** `surface`, `surface-2`, `primary-tint-soft`, `border`, badge tokens, `focus-ring`, `motion-base`.
