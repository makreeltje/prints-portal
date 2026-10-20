AppShell is the frame around every operator page: sidebar on desktop, a 56px icon rail on tablets, top bar plus bottom bar and a drawer on phones, with the theme switch and the live-connection indicator. One DOM serves all three sizes; only `bundle.css` switches between them.

**Anatomy.** **DOM (one markup for every size), children of `.pp-app`:** `aside.pp-side` (brand, `nav.pp-nav`, `.foot`), `header.pp-phone-top`, `main.pp-main`, `nav.pp-bottomnav` and `div.pp-drawer-backdrop[hidden] > div.pp-drawer`. Every nav link is `<a data-tip="Label">icon<span class="lbl">Label</span></a>`; the brand is `<span class="ini">M</span><span class="full">Meels 3D</span>`; icon-only buttons in the footer keep an `aria-label` and a `<span class="lbl">`. **Desktop (901px and up):** 220px sidebar (`surface`, `border` right edge): studio name (or uploaded logo) in `heading-lg`, nav list with 20px Lucide icons: Dashboard (layout-dashboard), Openstaand (clock), Facturen (receipt), then the group "Beheer" for Admins: Deel-links (link), Toegang (shield), Gebruikers (users), Instellingen (sliders-horizontal), and API-docs (book-open). **Facturen and API-docs are visible to Admin and Editor, not to User** (2.16, GAP-173); a User's nav is Dashboard and Openstaand. Footer: user badge with role, "Thema" (cycles Systeem, Licht, Donker), "Uitloggen", LiveIndicator. The current page has `aria-current="page"` and a `primary-tint` ground. **Tablet (481–900px, `@media (max-width:900px)`):** `.pp-app` becomes `56px | 1fr`; `.pp-side` is an icon rail: the brand shows the first letter in a 40px tile (`.ini`), labels (`.lbl`) are visually hidden but stay in the accessibility tree, the group heading "Beheer" becomes a hairline, the footer shows only the avatar initials, two icon buttons and the live dot, and each nav link shows its `data-tip` as a tooltip (`pp-tip` look: `text-strong` ground, `bg` text) on hover and keyboard focus. **Phone (480px and below, `@media (max-width:480px)`):** `.pp-side` is hidden, `.pp-phone-top` (menu button, studio name, live dot; sticky) and `.pp-bottomnav` (Dashboard, Openstaand, Facturen, Meer; sticky, 56px) appear and `.pp-app` becomes a column; `.pp-main` padding drops to `space-4`, page titles use `heading-xl`, `.pp-stats` shows two columns, controls grow to 44px. "Meer" and the menu button open the drawer: remove `hidden` from `.pp-drawer-backdrop`; `.pp-drawer` is 280px (max 85% of the screen), items are 48px high, with the same Beheer group, the user badge, Thema and Uitloggen at the bottom; the backdrop uses `overlay`. **The app never sets a `.phone` class**: the media queries above carry the phone layout. The `.pp-device.rail` and `.pp-device.phone` containers in these previews only force the same rules at a fixed width. No horizontal page scroll.

**Tokens.** `surface`, `border`, `primary-tint`, `primary-tint-soft`, `text`, `text-strong`, `bg`, `muted`, `overlay`, `shadow-lg`, `text-lg`, `leading-md`, `leading-xs`, `space-*`, `radius-*`.

**States.** Nav item default, hover, current, focus-visible (tooltip in the rail); drawer open and closed; live and reconnecting (the indicator changes; a toast announces the loss once).

**Accessibility.** `<nav aria-label="Hoofdmenu">`; skip link "Naar inhoud" before the nav; the drawer is a modal dialog (`role="dialog" aria-modal="true"`) with focus trap and Esc; in the rail the visually hidden `.lbl` keeps the accessible name and the tooltip is also shown on focus; icon-only buttons keep `aria-label`; all touch targets are 44px at 480px and below.

**Dutch copy.** Dashboard | Openstaand | Facturen | Beheer | Deel-links | Toegang | Gebruikers | Instellingen | API-docs | Meer | Thema | Uitloggen | Naar inhoud | Menu

**Logo (1.5).** When a logo is uploaded in Instellingen (PNG or SVG, max 1 MB; the app stores and serves a PNG) it replaces the studio name: in the sidebar (`pp-brand has-logo` with `<img class="logo pp-logo" alt="{studionaam}">`, at most 32px high, `object-fit: contain`, never wider than the sidebar), in the phone top bar (`<img class="pp-logo">`, at most 24px high, centred where the name was) and at the top of the drawer. The icon rail keeps the initial tile because 56px is too narrow for a logo. Without a logo, or while it loads or fails, the studio name shows as before. The `alt` text is the studio name. The same logo replaces the name on documents and the share page.

