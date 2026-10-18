ScreenShareSession is what a visitor with a deel-link walks through: an anonymous, read-only session scoped to one klant, in the real portal screens.

**The decision this exists for (GAP-165, the owner's).** He opened a deel-link and said *"leuk, maar niet wat ik had verwacht"*: he expected the klant to walk through the portal, not to read "een karig overzicht van zijn prints". So **the link stops being a page you send and becomes a key.** A valid token mints a session for that klant and the visitor uses the screens the portal already has. Two alternatives he rejected and I would have rejected too: widening the share page screen by screen (a second portal that drifts from the first), and turning the link into an invitation to make an account (a barrier for a klant who ordered one keychain).

**What makes this cheap, and it is worth saying plainly: the session hides nothing new.** Role **User** has been read-only by construction since 1.1 — no cost, no breakdown, no notes — so a visitor is a User without an account, not a new privilege level. The owner asked for the viewer and no downloads, which is what the role already does.

**One limit the app wrote down and this file keeps written down.** `/api/prints/:id/model` streams the **source** STL or 3MF. A visitor who can see a model can save its bytes from the network tab; the absent download button is a **threshold, not a boundary**. A real boundary means serving a derived mesh, and that is separate work. Nothing in this design pretends otherwise, and no copy tells the klant the file is protected.

## 1. The shell: AppShell's `guest` variant

The session uses the same `main.pp-main` and the same screens, with the operator's chrome replaced by one head bar — full spec in **AppShell 2.14**. What a visitor's head holds: the studio (logo, else the company name, else "3D Prints Portal"), the two destinations, and **"Sessie afsluiten"**. What it does not hold, and why:

| gone | because |
|---|---|
| the avatar with a role | there is no account and no role to name; "User" is an internal word |
| "Thema" | a choice we cannot carry: the next tap on the same WhatsApp link is a fresh session. The page follows the visitor's system setting, which is what ScreenSharePage has done since 1.0 and is the honest default |
| "Uitloggen" | nothing to log out *of*. Its place is taken by "Sessie afsluiten", which is a different act: it drops the session cookie, not an account |
| the LiveIndicator and the offline bar | both exist to tell an operator whether what he is working on is current. A visitor is not working and can do nothing about a reconnect; the session's own failure has its own page (§4) |
| the sidebar, the icon rail, the drawer, the bottom bar | two destinations do not need a drawer at any width, and a 220px sidebar holding two links is an empty operator costume on a klant |

**There is a way out, and it is one item.** A deel-link is opened on borrowed phones and in family group chats; the only way to end such a session otherwise is to clear the browser. "Sessie afsluiten" asks first (ConfirmDialog, `session.exit.confirm` / `session.exit.confirmBody` / "Afsluiten") because it is a one-way door: afterwards the only way back is the link itself, which the portal will not show again. If the app would rather not build the endpoint yet, this is the one piece of the shell that can be left out without breaking anything else — then the head draws no button at all, and no page says anything about closing.

## 2. The nav: Overzicht and Prints

Two items, `session.nav.overview` and `session.nav.prints`, with `aria-current="page"` on the one you are on.

- **Overzicht** (`list`) — ScreenSharePage, the landing (§3).
- **Prints** (`layout-dashboard`) — ScreenDashboard scoped to this klant (§5). It keeps Dashboard's glyph on purpose: it *is* that screen, and a second icon for one screen is a second thing to learn.
- **API-docs is not here.** A klant has no token, no account and nothing to call; it is the clearest case in the system of a control a role cannot use (`README.md` *Components*). **Openstaand is not here either**, and that is a decision rather than an omission: Openstaand answers *which klanten owe me what, and how old is it* — one klant's version of that question is the "Alleen openstaand" switch on the Overzicht, which stands next to the totals and the payment details. One answer, one place.

## 3. Where the link's own facts live: on the Overzicht, not in a bar

The expiry notice and the "Betalen" block stay exactly where they are — the top and the middle of ScreenSharePage — and the session's landing screen is that page. **A persistent bar is rejected.** The facts do not change behaviour on any other screen, there is nothing to do about either of them from a print's page, and the "Betalen" block carries an **amount** that is only correct beside the totals it belongs to (2.0: what you owe, then how to pay it, then the paperwork). A bar would repeat one sentence on every screen for the same reason twelve betaallink help lines repeated one sentence under every klant, which GAP-101 took 404px of page height off Instellingen to remove: *a label belongs to its control, an explanation belongs to the section.*

The visitor sees the expiry notice on the screen they land on, every time they open the link, which is the only moment it can change anything they do.

**One change to the notice (GAP-165).** At **0 or 1 day** left it is a `warning` badge instead of `info`; the strings are unchanged (`share.expiresToday`, `share.expiresTomorrow`) and so is the clock glyph, because the words already say it and the tint only reinforces. A link with no expiry still shows no notice (1.6).

## 4. When the link dies while the visitor is inside

**The rule from 1.6 stands untouched: unknown, malformed, expired and revoked all show one page, so they cannot be told apart.** That page — `share.notFound` "Deze link is verlopen of ingetrokken" with `share.askNew` — is also the end of a session, and it is drawn **without the shell**: a nav of dead links is worse than no nav.

**The ending happens on the visitor's next action, not on a timer.** The next navigation, switch or print that asks the server gets the refusal and the whole page becomes that one page. A page already on screen is **not** yanked away mid-read: its data was true when it loaded, the visitor cannot act on anything (it is read-only), and the portal does not know what clock the visitor's device is on. A countdown would be a second fact about the link on every screen, which §3 just refused.

**Revoking is the same ending**, by design: the operator is told so in ScreenShareLinks' confirmation (`share.revoke.body`), so revoking a link is not a silent act with a visible consequence somewhere else.

**"Sessie afsluiten" has its own page**, because the two endings are not the same fact: `session.ended.title` "Je bent afgemeld van dit overzicht" with `session.ended.body` "Open de link opnieuw om je prints te bekijken." It is a `log-out` glyph on the same `pp-illus-box`/`pp-share-h404` shape and it has **no button** — a button back in would need the token, and the whole point of the act is that the session no longer has it.

## 5. Prints, and one print

**Prints** is ScreenDashboard with the klant axis removed: no klant strip and no overview dialog (there is one klant), no "Factuur", no selection and no BulkActionBar, no "Toon verwijderde" and no "Gearchiveerd tonen" (archived prints stay in the list, as they do on the Overzicht since 1.6), **no tags** and **no FilterBar**. A card carries exactly the facts an Overzicht line carries — thumbnail, name, project and date, price, status badge — and no more:

- **no filament tint** on the thumbnail, the rule GAP-079 set for the share page: on a customer's screen a dark filament hides the model, and the tint is operator information;
- **no meta line** (material, time, weight): see *What the owner still decides* below;
- **no checkbox**: nothing here is selectable.

Order: newest first, the same order as the Overzicht's list, so the two screens never disagree about which print is "the last one". **Empty** (a klant whose folder has nothing in it — one of the twelve klanten in the owner's library): `.pp-empty` with `session.prints.empty` "Nog geen prints" and `session.prints.emptyBody` "Zodra er iets voor je geprint is, zie je het hier." The deck's existing `empty.customerNoPrints.body` is **not** reused here: it explains folders, which is the workshop's vocabulary and not the klant's.

