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
| 1 | `b.pp-strong` print or request name, `div.pp-muted` klant (and project when it differs, per GAP-072), and — **only when the record has no files** — `div.pp-reason` "Nog geen bestanden". Then, since 2.11, at most two one-line meta rows (`div.pp-reason.one`): the **bron** (PrintSource, only on a fileless row) and the **notitie** (PrintNote, on any row). Never more than three meta lines, each clamped to one line |
| 2 | `span.pp-badge` with the waiting time, text plus icon: `queue.waiting`, which reads **"vandaag gevraagd"** at zero days (2.11, GAP-150), "1 dag geleden gevraagd" at one and "{n} dagen geleden gevraagd" above that, using ScreenOutstanding's three age steps unchanged (neutral to 30 days, `warning` 31–90, `unpaid` over 90) |
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

**Phone (480px and below).** `.pp-ogrp>summary` reflows to its two-column, two-row form (inherited) and **`.pp-line` reflows to three bands** (2.11, GAP-151): the name block over the full width, then the age badge left with the figure right, then the actions. That is the same pairing the summary above it uses, and it is a change to `bundle.css` rather than something inherited — see *2.11* below. Groups stay open; actions wrap under each row at 44px.

**Accessibility.** One `<h1>`; each group is a native `<details>` with an `<h3>` in its summary, reachable by Enter and Space; the summary's accessible name is "Mee bezig, 6 aanvragen, waarvan 4 zonder bestanden"; the age badge is text plus icon, never colour alone; "Nog geen bestanden" is real text in the row and not a tooltip; the row count is announced politely when a filter or an action changes it.

**Dutch copy.** Wachtrij | Aanvraag toevoegen | Nog niet besloten | Mee bezig | {n} aanvragen | waarvan {n} zonder bestanden | vandaag gevraagd / {n} dagen geleden gevraagd | Nog geen bestanden | Bestanden koppelen | Status wijzigen | Niets in de wachtrij | Nieuwe aanvragen komen hier te staan. | Toon alle {n} regels and oudste {n} dagen / alles van vandaag (both reused from ScreenOutstanding: `outstanding.showAll` and `outstanding.oldestDays`) | Bron | Notitie.

**Nav.** Between Dashboard and Openstaand — what is coming, what is here, what is owed. See AppShell.

**Not designed here, deliberately.** The "Aanvraag toevoegen" dialog's own anatomy (what a request is typed as before it has a print), and anything to do with delivery (GAP-144). Both wait: the first on the data model the implementer is working out, the second on the owner.

## 2.11 (2026-10-17)

**The summary's age badge has a key at last (GAP-148, GAP-149).** The `.age` slot of each group's
summary shows `outstanding.oldestDays` — "oudste 118 dagen", "oudste 1 dag", and **"alles van
vandaag"** when the oldest request in the group arrived today. 2.10's preview drew that badge and
2.10's copy deck had no key for it; it could not borrow `outstanding.oldest`, which was a tile
label *and* a badge in one key, and `status.daysOpen` says "dagen open", which is about money. The
deck's duplicate is split and **one** key now serves this slot on both screens, because it is one
component's slot with identical words in both places.

**The row says "vandaag gevraagd" on the day it arrives (GAP-150).** `queue.waiting` had plural
arms but no zero arm, and Dutch sends 0 to `other`, so the row the owner had just created read "0
dagen geleden gevraagd" — the first thing he saw after "Aanvraag toevoegen", and most requests are
entered the day they arrive. The badge keeps its `neutral` step and its clock; only the words
change. No `=1 {gisteren}` arm: "1 dag geleden gevraagd" is correct and keeps one vocabulary.

