The share page (`/share/:token`) is what a customer sees when opening a Deel-link, usually on a phone from WhatsApp; it is read-only and needs no login.

**Anatomy.** Lighter and more spacious than the operator UI: no sidebar, single centred column (max 560px on desktop, full width on phones), text at `text-md` or larger, `radius-xl` panels. Top: studio name or logo, heading "Overzicht voor {klant}", the link label and the expiry notice. Then the switch "Alleen openstaand", the list of prints (name, project and date, price, status badge, "Nog € x open" for partial payments, "Prijs volgt" when there is no price), a totals card (Totaal, Betaald, Openstaand; prints without price excluded) and the primary button "Download overzicht" (PDF titled "Overzicht"; with the switch on it contains only open lines). Never shown: internal cost, margin, notes, file names or other klanten. **Expired or revoked:** friendly page "Deze link is verlopen of ingetrokken" with a link icon and one explanatory sentence; no navigation. Dark theme follows the visitor's system setting.

**Tokens.** `bg`, `surface`, `border`, `text-md`, `radius-xl`, badge tokens, Button (48px primary).

**States.** Default, only open, empty ("Er staat niets open."), expired or revoked, loading.

**Accessibility.** One `<h1>`; list semantics for the prints; status in text plus icon; the switch has a visible label.

**Dutch copy.** Overzicht voor {klant} | Deze link verloopt over {dagen} dagen ({datum}) | Alleen openstaand | Prijs volgt | Totaal | Betaald | Openstaand | Download overzicht | Prijzen in euro. Prints zonder prijs staan niet in de totalen. | Er staat niets open. | Deze link is verlopen of ingetrokken | Vraag degene die je de link stuurde om een nieuwe.
