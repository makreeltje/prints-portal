CustomerCard summarises one klant on the dashboard (desktop and tablet): name, number of prints, what is still open and the invoice shortcut. Admins and Editors can delete the whole klant.

**Anatomy.** `div.pp-card.pp-cust` in `.pp-custs` (auto-fill grid): `.hd` with the name and `.end` (`.cnt` "{n} prints" plus a ghost icon button "Klant verwijderen"), then either `.amt` (open amount and "openstaand") or `.cnt` "Alles betaald" (or a "Niet factureren" badge), then `.acts` with "Factuur". Clicking the card filters the dashboard to this klant. **Deleted** (`.is-deleted`, only for Admins with "Toon verwijderde"): dimmed, a Verwijderd badge and a secondary "Herstellen" button. Deleting asks the ConfirmDialog "Klant verwijderen?" (danger) and hides all prints of the klant; restoring brings them back. The card is shown with `pp-only-wide`; phones use CustomerChips.

**Tokens.** `surface`, `border`, `radius-lg`, `space-*`, `muted`, `text-sm`, Badge and Button tokens.

**States.** Default, hover, selected (filter active: `.pp-cust.is-selected`, or any card that contains a name button with `aria-pressed="true"`; `primary` border and `primary-tint-soft` ground), deleted, no billing, all paid.

**Accessibility.** The delete button has `aria-label="Klant verwijderen"`; the card name is a button that sets the filter; deleted cards stay readable (45% opacity only dims decoration, text keeps contrast).

**Dutch copy.** Klant verwijderen | Herstellen | Alles betaald | openstaand | Factuur | {n, plural, one {# print} other {# prints}}

**1.5.** The name is a real button (`pp-cust-name`, `aria-pressed`) that sets the filter; the "Factuur" button stays `pp-only-wide` because phones get the same action in the CustomerChips toolbar.

**1.9.** (2026-10-07) **The whole tile is the control (GAP-070, confirmed) and delete moves into a menu (GAP-075, resolved).** The klant's name button (`pp-cust-name`, `aria-pressed` = this klant is the active filter) is stretched over the whole tile with a `::after` (inset 0), so the amount and the white space filter too; the name stays a real `<button>`, one tab stop, with a name that reads "Joey, 12 prints". States: **rest** (as before), **hover** (`border-strong` border, pointer cursor), **focus-visible** (the 2px `focus-ring` outline is drawn around the *tile*), **pressed / selected** (`primary` border and `primary-tint-soft`, the existing `.is-selected` look). The tile's own controls (Factuur, the "⋯" menu) sit above the hit area (`z-index:1`) so they never filter. **Delete** is no longer an icon beside the name: the tile's `.end` group holds the print count and the OverflowMenu ("Factuur maken", divider, "Klant verwijderen" in `unpaid`); ConfirmDialog stays; ten delete icons are gone from the fold. A deleted klant (Admin, "Toon verwijderde") keeps its dashed look and the menu holds "Herstellen". Dutch copy (new): Meer acties | Factuur maken.

**2.13.** (2026-10-18) **A klant with nothing in their folder (GAP-162, resolved).** Since a klant
is a folder on disk, a klant can exist with no prints — and that is now the **start state of every
new klant**, not an edge case: the owner makes the folder the moment somebody asks for something.
Three decisions, and one of them is a refusal.

**1. The count says the word, not the figure: "Nog geen prints".** Dutch sends 0 to the `other` arm,
so `customers.printCount` rendered "0 prints". The key gets a **zero arm** rather than a new key —
the same rule the deck has followed since 2.11 — so one key still owns the fact. The tile is
otherwise an ordinary tile: `.amt` keeps its element and stays **empty** (a slot that may be empty
keeps its element, 2.12), and there is no "Alles betaald", because nothing was ever owed and a
sentence in the present tense may only be rendered where it is true (2.7).

**2. A control with no object is not rendered.** On a klant with no prints there is no **"Factuur"**
button and no **"Factuur maken"** item: there is nothing to bill. And **"Klant verwijderen" is not
offered either** — which is the part worth the argument, because it looks harmless:

- Delete, in this app, hides a klant **and its prints** and offers Herstellen. With no prints it
  hides nothing that exists in the portal, and the klant is a **folder**, which the portal reads and
  never writes (`README.md` rule 7: `/prints` is Nextcloud's, not ours). A portal that hid the klant
  anyway would disagree with the disk at the next index, and the disk is the record.
- So the answer to "how do I get rid of this klant?" is **remove the folder**, where it was made.
  The app has measured that path: 11 klanten → 12 with a folder added → 11 again when it was
  removed, with the print totals unmoved. The tile does not need to say so; the Klanten section in
  Instellingen is where that sentence would go if the owner ever asks for it.

With both items gone the menu would be empty, so **the "⋯" is not rendered** — an overflow menu with
nothing in it is itself a control with no object. The tile keeps `.acts` as an empty element.

**3. Nothing marks it apart, and nothing sorts it apart.** **Rejected:** a `pp-hintchip` "nog geen
prints" (the implementer's alternative) — the chip qualifies a *value*, and here the count already
*is* the statement; two devices saying one thing is the duplication 2.12 spent a round removing.
**Rejected:** sorting empty klanten last — the klant you just made is the one you are looking for,
and a sort that hides it defeats the feature. An empty klant is a klant; its words are its mark.

**The tile still filters, and the filter lands somewhere that says something.** Clicking it is how
the klant proves it exists. The dashboard's empty state gets a klant-specific pair,
`empty.customerNoPrints.title` / `.body` — "Nog geen prints voor {klant}." and "Prints verschijnen
hier zodra er bestanden in de map van deze klant staan." The body says **when** prints appear; it
does not promise that the app will put anything anywhere (`README.md` rule 7).

**Dutch copy.** `customers.printCount` gains `=0 {Nog geen prints}`; `empty.customerNoPrints.title`
and `empty.customerNoPrints.body` are new. **CustomerChips** follows the same rule: a chip for a
klant with no prints reads "Nog geen prints" and carries no action it cannot perform.

**Both themes, no new token, no new class, no new colour pair.**