**The phone row is three bands (GAP-151, measured).** At 360px the badge took **192px** of a 326px
row and left the name **90px**, so "Nog te ontwerpen kastje" broke over three lines beside a
one-line badge. ScreenOutstanding survived the same `1fr auto` rule only because its badge is
127px. The name block now spans both columns, the badge and the figure share the second band, and
the actions keep the third — the same shape as the summary above the list. **The row copy is not
shortened**, which was the alternative: "geleden gevraagd" is exactly what makes the badge a wait
and not a debt, and shortening it on the phone would have put the two screens' badges in different
words at different widths. The rule and its preview twin are in `bundle.css`; nothing on this page
changes above 480px.

**A row can now say what kind of job it is (GAP-152).** Two new meta lines in the name block, both
read off the print record and neither a state:

- **the bron** (PrintSource) — the host of the model's page as a link, **only on a row with no
  files**: a link means a model exists somewhere, so this is a download. With files on disk the row
  has nothing to gain from it.
- **the notitie** (PrintNote) — one clamped line of the owner's own words, **on any row**: the note
  is about the work, which outlives the arrival of the files ("In zwart printen, de vorige was
  wit").

**A row with neither is unchanged, and that is the majority.** 15 of 84 folders carry a `.url`, so
most rows show "Nog geen bestanden" and nothing more. Nothing is inferred from an absent bron or an
absent note — no badge, no sort, no filter, no "nog te ontwerpen". The sort inside a group is still
2.10's (fileless rows first). The preview draws that distribution rather than the convenient case:
of the six fileless rows in the 980px frame, one has a bron, one has a note and four have neither.

## 2.14 (2026-10-18)

**"Aanvraag toevoegen" has an anatomy (GAP-157, resolved).** It is **AanvraagDialog**: Naam, Klant
(a combobox that accepts a klant who is not a folder yet), Status (the two queue states, default
*Nog niet besloten*), and the optional Bron and Notitie that PrintSource and PrintNote have both
been pointing at this dialog for since 2.11. No Project, no price, and no *Niet doorgegaan* or *Geen
status* at birth — the reasons are in that file. The `ds-gap: GAP-157` marker can go; compare what
is built against the five fields before you remove it.

**The ending of a request, and the third row action is rejected (GAP-159).** The row keeps **two**
ghost buttons — "Status wijzigen" and, on a fileless row, "Bestanden koppelen" — because absence is
a **value**, not an operation: that is GAP-138, the owner's own decision, and `do-dont.md` says it
in one line ("Don't add a separate clear or remove button"). A third button for "Geen status" would
be the pattern that rule exists to prevent.

**So where does a request end?** In the "Status wijzigen" dialog, and it depends on one observed
fact — whether files exist:

| the row | the dialog offers |
|---|---|
| **with files** | four radios, as everywhere else: Nog niet besloten · Mee bezig · Niet doorgegaan · Geen status (`bulk.statusNone`). Either of the last two takes the row out of the queue, and the print stays on the dashboard with its badge — nothing is lost, because the files are the record |
| **no files** | **two** radios only, the queue's own states, with the help line `queue.statusHelp.fileless` "Zonder bestanden kan een aanvraag alleen in de wachtrij staan.", and below a hairline the ghost **"Aanvraag verwijderen"** (`queue.remove`), which opens a ConfirmDialog naming it |

**The reason the fileless row may not take the other two values** is this page's own sentence from
2.10: *this page is the only place a record with no files appears*. Give such a record "Geen status"
or "Niet doorgegaan" and it is in neither group here and on no other screen — alive in the database
and invisible in the portal. That is not an ending, it is a leak. A note to yourself that you no
longer need is thrown away, not relabelled, so the ending is **Verwijderen**, with the honest body
line `queue.remove.confirmBody`: "De aanvraag verdwijnt uit de wachtrij. Er horen geen bestanden
bij, dus er gaat niets van de schijf."

**Nothing else moves.** The row keeps its four cells and its two buttons, the groups keep their
order, and no class is added. **Dutch copy (new).** Zonder bestanden kan een aanvraag alleen in de
wachtrij staan. | Aanvraag verwijderen | Aanvraag {naam} verwijderen? | De aanvraag verdwijnt uit de
wachtrij. Er horen geen bestanden bij, dus er gaat niets van de schijf.
