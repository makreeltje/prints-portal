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

Everything above is existing tokens and existing components; the one new piece of layout is the head bar, which is `surface` with a `border` rule and `primary-tint`/`text-strong` for the current item — the pairs `.pp-nav a[aria-current=page]` has used since 1.0. **No new colour pair, so no new row in `contrast.md`.** The head wraps at 360px and the nav becomes two equal 44px halves of its track on a line of its own (AppShell 2.14 and 2.15, each with its `.pp-device.phone` twin).

**Dutch copy.** Overzicht | Prints | Sessie afsluiten | Sessie afsluiten? | Je kunt daarna alleen terug met de link die je hebt gekregen. | Afsluiten | Je bent afgemeld van dit overzicht | Open de link opnieuw om je prints te bekijken. | Nog geen prints | Zodra er iets voor je geprint is, zie je het hier. — plus everything ScreenSharePage, ScreenDashboard and ScreenPrintDetail already carry.

## What the owner still decides (do not build these yet)

Three things widen what a klant can see. Each is **proposed, needs his confirmation**, and the session is complete without them:

1. **Materiaal and Gewicht** (**GAP-174**, still proposed) in the visitor's "Deze print" card and in the card's meta line. 2.0 wrote "Klant, Project and Datum" for role User and the invoice already prints Gram, so this is a small, defensible addition — but it is his call what a klant reads, not mine.
2. **The timelapse** (**GAP-175**, still proposed) in the media strip. 60% of prints have one and it is a film of the klant's own print; it is also a surface no customer has ever had, and the same network-tab threshold applies to it as to the model. Until he says yes, a visitor's media strip shows **models only**.
3. **Tags — settled in 2.15, see below (GAP-166): no tags for role User either.** 1.4 says role User sees tags; the share page never has. A tag is the owner's own filing word ("cadeau" on a present) and I would align role User with the session rather than the other way round. Until then: **no tags in a share session**, and the conflict is on the record.

And one for the app rather than the owner: **role User's nav still offers API-docs** (**GAP-173**) (AppShell). I believe that is wrong for the same reason it is wrong here, but a User is an account holder and may have been given one for a reason — AppShell 2.14 carries it as a proposal, not a change.

## 2.15 (2026-10-18)

