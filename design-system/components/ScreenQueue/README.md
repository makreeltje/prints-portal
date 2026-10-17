Wachtrij (`/wachtrij`) is the page for work that is asked for and not finished: the jobs the owner is otherwise holding in his head.

**Why it is a page, measured.** About **4** open requests at a normal moment and **regularly above 10**, in the owner's words: *"die moet ik dan allemaal onthouden, denk dan ook aan aanvragen die ik nog helemaal zelf moet designen en 3d modeleren."* 2.8 set the threshold at about eight for a page over a block on the dashboard and said a screen would not get a nav item for three rows. It is not three rows, and the state that costs him is the one where ten jobs are invisible — so the steady state of four is not what this is designed for. **It is a page** (GAP-124).

**Anatomy.** `<h1>` "Wachtrij" and the primary **"Aanvraag toevoegen"**, then one collapsible group per request state, in fixed order. Each group is OutstandingGroup's form exactly — `<details class="pp-card pp-group pp-ogrp">` with `.ttl` / `.age` / `.amt` / `.chev` in the summary and `.pp-ogrp-list` of `.pp-line` rows inside — because that component already is "a counted group of prints that collapses", and this page is ScreenOutstanding's shape with a different grouping key.

**Two groups, and only two.** `Nog niet besloten` and `Mee bezig`, the states that shipped in 2.9.

- **`Niet doorgegaan` is not here.** The queue holds work outstanding; a refused job is finished. It stays on the dashboard with its badge.
- **"Geprint, nog niet geleverd" has no state, so it has no group.** It was the owner's third bucket and nothing in the app records it. 2.8 flagged that it is also the group nobody would ever clear, and that *delivered* probably wants asserting at the moment payment is recorded rather than as an action of its own. That is a flow question for the owner and is **not** designed here (GAP-144).
- **No stat tiles.** Two tiles above four rows is GAP-101's mistake with a different noun; the group summaries already carry every count this page has. **No "Alles uitklappen" toolbar** either — at two groups it would be a control for nothing.

**Both groups open by default.** At four to ten rows the whole value is seeing them at once; the `<details>` form is there so that collapsing exists when it grows, not so that the page starts folded. Inside a group, `.pp-ogrp-list` keeps ScreenOutstanding's cap: at most **10** rows, then "Toon alle {n} regels" — inherited, no new rule.

**The row.** Four cells, as `.pp-line` has: the name block, the age badge, the figure, the actions.

| cell | content |
|---|---|
| 1 | `b.pp-strong` print or request name, `div.pp-muted` klant (and project when it differs, per GAP-072), and — **only when the record has no files** — `div.pp-reason` "Nog geen bestanden" |
| 2 | `span.pp-badge` with the waiting time, text plus icon: `queue.waiting` "{n} dagen geleden gevraagd", using ScreenOutstanding's three age steps unchanged (neutral to 30 days, `warning` 31–90, `unpaid` over 90) |
| 3 | `span.pp-right` the price in `pp-money` when one is set, empty when none — the dashboard already badges a missing price and this page does not repeat it |
| 4 | `div.pp-row.acts` ghost buttons: **"Status wijzigen"**, and **"Bestanden koppelen"** only on a row with no files |

**The group's state is not repeated on its rows.** The heading is the state; a badge saying `Mee bezig` on every row of the `Mee bezig` group is noise. The row carries what *differs* between rows: how long it has waited, whether it has files, and what it is worth.

## The two kinds of not-yet-printed (GAP-143)

The owner named two things that are both "not printed yet" and are not interchangeable: a request he **must still design and model himself** — hours of his own labour, which cannot be forwarded, batched or started while he is out, and for which no file exists — and a job that is **sliced and waiting for the printer**.

**They are one group, and the difference is drawn by whether files exist.** Not a fourth state. The reason is this system's own rule 1 rather than a preference:

