Dashboard (`/`) is the working view: customers with print counts, filters and the prints in a card grid or a list.

**Anatomy.** Page title, then a customer strip (one card per klant: name, number of prints, openstaand total or "Alles betaald", and the button "Factuur" that opens the invoice export dialog; a klant flagged niet factureren shows the Niet factureren badge and no Factuur button). Below it the FilterBar; Admins also see the checkbox "Toon verwijderde" (shows deleted prints, projects and customers with Herstellen on each print, project header and customer card) next to "Gearchiveerd tonen" (archived prints are filterable and carry the Gearchiveerd badge). The result is a PrintCard grid or PrintRow table; selecting prints shows the BulkActionBar. Live changes flash the affected card without moving scroll. **Phone:** customer strip becomes a horizontally scrolling chip row, filters collapse behind a "Filters" button (full-height sheet), cards are one column, the bulk bar is sticky at the bottom with an "Acties" menu. **Empty states:** Nog geen prints (links to the first-run guide), Geen resultaten (with Filters wissen), Prints-map niet bereikbaar (with Opnieuw proberen).

**Tokens.** `bg`, `surface`, Cards, FilterBar, BulkActionBar, EmptyState tokens; `space-4` grid gap, `space-6` page padding.

**States.** Loading (Skeleton cards), default, filtered, no results, no prints, root unreachable, selection, live update, deleted shown (admin).

**Accessibility.** One `<h1>`; the grid is a list; the result count is announced politely; bulk bar is a region labelled "Acties voor selectie".

**Dutch copy.** Dashboard | Factuur | Alles betaald | Niet factureren | Toon verwijderde | Gearchiveerd tonen | {shown} van {total} prints | Nog geen prints | Geen resultaten | Prints-map niet bereikbaar | Filters | Acties

**1.4.** Cards and rows of a print with several orders show the summed price, the least settled status, the open amount and "{n} bestellingen" (see PrintCard). The tags popover of the filter bar floats above the cards (`z-popover`). The selected klant card has `.is-selected`; on phones a deleted klant chip offers "Herstellen" (CustomerChips). "Spoel toewijzen" and "Prijs instellen" open BulkDialogs.

**Factuur on phones (1.5).** The CustomerChips toolbar has "Factuur" next to "Klant verwijderen" while one klant is selected (hidden for niet-factureren klanten).

**1.9.** (2026-10-07) **What changed on the dashboard (1.9).** Klant strip: one scrollable row of chips plus "Overzicht" on every width (GAP-067); FilterBar: Sorteren and Status (GAP-066); whole klant tile as the control and delete in a "⋯" menu (GAP-070, 075; the tiles now live in the overview dialog); thumbnail column in the list view (GAP-068); tint floor (GAP-071); the bulk bar sticks at every width (GAP-069); subtitle without the repeated print name (GAP-072); the page scrollbar belongs to the page, the sidebar is sticky (GAP-063). The preview draws the strip with 20 klanten at 1280 and 360px and the overview dialog with 20 tiles. First screen at 1360x900: header, strip (about 56px), filter bar, then prints, so the first row of prints is visible without scrolling.

**2.8.** (2026-10-17) **A record with no files does not appear on this page (GAP-123, proposed, needs your confirmation).** If the app ever holds a request before its files exist, the dashboard is **not** where it lives. Every surface on this page answers *what is in my library*: the card grid and the list render what the indexer found, the klant strip counts prints per klant, and the count line says "{shown} van {total} prints". A record with no files is not in the library, so it is absent from the grid, the list, both counts, the klant chip's number and the print search — and the count line keeps its current meaning instead of gaining a footnote. The moment such a record meets its files it is a print like any other and appears here with no special case.

The denominator is the argument, not tidiness. "9 van 83 prints" is a load-bearing sentence on this page; a dashboard that counted jobs and prints in one figure would be wrong for both, and the FilterBar's Status options are all about money (`Geen prijs`, `Open`, `Betaald`, `Afgeschreven`, `Onvolledige kosten`) and have nothing to say about a job that has not been designed. Work that is not yet a print belongs in a list of its own; see `changelog.md` 2.8 for the proposed queue, which is **not in this version**.

Two things this does **not** do. It does not hide a *declined* print: that print has files and stays on the dashboard with its "Niet doorgegaan" badge (StatusBadge). And it does not add a filter here — "show me the open requests" is the queue's question, not this page's.

**2.14.** (2026-10-18) **A visitor with a deel-link sees this screen with the klant axis removed (GAP-165).** The deel-link mints an anonymous read-only session for one klant (**ScreenShareSession**), and its second destination is this page. The reduction is listed there in full; the short version, because a reader of this file has to know a second form exists:

- **gone:** the klant strip and its overview dialog (there is one klant, and switching klanten is the thing a session may not do), "Factuur", the selection and the BulkActionBar, "Toon verwijderde", "Gearchiveerd tonen" — and the **FilterBar as a whole**;
- **gone from a card:** the filament tint (GAP-079's reason, on a customer's screen a dark filament hides the model), the checkbox, the tags and the meta line;
- **kept:** the thumbnail, the name, project and date, the price and the status badge — exactly the facts an Overzicht line carries, in a card — and the card's link into the print;
- **order:** newest first, the same order as the Overzicht's list, so the two screens never disagree about which print is the last one.

**No FilterBar, and it is a judgement about numbers I would like checked.** 84 prints over 12 klanten is about seven per klant, and a filter bar above seven cards is chrome. The number that decides it is the *largest* klant, not the average, and the app has the library: see *What I need measured* in `changelog.md` 2.14. If one klant has thirty prints, the visitor gets the search field and nothing else from the bar.

**The archived rule, so the two screens agree.** Archived prints stay in a visitor's list without a badge and without a toggle, which is what this klant's Overzicht has done since 1.6. "Gearchiveerd" is a word about the owner's disk, not about the klant's print.