**The nav marks where he can go, not only where he is (GAP-169, the owner's, resolved).** He walked
the merged session, passed the Overzicht, the list and a print, and stopped at the head bar: *"het
is niet duidelijk genoeg dat je ook naar prints kan gaan"*. It was built exactly as *Both themes, phone and desktop* below
specified, so the sentence was the fault. `primary-tint`/`text-strong` on `aria-current="page"`
dresses **only the destination you are already on**; in `.pp-nav`'s column that is enough, because a
list of items in a fixed place is self-evidently navigation. Lifted into a head bar with two items
it inverts: the current item holds all the ink, the screen the visitor has never seen holds none,
and its only resting cue was `:hover`, on the one device a deel-link is opened from. This is also
the one screen whose user gets no second chance — a klant opens the link once, from WhatsApp.

**The shape: one track, two halves, and they stay links.** `.pp-guestnav` is now a pill track —
`surface-2`, `radius-pill`, `1px solid var(--border-strong)`, 2px of padding — holding the two
items, with the current one a `primary-tint` pill inside it. The track is what the visitor reads
first: *there are two of these and I am on one of them*. The markup does **not** change kind:

```html
<nav class="pp-guestnav" aria-label="Hoofdmenu">
  <a href="/share/{token}" aria-current="page"><svg class="pp-ico pp-ico-20">…</svg>Overzicht</a>
  <a href="/share/{token}/prints"><svg class="pp-ico pp-ico-20">…</svg>Prints</a>
</nav>
```

**The blessing the app asked for, in one line: the look is borrowed, the semantics are not.** These
are routes, so they are `<a>` elements with `aria-current="page"` inside one `<nav aria-label>` —
**never** `aria-pressed`, **never** `role="group"` or `role="tablist"`, and never a `<button>` that
navigates. SegmentedControl 2.15 says the same thing from the other side. The app was right to
refuse to make that call on its own: a pill track is a visual idiom, and this system does not let a
visual idiom drag an ARIA pattern along with it.

- **`.pp-seg` itself is not reused** and this is not a `.pp-seg` with links. The two differ in one
  deliberate way: a segmented control marks its selection with a `surface` pill, and on this head
  bar — whose own ground **is** `surface` — that pill would vanish into the bar and leave the mark
  to a shadow. So the current item keeps 1.0's current-page pair instead, which also keeps the
  session on colours the report already approves.
- **`.pp-tabs` is rejected for this bar.** Its signal is an underline on the selected tab and
  `muted` text on the rest, which is 2.14's defect with a thinner line: the unvisited destination
  would still be the quietest thing in the head.
- **The approved placeholder (an outline on each item) can go.** It answers the complaint, and the
  app measured it honestly — but it draws the boundary of the *current* item against that item's own
  `primary-tint` ground, which is **2.94:1 in dark** (3.50 light), under the 3:1 the same argument
  invoked to reject `--border`. A track has one border, and it sits on `surface`, where
  `border-strong` is 3.75:1 and 4.29:1. One boundary in the right place beats two in the wrong one.

**Measured by me, to be verified by you.** The nav line grows by **6px** (1px of border and 2px of
padding on each side): items stay 36px at desktop and 44px at 360px, so the head should read about
67px and 127px where 2.14 measured 61px and 121px. The two halves are `flex: 1 1 0` at 360px, so
about 160px each inside a 328px track. Nothing else in the head moves.

**The exit button and a long studio name (GAP-172, resolved).** Your §2.3 is right and my claim was
only right for this owner: at 20 characters the brand's `margin-right: auto` takes the whole first
line, the exit button drops to its own, and the head is 153px; at 48 the brand wraps and it is
177px. **At 480px and below the head is now one height at every name length:** the brand keeps one
line and ends in an ellipsis when it must (the full name stays in the DOM, so a screen reader still
hears all of it, and a studio that wants its long name drawn whole uploads a logo), and the exit
button is **icon-only** — `log-out`, `--pp-tap` square, named by its own visually hidden
`<span class="lbl">Sessie afsluiten</span>`, which is how the icon rail has named its footer buttons
since 1.0. It still opens the ConfirmDialog, which says the act in words before it happens, so the
glyph is never the last word. **Above 480px nothing changes**: the words stay.

**The markup for the button**, which is new: `<button class="pp-btn pp-btn-ghost pp-btn-sm
pp-guestexit"><svg class="pp-ico">…</svg><span class="lbl">Sessie afsluiten</span></button>`. The
`.lbl` span is required at every width; `.pp-guestexit` is what hides it on the phone.

**The payment is a line in the header, not a card below the fold (GAP-170, resolved).** Your §2.4
measured the whole "Betaling" card under the fold on a 390×844 phone, with its badge 89px below —
and noted that the status is already visible at y=201 in the header badge row. That is the answer:
for role User and for a visitor the payment is **one line beside the `<h1>`** — the status badge and
the amount — and the `pp-card pp-pay` card is **gone from this role**. The amount joins the badge it
belongs to, above the fold at every width, and the page stops saying the same thing twice. Full
anatomy in ScreenPrintDetail 2.15.

**Prints is not paged in a session (GAP-178, resolved), and the search field is refused
(GAP-171, rejected).** Your §2.1 gave me the number I asked for — 36, 23, 10, 4, 2, 2, 2, 2, 1, 1,
1, 0 — and it answers two questions at once:

- **The page boundary goes.** The visitor's Prints renders **the klant's whole list**, newest first:
  no "Meer laden", no "{shown} van {total} prints". The Overzicht one tap away has listed every
  print of this klant on one page since 1.0, and the two screens are the same set in two forms —
  the rule in §5 is that they must never disagree about which print is the last one, and a page
  boundary on one of them is exactly such a disagreement. One klant's prints are a bounded set by
  construction; if the Overzicht's list ever has to be paged, both get it in the same round.
- **No search field, and it was my own conditional that fired.** I wrote *"if one klant has thirty,
  the visitor gets the search field"*; the maximum came in at 36 and the **distribution** is what I
  did not have: **eleven of twelve klanten have ten prints or fewer**, and the biggest two fit one
  unpaged page. A control that earns its place in one session of twelve is the chrome the "no
  FilterBar" decision refused on this screen, and the words it would search are the owner's own
  folder names, which a klant may not have. Newest first answers the common question without a
  control. **What would overturn it:** a klant whose list passes about 60 prints, or the owner
  being asked by a klant where a particular print is. Then it is one field, labelled "Zoeken", and
  still nothing else from the bar.

**Tags: role User sees none either, and the proposal is withdrawn (GAP-166, resolved).** 1.4 gave
role User tags and this file called it *proposed*; ScreenPrintDetail 2.14 wrote "no tags" for both.
That contradiction is mine and it is settled in favour of the stricter half: **no tags for role User
and none for a visitor, anywhere** — not on a print card, not in a print's header, not as a filter.
The fact that settles it is the owner's own: **he does not use tags at all** (GAP-129), so there is
no case in this library where his filing word helps a klant, and a tag is his word for his own
reasons ("cadeau" on a present is the example that has been in TagChip since 1.0). It also makes
role User and a session the same screen, which is what keeps the reduced form from drifting. 1.4's
clause "name, price, status, thumbnail, 3D model and tags only" is **superseded**.

**The two proposals that are still his, now numbered so they stop being nameless.** Both stay
**proposed, needs his confirmation** — do not build either:

1. **GAP-174 — Materiaal and Gewicht** in the visitor's "Deze print" card and in the card's meta
   line. The invoice already prints Gram. *Tijd* stays out either way.
2. **GAP-175 — the timelapse** in the visitor's media strip. 60% of prints have one and it is a film
   of the klant's own print; it is also a surface no customer has ever had, and the same network-tab
   threshold applies to it as to the model. Until he says yes: **models only**, which the app has
   now made true in the data (`assets: null`) rather than in the view.

**Both themes, phone and desktop.** The track's own pairs: `border-strong` on `surface` (3.75 dark /
4.29 light) and on `surface-2` (3.32 / 3.69), `text` on `surface-2` (9.38 / 10.89), and the one new
composite — `text-strong` on `primary-tint` **over `surface-2`** (10.02 / 12.16). All in
`contrast.md` under *Added in 2.15*. That section's sentence "no new colour pair, so no new
row in `contrast.md`" is withdrawn with it.
