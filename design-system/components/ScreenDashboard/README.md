Dashboard (`/`) is the working view: customers with print counts, filters and the prints in a card grid or a list.

**Anatomy.** Page title, then a customer strip (one card per klant: name, number of prints, openstaand total or "Alles betaald", and the button "Factuur" that opens the invoice export dialog; a klant flagged niet factureren shows the Niet factureren badge and no Factuur button). Below it the FilterBar; Admins also see the checkbox "Toon verwijderde" (shows deleted prints, projects and customers with Herstellen on each print, project header and customer card) next to "Gearchiveerd tonen" (archived prints are filterable and carry the Gearchiveerd badge). The result is a PrintCard grid or PrintRow table; selecting prints shows the BulkActionBar. Live changes flash the affected card without moving scroll. **Phone:** customer strip becomes a horizontally scrolling chip row, filters collapse behind a "Filters" button (full-height sheet), cards are one column, the bulk bar is sticky at the bottom with an "Acties" menu. **Empty states:** Nog geen prints (links to the first-run guide), Geen resultaten (with Filters wissen), Prints-map niet bereikbaar (with Opnieuw proberen).

**Tokens.** `bg`, `surface`, Cards, FilterBar, BulkActionBar, EmptyState tokens; `space-4` grid gap, `space-6` page padding.

**States.** Loading (Skeleton cards), default, filtered, no results, no prints, root unreachable, selection, live update, deleted shown (admin).

**Accessibility.** One `<h1>`; the grid is a list; the result count is announced politely; bulk bar is a region labelled "Acties voor selectie".

**Dutch copy.** Dashboard | Factuur | Alles betaald | Niet factureren | Toon verwijderde | Gearchiveerd tonen | {shown} van {total} prints | Nog geen prints | Geen resultaten | Prints-map niet bereikbaar | Filters | Acties

**1.4.** Cards and rows of a print with several orders show the summed price, the least settled status, the open amount and "{n} bestellingen" (see PrintCard). The tags popover of the filter bar floats above the cards (`z-popover`). The selected klant card has `.is-selected`; on phones a deleted klant chip offers "Herstellen" (CustomerChips). "Spoel toewijzen" and "Prijs instellen" open BulkDialogs.

**Factuur on phones (1.5).** The CustomerChips toolbar has "Factuur" next to "Klant verwijderen" while one klant is selected (hidden for niet-factureren klanten).