**One print** is ScreenPrintDetail in its *Rol User* variant, now drawn: viewer, the reduced "Deze print" card (**GAP-158**, see ScreenPrintDetail 2.14), the bron, and the payment as a **state** — badge and amount, no fields, no history, no note, no files card, no "⋯" menu, no spool control. Paying is not done per print anywhere in this system, so the print page carries no payment instruction; the Overzicht is one tap away and is where the amount is the total.

## Both themes, phone and desktop

Everything above is existing tokens and existing components; the one new piece of layout is the head bar, which is `surface` with a `border` rule and `primary-tint`/`text-strong` for the current item — the pairs `.pp-nav a[aria-current=page]` has used since 1.0. **No new colour pair, so no new row in `contrast.md`.** The head wraps at 360px and the nav becomes two equal 44px tabs on a line of its own (AppShell 2.14, with its `.pp-device.phone` twin).

**Dutch copy.** Overzicht | Prints | Sessie afsluiten | Sessie afsluiten? | Je kunt daarna alleen terug met de link die je hebt gekregen. | Afsluiten | Je bent afgemeld van dit overzicht | Open de link opnieuw om je prints te bekijken. | Nog geen prints | Zodra er iets voor je geprint is, zie je het hier. — plus everything ScreenSharePage, ScreenDashboard and ScreenPrintDetail already carry.

## What the owner still decides (do not build these yet)

Three things widen what a klant can see. Each is **proposed, needs his confirmation**, and the session is complete without them:

1. **Materiaal and Gewicht** in the visitor's "Deze print" card and in the card's meta line. 2.0 wrote "Klant, Project and Datum" for role User and the invoice already prints Gram, so this is a small, defensible addition — but it is his call what a klant reads, not mine.
2. **The timelapse** in the media strip. 60% of prints have one and it is a film of the klant's own print; it is also a surface no customer has ever had, and the same network-tab threshold applies to it as to the model. Until he says yes, a visitor's media strip shows **models only**.
3. **Tags.** 1.4 says role User sees tags; the share page never has. A tag is the owner's own filing word ("cadeau" on a present) and I would align role User with the session rather than the other way round. Until then: **no tags in a share session**, and the conflict is on the record.

And one for the app rather than the owner: **role User's nav still offers API-docs** (AppShell). I believe that is wrong for the same reason it is wrong here, but a User is an account holder and may have been given one for a reason — AppShell 2.14 carries it as a proposal, not a change.
