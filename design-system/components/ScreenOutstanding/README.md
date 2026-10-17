Openstaand (`/openstaand`) lists everything still owed, grouped per klant, with actions to collect, write off or remind.

**Anatomy.** Three StatTiles (Totaal openstaand, Aantal klanten, Oudste openstaande print), then one OutstandingGroup per klant ordered by oldest open item. Totals are sums of remaining amounts, so partially paid prints count only their remainder; written-off prints and klanten that are niet factureren never appear. Per line: Markeer als betaald (asks the amount, default the remainder) and Afschrijven (WriteOffDialog). Per group: Herinnering (PDF) and Alles als betaald (ConfirmDialog naming klant, number of prints and amount). **Lines:** each line is one order of a print; a Nabestelling is named "{print} (nabestelling {n})", as on the invoice PDF, and Bestelling 1 shows the print name. **Days open** count from the invoice date, else from the date the Verkoopprijs was set, else from the order date. **Role User:** the page is read-only for the klanten the user was granted: no buttons, no Herinnering, no Alles als betaald; the stat tiles and lines stay. **Phone:** the tiles become two columns with the first spanning, lines stack their actions underneath. **Empty:** "Niets openstaand" with a check icon and the sentence "Alle prints zijn betaald."

**Tokens.** StatTile, OutstandingGroup, ConfirmDialog tokens.

**States.** Loading (Skeleton), default, group busy, empty ("Niets openstaand"), error.

**Accessibility.** Groups are headings with lists; amounts and days are text; every destructive action confirms.

**Dutch copy.** Openstaand | Totaal openstaand | Aantal klanten | Oudste openstaande print | Herinnering (PDF) | Alles als betaald | Markeer als betaald | Afschrijven | Niets openstaand | Alle prints zijn betaald. | Alles als betaald markeren voor Joey (3 prints)?

**Inline values (1.4).** The preview no longer uses `style` attributes for layout: widths, gaps, alignment and weights come from `pp-w-*`, `pp-gap-*`, `pp-between`, `pp-end`, `pp-nowrap`, `pp-setrow`, `pp-kv tight`, `pp-bg-2`, `pp-sheetframe` and the other helpers listed in `changelog.md`. Spool and print colours remain the data properties `--c1` and `--c2`.

**1.9.** (2026-10-07) **A finite page with age (GAP-080, resolved; your decisions: groups collapsed, age buckets).** **Groups** are collapsed by default: each klant is a `<details>` (OutstandingGroup) whose closed summary shows klant name, print count, the **oldest** line as a badge ("oudste 741 dagen"), the open amount and a chevron. Order: the group with the oldest line first. Ten klanten with 90 lines are about 700px instead of 6106px on desktop; a group opens on click or Enter, many may be open ("Alles uitklappen" / "Alles inklappen" in the toolbar). **Within a group** lines are oldest first and **at most 10 show**; a group with more has the button "Toon alle {n} regels" (then the rest, no paging inside). The group actions (Herinnering, Alles als betaald) are in the open group's bar, not in the summary (no buttons inside a summary). **Age badge** escalates in three steps, text plus icon so colour is never the only cue: **0 to 30 days `neutral` (clock), 31 to 90 `warning` (triangle), more than 90 `unpaid` (circle-alert)**; the badge is "{n} dagen open" on a line and "oudste {n} dagen" in a summary (the summary uses the oldest line's bucket). The thresholds are CSS-free (the app picks the class), so they can change without a design change. **Phone:** the summary is a three-line block (name and count, oldest badge, amount) with the chevron at the top right; lines stack their actions underneath as before. **To measure (owner):** the distribution of days open over the open lines (how many are 0 to 30, 31 to 90, over 90) so the thresholds 30 and 90 can be confirmed; if more than about two thirds are over 90, add a fourth step or move the cut-offs. **Dutch copy (new).** oudste {n} dagen | Alles uitklappen | Alles inklappen | Toon alle {n} regels | {n} klanten, oudste bovenaan.

**2.11.** (2026-10-17) **The summary badge finally has a key, and the line badge counts properly
(GAP-148, GAP-150's sibling).** 1.9 specified this page's summary badge as "oudste {n} dagen" and
gave it the key `outstanding.oldest` — which the deck already used for the StatTile label "Oudste
openstaande print". One key, two strings: the app imported the label, so the badge fell back to
`status.daysOpen` and the page read "118 dagen open" where this file and its preview say "oudste
118 dagen". **The badge's key is now `outstanding.oldestDays`**, the tile label keeps
`outstanding.oldest`, and the same key serves Wachtrij's summary. Both strings also gain their
missing counts: "oudste 1 dag" instead of "oudste 1 dagen", **"alles van vandaag"** when the
oldest open line is from today, and `status.daysOpen` becomes "1 dag open" / **"sinds vandaag
open"** instead of "1 dagen open" / "0 dagen open". The three age steps, the thresholds and the
icons are unchanged.

**The phone line is three bands (GAP-151).** `.pp-line` at 480px and below no longer puts the name
and the badge in one row: the name block takes the full width, then the days-open badge sits left
with the amount right, then the actions. This page survived the old rule only because "20 dagen
open" measures 127px; ScreenQueue's badge is 192px of a 326px row and broke the name over three
lines. The tiles are unchanged (two columns, the first spanning), and nothing changes above 480px.
Each line keeps its partial-payment stack ("€ 6,89", "van € 11,89", "Nog € 6,89 open") — on the
phone that stack is now the right-hand half of the second band.