- Both are *his turn*. The actionable difference is how long it will take, not what kind of act it is: sitting down to model and sitting down to slice are both work only he can start.
- A fourth state would make him **assert** a fact the app can **observe**. Moving a job from "designing" to "ready to print" by hand is a second assertion for an event the indexer sees — the files appeared. Rule 1: an asserted stage can go stale in silence, an observed one cannot. So this distinction belongs on the observed axis, which also means it is right the moment the files land and needs nobody to remember it.
- What he said hurts is *remembering they exist at all*, not classifying them.

**So the fileless rows sort first inside `Mee bezig`**, each carrying `queue.noFiles`, and the group summary's `.amt` slot carries `queue.ofWhichWithoutFiles` — "waarvan {n} zonder bestanden". That is the one figure that answers "how much of my own labour is queued", without a second state and without a second assertion.

**The word is the observation, not the inference.** "Zonder bestanden", never "nog te ontwerpen": a print can lack files because he has not downloaded a model yet, not only because he must design one. Naming the inference would be the fault rule 6 was written for.

**Rejected: a fourth state `Nog te ontwerpen`.** And the measurement that would overturn it, which is one the owner can give once this page exists: **whether design jobs dominate.** If eight of ten are design work, the group heading is carrying almost everything, the sort inside it does no work, and a group of its own earns its place. At four of ten the sort and the count are enough. I would rather be told the split than guess it.

**Tokens.** No new token. OutstandingGroup, Button, StatusBadge and EmptyState tokens; `.pp-reason` is `muted` on `surface` and on the group's `surface-2` summary, both in `contrast.md` at 4.5:1 or better in **both themes**. **No new class and no CSS change** — every class this screen uses is OutstandingGroup's or a helper that exists.

**Where a fileless record lives (GAP-123, now live).** The owner has chosen **hand-linking**: requests reach him anywhere — *"ook als ik bij iemand op bezoek ben, of als ik onderweg ben"* — and he only ever makes folders on his laptop, so "Aanvraag toevoegen" has to work in a phone browser with no folder at all. **This page is therefore the only place a record with no files appears**: not in the dashboard grid or list, not in "{shown} van {total} prints", not in the klant chip's count, not in the print search (ScreenDashboard, 2.8). It joins all of those the moment it has files, with no special case. **"Bestanden koppelen" links to a folder that already exists; nothing here creates one** — rule 7.

**States.** Loading (Skeleton rows), default, a group busy, a row busy (spinner in its button, the row kept), **empty** (`.pp-empty`: "Niets in de wachtrij" with "Nieuwe aanvragen komen hier te staan." and the "Aanvraag toevoegen" button), error (inline alert, nothing changed). A group with no rows is **not rendered** — an empty `Mee bezig` card is a box about nothing.

**Phone (480px and below).** `.pp-ogrp>summary` already reflows to its two-column, two-row form and `.pp-line` to `1fr auto` with `.acts` spanning — both inherited, nothing new. Groups stay open; actions wrap under each row at 44px.

**Accessibility.** One `<h1>`; each group is a native `<details>` with an `<h3>` in its summary, reachable by Enter and Space; the summary's accessible name is "Mee bezig, 6 aanvragen, waarvan 4 zonder bestanden"; the age badge is text plus icon, never colour alone; "Nog geen bestanden" is real text in the row and not a tooltip; the row count is announced politely when a filter or an action changes it.

**Dutch copy.** Wachtrij | Aanvraag toevoegen | Nog niet besloten | Mee bezig | {n} aanvragen | waarvan {n} zonder bestanden | {n} dagen geleden gevraagd | Nog geen bestanden | Bestanden koppelen | Status wijzigen | Niets in de wachtrij | Nieuwe aanvragen komen hier te staan. | Toon alle {n} regels (reused from ScreenOutstanding).

**Nav.** Between Dashboard and Openstaand — what is coming, what is here, what is owed. See AppShell.

**Not designed here, deliberately.** The "Aanvraag toevoegen" dialog's own anatomy (what a request is typed as before it has a print), and anything to do with delivery (GAP-144). Both wait: the first on the data model the implementer is working out, the second on the owner.
