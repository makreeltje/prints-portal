OutstandingGroup lists everything one klant still owes, with age and actions.

**Anatomy.** Card with a header (`surface-2`): klant name (600), "N prints · oudste 12 dagen open", the open total (`MoneyDisplay`, the sum of remaining amounts), and the buttons Herinnering (PDF) and Alles als betaald. Lines: print name and project, days-open badge (`unpaid` after 14 days, neutral before), the line amount and per-line actions Markeer als betaald and Afschrijven. **Partial line:** the badge Deels betaald, the remaining amount as the line total (600) with "van € 11,89" in `muted` and "Nog € 6,89 open" below it; Afschrijven then covers only the remainder. Prints of customers that are niet factureren never appear here. At 480px and below the actions wrap under each line.

**Tokens.** `surface`, `surface-2`, `border`, `unpaid`, `unpaid-tint`, `radius-lg`.

**States.** Default, partial line, line busy (spinner), group fully paid (collapses with a toast), error (inline alert). Alles als betaald and Afschrijven always open a ConfirmDialog that names the klant and the amount.

**Accessibility.** Header is an `<h3>`; lines are a list; days-open and remaining are text with an icon, not colour alone.

**Dutch copy.** Joey · 4 prints · oudste 16 dagen open | € 40,67 | Herinnering (PDF) | Alles als betaald | 12 dagen open | Deels betaald | van € 11,89 | Nog € 6,89 open | Markeer als betaald | Afschrijven.

**1.5.** Lines are orders: a Nabestelling line is named "{print} (nabestelling {n})" and Bestelling 1 shows the print name. Days open count from the invoice date, else the date the Verkoopprijs was set, else the order date. "Markeer als betaald" opens the amount dialog (see ScreenOutstanding). For the role User the group is read-only: no buttons.

**1.9.** (2026-10-07) **Collapsible group (GAP-080).** OutstandingGroup is now `<details class="pp-card pp-group pp-ogrp">`. Closed summary: `.ttl` (klant name `h3` and "{n} prints"), `.age` (badge of the oldest line), `.amt` (open amount, `text-lg`), `.chev`; min height 48px, hover `primary-tint-soft`, focus-visible ring inside the summary, open: `surface-2` ground and a bottom hairline. Open body: `.pp-ogrp-bar` (Herinnering (PDF), Alles als betaald, right aligned), `.pp-ogrp-list` (the lines, at most 10), `.pp-ogrp-more` with "Toon alle {n} regels". Lines keep their layout; the days badge uses the three age steps (neutral up to 30 days, warning 31 to 90, unpaid over 90; text "{n} dagen open"). The line's second row shows the klant alone when the project equals the print name (GAP-072, proposed). Role User: no bar. **Accessibility:** native disclosure (Enter and Space), the summary's name is "Joey, 18 prints, oudste 741 dagen, € 640,12"; status is text plus icon. **Tokens.** `surface`, `surface-2`, `primary-tint-soft`, `border`, badge tokens, `focus-ring`, `motion-base`.

**2.11.** (2026-10-17) **Copy keys for the summary, and the phone line (GAP-148, GAP-151).** The
`.age` slot's badge is `outstanding.oldestDays` — "oudste {n} dagen", "oudste 1 dag", "alles van
vandaag" at zero — and no longer shares a key with ScreenOutstanding's StatTile label. The line's
own badge is `status.daysOpen`, which now reads "1 dag open" and "sinds vandaag open" where it used
to render "1 dagen open" and "0 dagen open". **At 480px and below a line is three bands:** the name
block over the full width, then the days-open badge left and the amount right, then the actions —
`.pp-line>:first-child` spans both columns and the badge and `.pp-right` take the second row. This
is the same two-column, two-row shape the summary has had since 1.9, so a group and its lines now
fold the same way. The measurement behind it is on ScreenQueue (a 192px badge leaving a 90px name
at 360px); this component's badge is shorter and was never broken, only cramped. Above 480px
nothing changes, and `bundle.css` carries a `.pp-device.phone` twin so a preview frame shows the
phone form at all.

**Where a print's bron and notitie are *not*.** A group line shows neither (2.11, GAP-152): this
component is about money owed, and a model's source page and the owner's note about the work are
not part of that. They appear on ScreenQueue's rows, which use the same `.pp-line` form — so the
difference between the two screens' rows is now one of content, not of layout.