**1.9.** (2026-10-07) **Theme control icon (GAP-065, resolved).** The icon shows the **current** state: `monitor` for Systeem, `sun` for Licht, `moon` for Donker (Lucide, 20px like the other footer items). The accessible name names the state and the next one: "Thema: Systeem. Wissel naar Licht." (and "Thema: Licht. Wissel naar Donker.", "Thema: Donker. Wissel naar Systeem."); the visible label stays "Thema" (hidden in the rail and the drawer shows it next to the icon). Cycle order: Systeem, Licht, Donker, Systeem. The iconography table gains the three icons. **Sticky sidebar (GAP-063, confirmed as built, your decision).** On tablet and desktop the sidebar is `position: sticky; top: 0; height: 100vh; overflow-y: auto` (`align-self: start`): it never scrolls with the page, the page scrollbar stays on the page, and the footer (theme, log out, user) stays reachable on any page height thanks to `margin-top: auto`; if the viewport is lower than the nav plus footer, the sidebar scrolls inside itself. The phone has no sidebar (top bar, bottom navigation, drawer). **Dutch copy (new).** Thema: {stand}. Wissel naar {volgende}. | Systeem | Licht | Donker.

**2.10.** (2026-10-17) **Wachtrij joins the nav, and the phone's bottom bar stays at four (GAP-124).** A new item **Wachtrij** (`inbox`, Lucide) sits **between Dashboard and Openstaand**: what is coming, what is here, what is owed. The same icon carries the page's empty state, so the page has one mark.

- **Desktop sidebar and tablet rail:** second item, `data-tip="Wachtrij"` like every other, nothing else changes.
- **Phone bottom bar: Wachtrij takes Facturen's slot and Facturen moves into "Meer".** The bar keeps **four** items — Dashboard, Wachtrij, Openstaand, Meer — because five at 360px is 72px apiece and the 44px rule is not the only thing that matters at that width; a fifth item would also make the bar the widest thing on the page. The choice between the two is about frequency, not importance: the queue is the page the owner would open daily (it exists because ten jobs were otherwise being remembered), and making an invoice is periodic. Facturen keeps its drawer item and its sidebar place on every other width.
- **Roles:** Wachtrij is visible to Admin and Editor. **Not to User** — a User sees only the klanten they were granted and never cost or notes, and a queue of the owner's own unstarted work is neither of those things.

**Dutch copy (new).** Wachtrij.

**2.14.** (2026-10-18) **A visitor with a deel-link gets this shell without its chrome (GAP-165, the owner's decision).** A deel-link is a key now: a valid token mints an anonymous read-only session for one klant and the visitor walks the real screens (**ScreenShareSession**). The shell they get is this one — same `main.pp-main`, same screens inside it — with the sidebar, the icon rail, the drawer and the bottom bar replaced by **one head bar**, because a visitor has no account, no stored preference, nothing to log out of and only two destinations.

**DOM, one markup at every size:** `div.pp-app.guest > header.pp-guesthead + main.pp-main`. The head holds, in order: `div.pp-brand` (the uploaded logo as everywhere else, else the company name, else "3D Prints Portal"), `nav.pp-guestnav[aria-label="Hoofdmenu"]` with **two** `<a>` items — **Overzicht** (`list`) and **Prints** (`layout-dashboard`) — and a ghost `pp-btn-sm` **"Sessie afsluiten"** (`log-out`). `.pp-main` is capped at 1080px and centred; the Overzicht keeps its own 560px `.pp-share-col` inside it.

**Nothing else from the operator's footer survives.** No avatar and no role name (there is no account), **no "Thema"** (a preference we cannot carry to the visitor's next tap on the same WhatsApp link — the session follows the system setting, as ScreenSharePage always has), no "Uitloggen", **no LiveIndicator and no offline bar** (both exist so an operator knows whether what he is editing is current). The reasons are tabled in ScreenShareSession §1.

**Phone (480px and below) and its twin.** `.pp-guestnav` moves to its own full-width line as two equal tabs, each at least `--pp-tap` high; the brand and the exit button share the first line. The rule is written twice, as every phone rule in this system is since 2.11: once in the media query for the app, once as `.pp-device.phone .pp-guestnav` for a preview frame.

**New classes.** `.pp-app.guest`, `.pp-guesthead`, `.pp-guesthead > .pp-brand`, `.pp-guestnav`, `.pp-guestnav a`, `.pp-guestnav a[aria-current=page]`. The operator shell's own classes are untouched and nothing is renamed or removed.

**Accessibility.** One `<nav aria-label="Hoofdmenu">` as on every width of the operator shell; the skip link "Naar inhoud" stays; `aria-current="page"` marks the open screen; "Sessie afsluiten" opens a ConfirmDialog, because the only way back is a link the portal will not show again.

**A correction to this file's own preview, not a gap.** 2.10 put **Wachtrij** in the sidebar, the rail and the phone bottom bar (Facturen moving into "Meer") and the preview was never redrawn — it still showed the 2.9 nav in all four places. It is drawn now: Wachtrij between Dashboard and Openstaand in the sidebars, the rail and the drawers, and the bottom bar back to its specified four, **Dashboard · Wachtrij · Openstaand · Meer**. The README was right and the picture was four versions stale; when the two disagree the README is the spec, and a preview that contradicts it is a bug in the preview (2.11's rule, applied to a nav rather than a breakpoint).

**Still the User role's, and not decided here (proposed, needs your confirmation).** *(Answered in 2.16: it goes. GAP-173, resolved.)* Role **User** sees Dashboard, Openstaand and **API-docs**. I believe API-docs is wrong for a User for the same reason it is absent from a share session — a klant has nothing to call — but a User is an account holder and may have been given the docs deliberately. Say the word and the item goes behind the same role check as Facturen; **do not build it yet**.

**Dutch copy (new).** Overzicht | Prints | Sessie afsluiten.

**2.15.** (2026-10-18) **The guest head bar, after the owner used it (GAP-169, GAP-172, resolved).**
Two changes to the head this file drew in 2.14, both from his walk through a real session and the
app's measurements of it. Nothing about the operator's sidebar, rail, drawer or bottom bar changes.

**The nav is a track, because marking the current item marked nothing else.** `.pp-guestnav` is a
pill track — `surface-2`, `radius-pill`, `1px solid var(--border-strong)`, 2px padding — with the
two `<a>` items inside it and the current one a `primary-tint` pill. In a sidebar, `aria-current`'s
tint is enough; in a two-item head bar it leaves the unvisited destination without ink, and
`:hover` is not a cue on a phone. The items stay **links** with `aria-current="page"` inside one
`<nav aria-label="Hoofdmenu">` — no `aria-pressed`, no `role="group"`, no `role="tablist"`,
whatever the track looks like. Reasoning and the full markup: ScreenShareSession 2.15.

**The exit button is icon-only at 480px and below, and the brand keeps one line.** Measured in the
app: the head is 121px at a 16-character studio name, **153px from about 20** (the exit button
leaves the first line) and **177px at 48** (the brand wraps as well). So on the phone
`.pp-guesthead > .pp-brand` clips to one line with an ellipsis — the full name stays in the DOM and
in the accessibility tree, and a studio with a long name uploads a logo, which this head has drawn
since 2.14 — and **"Sessie afsluiten"** becomes a `--pp-tap` square with its label in a visually
hidden `<span class="lbl">`, exactly as the icon rail names its own footer buttons. Above 480px the
words stay. The head is then one height at every name length.

**New class** `.pp-guestexit` (on the exit button; `flex: none`, and what hides its `.lbl` on the
phone). **Changed classes** `.pp-guestnav`, `.pp-guestnav a`, `.pp-guesthead > .pp-brand` (phone).
**New markup obligation:** the exit button carries `.pp-guestexit` and a `<span class="lbl">` at
every width.

**Every nav link now draws the focus ring in the token (GAP-177, resolved).** `.pp-nav a`,
`.pp-bottomnav a` and `.pp-guestnav a` are plain `<a>` elements and were in none of `bundle.css`'s
focus-visible selectors, so the one visible keyboard cue in the whole shell was whatever the browser
drew — which is not `--focus-ring`, is not measured in `contrast.md`, and is the one thing axe cannot
report. `tokens.json` has said since 1.0 that the ring is drawn on **every** interactive element;
the sidebar, the drawer, the bottom bar and the guest head were the exception. Now:
`outline: 2px solid var(--focus-ring)` with a 2px offset on a sidebar or drawer link, and `-2px`
inside the bottom bar and inside the guest nav's track, where an outset ring would be clipped by the
bar's edge or the track's. No new token and no new colour pair (`focus-ring` on `surface` and on
`surface-2` are both in the report).

**Role User's nav and API-docs now has a number (GAP-173), and it is still his call.** *(Answered in 2.16: "api docs niet nodig voor rol User". Resolved; this paragraph is superseded.)* 2.14 put it
as a proposal with no id, so it could not be tracked: **GAP-173, proposed, needs your confirmation.
Do not build it.** My opinion is unchanged — a klant has nothing to call — but a User is an account
holder, and ScreenApiDocs is explicit that the page needs no credential because *"de documentatie
gebruikt je sessie"*: a User's own session therefore works on it, which is a reason the owner may
have meant to give it. One sentence from him closes it either way.

**2.16.** (2026-10-20) **API-docs is not role User's (GAP-173, resolved — the owner: *"api docs niet nodig voor rol User"*).**

**The item goes behind the same role check as Facturen.** Role **User**'s nav is **Dashboard and Openstaand**, in the sidebar, the rail, the drawer and the bottom bar — one condition, four surfaces, because they are one list. My reading was right and the reason it held is the plain one: a klant has nothing to call.

**And the half 2.15 did not say, which is the app's own correction and a good one: the list is the route table.** The nav and the routes are built from the same array, so the role check is also the guard — a User who types `/api-docs` lands on the dashboard rather than on a page the nav no longer offers. **A nav-only change would have been a hidden page, not a removed one**, and the system should say which of the two it means. It means removed. The same is true of Facturen and has been since 1.1; it is written down here now.

**No visual change for anyone else, no new token, class or copy key.** `nav.apiDocs` keeps its key and its words; it is simply not rendered for one role. The shortest nav this shell draws is now two items plus the footer, which is the shape the drawer and the bottom bar already handle (the bottom bar then shows Dashboard, Openstaand and "Meer").
