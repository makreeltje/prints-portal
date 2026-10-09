# Changelog 2.3

Resolves GAP-114 to GAP-117 and the open half of GAP-071 — the five that were left of 117. Four of them arrived running on placeholders the owner had approved; three of those placeholders are right in substance and get a class or a rule instead of a local fix, one is replaced, and one gap is confirmed exactly as built. Version 2.2 follows below.

| GAP | About | Decision | Status |
|---|---|---|---|
| GAP-071 | The render outline, the open half: may it be drawn on every thumbnail, including the 79 we only pass through? | **No** — and the rule moves rather than narrows. 2.0's sentence covered **2 prints of 83**; we do not rewrite a picture we did not make. The thumbnails are PNGs with transparency, so the page draws the outline from the alpha channel instead: `.pp-art`, four 1px `border-strong` drop-shadows, **3.69:1 light / 3.32:1 dark on `surface-2`** against a 3:1 requirement, in both themes, with no server work. `border-strong`'s usage text loses "baked into the PNG". Nothing was built for this half, so nothing is undone | **resolved** |
| GAP-114 | Two faults in 2.2's floating panels: `.pp-tip.at` does not reset `bottom`, and a popover is clipped by its card | Both mine. `.pp-tip.at` now sets `right:auto;bottom:auto`, **and** the anchored rules are wrapped in `:where()` — `.pp-anchor.end>.pp-tip` weighed three classes and beat `.at` outright, so resetting `bottom` alone would have left the x broken. An `.at` panel may **not** sit inside a `.pp-anchor`; the anchor's other, quiet job gets its own name, `.pp-lift`. The popover gains the window-placed form the tooltip had: `.pp-pop.at`, with `--pp-pop-x`/`--pp-pop-y`. "A card must not clip an open panel" is **rejected** (reason below) | **resolved** |
| GAP-115 | A spool control states the opposite of the truth: "Kies een spoel" while the print's spool is costing the slot | The system rule, not a one-off: **a control shows the value in force and names where it came from.** The trigger reads *swatch + name + `pp-hintchip` "van de print"* in normal ink; the placeholder is only for the case where nothing is in force. The chip moves **onto** the trigger and out of the swatch cell beside it, because provenance belongs on the control that can override the value. The built wording "van de print: {naam}" is replaced: the name is the value, the chip is the provenance. The print-level control gains a line saying what it is doing now (`spool.wholePrint.applies`) | **resolved** |
| GAP-116 | The owner overruled 2.0.1: the strip scrolls sideways at any count rather than wrapping — plus the correction that there are no per-model renders and no durations | The scroll direction is **the owner's, and built**; `.pp-models.wrap` is deprecated, not removed. The correction is the bigger half: with one image per *print*, every square would carry the same glyph and 68px of truncated name, which is the state GAP-094 complained about. New `.pp-models.compact` puts the glyph beside the name and gives the name the width, one form for all of a strip's buttons, ordered by file name with the timelapse last. The square form stays specified for the day a per-model render exists. Browser-read durations are **rejected**; the duration leaves the spec | **resolved** |
| GAP-117 | The file list sits between the operator and the price: 585px of a 1892px page, orders not starting until y=1257 | The owner's reorder is right and is built; what 2.3 adds is writing it down as **one order of blocks at every width**, so a desktop order and a phone order cannot drift again. The collapsible list, folding it into "Deze print", and capping its height with its own scroll are all **rejected**, each for its own reason (below). The system rule behind it is in `README.md`: a card that something important follows is capped; the last card on a page is as long as its content | **confirmed as built** |

## New and changed

- **Tokens:** none added, renamed or removed. `tokens.json` `version` is **2.3**. One **usage text** changed: `border-strong` loses the sentence about an ink baked into the PNG and names `.pp-art` instead. New `bundle.css` variable, next to `--pp-name-min`: `--pp-modelbtn-max` (**200px**, a value I chose and have asked you to measure). New allowed **inline data properties**, set from a measurement and never from a chosen value: `--pp-pop-x`, `--pp-pop-y`.
- **New classes** `.pp-lift`, `.pp-pop.at` (with `.at.end`, `.at.up`, `.at.end.up` and `.at.sheet`), `.pp-picker.at`, `.pp-tagpop.at`, `.pp-art`, `.pp-models.compact`.
- **Changed classes** `.pp-tip.at` (`right:auto;bottom:auto` — the bug), `:where(.pp-anchor)>.pp-tip`, `:where(.pp-anchor.end)>.pp-tip`, `:where(.pp-anchor.down)>.pp-tip` (same declarations, no specificity of their own), `.pp-share-thumb` (`position:relative`, so a picture can be placed in it), `.pp-device .pp-tip.at` and `.pp-device .pp-pop.at` (in a preview the device frame is the window). **Deprecated, kept, scheduled for removal in 3.0:** `.pp-models.wrap` and `.pp-models.wrap.is-overflow` (never applied), and the now-redundant flex `order` overrides on `.pp-main>.pp-pdfiles` / `.pp-main>.pp-pdnew` (they agree with the DOM order from 2.3 on).
- **Copy** `asset.spoolFromPrint`, `asset.spoolFromPrint.aria`, `spool.wholePrint.applies`, `spool.wholePrint.appliesNone`, `models.groupVideo`, `models.video`, `models.videoCaption`, `models.videoName`, `models.videoViewer`. The five `models.*` keys were named by 2.0 and never entered the deck — the same oversight `print.lacks*` had — and are recorded with the 2.3 wording, which drops `{duur}` from the video button's accessible name. All nine are in `copy-deck.md` under *Added in 2.3*. No key removed; `models.select` is unused since 2.0 and kept until 3.0.
- **Components changed:** Tooltip, Popover, SpoolPicker, SpoolSwatch, AssetListItem, ModelPicker, PrintCard, ScreenPrintDetail.
- **Previews changed:** Tooltip (the `.at` form in a clipping card, `.at.end`, and `.pp-lift` under a stretched card link), Popover (`.pp-pop.at` escaping a `pp-card pp-flush`), SpoolPicker (the four trigger states side by side, and the print-level control with its new line), ModelPicker (**rewritten**: the compact strip at 4 and at 34, the timelapse without a duration, phone, loading, video-only, and the square form kept as a specimen), PrintCard (the outline demo: black and white filament, with and without `.pp-art`), AssetListItem (the slicer slot with its chip moved onto the trigger, plus an inherited slot), ScreenPrintDetail (the file list moved after the orders in all four frames, labels reworded).
- **Pages changed:** `README.md` (points 6–8 of *Floating panels*, the new section *Three rules this round wrote down*, the inline-data-property list, *Versie 2.3*), `copy-deck.md`, `contrast.md`, `do-dont.md`.
- **Contrast report:** no new colour pair; four new **uses** of measured pairs are listed under *Added in 2.3*, with the two picture-against-ground figures (1.16:1 and 1.68:1) that are the reason the outline exists at all.
- **Breaking changes: none.** No token, class or copy key is renamed or removed. Two things the app must now do that it did not before: set `--pp-pop-x`/`--pp-pop-y` and re-measure or close an `.at` panel on scroll, and put `.pp-art` on the picture inside a thumbnail. Four placeholders can go: the tooltip's non-anchor wrapper keeps its behaviour but gets `.pp-lift`; the card that stopped clipping while a panel was open goes back to clipping; the "van de print: {naam}" chip changes shape; `wrap` stays unapplied, now by rule.

## What I rejected, and why

- **Outlining a thumbnail we did not make.** The only reading of 2.0 that would have changed anything, and it is a bigger step than the sentence implied: decoding, drawing over and re-encoding 79 files to change how they look on our ground, keyed to an alpha boundary the slicer chose, and redone whenever the ink changes. The page can draw the same outline from the same alpha channel, in a token, in both themes. The owner was right to stop and ask.
- **"A card must not clip an open panel."** Cheaper exactly once — in the card where the bug was found — and after that an obligation on every card in the system, including the ones that clip deliberately: `.pp-flush` exists so a full-bleed table keeps the card's rounded corners. It also fails whenever a panel is taller than its card, which is the ordinary case for a 302px picker in a file row. A panel's placement is the panel's problem.
- **A collapsible "Bestanden", and folding it into "Deze print"** (GAP-117, both the owner's questions). A disclosure charges a click on the page's own subject and has nothing left to protect now that the price is above the list. "Deze print" is deliberately facts without controls; the file list is downloads, spools, counts and badges. One card with two jobs would cost the only place on that page you can read without worrying what you might change. The implementer argued this and I agree with it — it is now a decision rather than an argument.
- **Capping the file list's height with its own scroll.** My own earlier proposal, correctly not built. Median 5 files, 17 prints over ten, largest 48: the cap does nothing for most prints, and where it fires it traps a scroll inside a card, hides rows from the browser's own find, and cuts the list at a height nobody asked for. Last on the page, it may be 48 rows long.
- **Reading video durations in the browser** to label the strip. It would fetch every video to draw a picker — a picker must not download the things it is picking between. The duration leaves the spec; if the indexer ever reads one server-side, only a copy key changes.
- **The Select above n models stays rejected** (2.0, 2.0.1), but not for the reason 2.0.1 gave. "Real pictures beat a list of names" rested on the withdrawn per-model-render measurement. The reason that survives: a Select hides the set you are choosing from, the thing GAP-094 asked to see, and the strip's compact form is now itself a list of names — with the current choice, the count and the type all visible at once.

## What I need you to measure

Both are values inside decisions that are otherwise settled. Build them as they stand; do not pick a number yourself.

- **GAP-071, the paint cost.** The longest tile grid you can render (83 tiles, and the same page at 360px) with `.pp-art` on every thumbnail, against the same page without it: frame time, or a scroll-jank figure, whichever your tooling gives honestly. Four chained drop-shadows is cheap per element and I have not measured it at 83. If it regresses visibly, say so and I will put a single `drop-shadow(0 0 1px)` halo on the grid and keep the four-shadow ring on the detail page — do not make that trade yourself, because a blurred halo is partly transparent and no longer measures 3.69:1. And: **is any thumbnail in the library fully opaque?** That decides whether the outlined-rectangle case is real or theoretical.
- **GAP-116, the button width.** The **longest and median model file-name length** in the library, in characters, and how wide the longest renders in mono `text-xs`. `--pp-modelbtn-max` is 200px because that holds about 28 mono characters; it is chosen, not measured. If your names run to 40 characters I raise it.

## Long cases drawn

The media strip at **34** pictures (33 models and a timelapse) as one scrolling line with the fading edge and the focusable region, and at the median 4; the same strip at 360px; a print with only a timelapse. The thumbnail outline on a black and on a white filament, with and without `.pp-art`, on `surface-2`. The window-placed tooltip and popover inside cards that clip, the popover with `--pp-pop-max` at 260px. The print detail at 1280, 980 and twice at 360px, each with the file list last. The slot rows with all four spool states.

## What I think is wrong in `implementation.md`

It is a round behind — you said so — and the detail you sent supersedes it. Two things in it that will still be wrong after a refresh unless they are corrected: it says **113 gaps logged, 13 open**, where this round's brief says 117 logged and 5 open; and under *Waiting on an answer I owe you* it lists **GAP-094 and GAP-096 as unbuilt with "the print detail still shows the 1.9 Select"**, which the GAP-116 correction contradicts — the strip is built, with no Select and no per-model pictures. Also: ModelPicker's own 2.0.1 note claimed "the preview shows it that way" about the wrapped strip, and that claim was true of the preview but is now withdrawn with the rule; and GAP-089 is recorded as settled with nothing left to do, which 2.3 does not change.

# Changelog 2.2

Resolves GAP-109 to GAP-113, the five gaps of this round. Three arrived built as placeholders the owner approved; two are bugs in rules of mine, found by measurement. Version 1.9 follows below — **2.0 and 2.1 were never written into this file**; their record lives in the component READMEs (PrintCard, AssetListItem) and is summarised in `README.md` under *Versie 2.0 and 2.1*.

| Gap | About | Result |
|---|---|---|
| GAP-109 | Missing-file icons give a tagless card an extra line | **confirmed as built**: the icons belong at the end of the `h3`, in inline flow; `bundle.css` now carries the glue rule (`.pp-print h3 .pp-lacks`) so the app can drop its marker, and the preview draws it |
| GAP-110 | The tooltip has no placement and 400ms is too slow | **resolved**: `.pp-anchor>.pp-tip` (above, `.end`, `.down`) plus the window-placed `.pp-tip.at` for a trigger inside anything that clips or scrolls; no delay; `aria-hidden` on a bubble that repeats the name is **confirmed**, with the two-case rule written down and the `title` attribute dropped |
| GAP-111 | The file row's name column collapses and the badge overflows | **resolved**: `minmax(var(--pp-name-min),1fr)` for the name and `minmax(0,auto)` for the controls, `--pp-name-min: 240px`, `.ord` no longer `nowrap`. The proposed one-line override (`minmax(0,auto)` alone) is **rejected**: with a 1fr column whose minimum is 0 the free space goes to the controls first and the name collapses to nothing |
| GAP-112 | A popover near the bottom falls off the screen | **resolved**: side per axis (`.up`/`.end`), height capped by `--pp-pop-max` with the panel's own region scrolling, and the sheet form under 240px of room (`.pp-anchor.sheet`). Flip *and* cap, not one of them; the rule is in `README.md` under *Floating panels* and carries menus, the tag editor and the date picker |
| GAP-113 | The tooltip reads as a sentence where a phrase would do | **resolved**: one visible short form, `print.lacks` = "Ontbreekt: G-code, 3MF en STL", used in both the bubble and the print-detail chip; the full sentence stays as the accessible name (`print.lacks.aria`). The split the placeholder built is right; the wording is unified so there is not a third form of the same fact |

## New and changed

- **Tokens:** none added, renamed or removed. `tokens.json` `version` is **2.2**. The two new lengths are `bundle.css` variables, next to `--pp-tap` and `--pp-control-h`, not tokens: `--pp-name-min` (240px, the file row's name-column floor). New allowed **inline data properties**, which the app sets from a measurement and never from a chosen value: `--pp-pop-max`, `--pp-tip-x`, `--pp-tip-y`.
- **New classes** `.pp-anchor.sheet` (the sheet form at any width), `.pp-tip.at` (with `.at.end`, `.at.down`), `.pp-anchor.down>.pp-tip`, `.pp-w-900` (preview helper).
- **Changed classes** `.pp-anchor>.pp-pop` (flex column, `max-height: var(--pp-pop-max, …)`, `overflow-y: auto`, `overscroll-behavior: contain`; its children do not shrink), `.pp-anchor>.pp-picker` and `.pp-anchor>.pp-tagpop` (the panel does not scroll, the inner region does — which keeps its 240px as a preferred height and shrinks below it only when the panel is capped, so a panel with room is unchanged), `.pp-anchor>.pp-tip` and `.pp-anchor.end>.pp-tip` (placement, `z-tooltip`, never hoverable), `.pp-asset` (the 760px container form: name floor, yielding controls), `.pp-asset .acts` (`min-width: 0`), `.pp-asset .ord` (wraps), `.pp-print h3 .pp-lacks` (new rule).
- **Copy** `print.lacks` (changed: "Ontbreekt: {types}", joined with ", " and " en ", now the bubble *and* the chip), `print.lacks.aria`, `print.lacks.item`, `print.lacks.type.gcode`, `print.lacks.type.3mf`, `print.lacks.type.stl`. All six are in `copy-deck.md` under *Added in 2.2*; the first three were named in 2.0/2.1 and had never reached the deck. No key removed.
- **Components changed:** Popover, Tooltip, SpoolPicker, TagEditor, OverflowMenu, AssetListItem, PrintCard.
- **Previews changed:** Popover (flipped, capped with 30 spools, sheet), Tooltip (above, `.end`, `.down`, and a real description with `aria-describedby`), PrintCard (the icons behind the name on a tagless card, a 33-character name, the tag row keeping "Geen spoel", the short form in bubble and chip — and the stale `--mix` demo of 1.9 removed, two versions after `--mix` left the contract), AssetListItem (the duplicate row in a 900px and a 768px container).
- **Pages changed:** `README.md` (new section *Floating panels*, plus the missing 2.0/2.1 record), `copy-deck.md`, `do-dont.md`, `contrast.md` (two rows reworded: the `bg` on `text-strong` pair is the tooltip bubble as well as the rail tip — it was only labelled for the rail).
- **Contrast report:** no new colour pair. Nothing changes colour this round: the bubble is the existing `.pp-tip` (`bg` on `text-strong`, 15.84 light / 16.08 dark) and the icons keep the 2.1 figures (`warning` on `surface` 6.11/10.84, on `primary-tint-soft` 5.46/9.53, on `primary-tint` 4.99/8.52, against a 3:1 requirement).
- **Breaking changes:** none. No token or class is renamed or removed. Two things the app must now do that it did not before: set `--pp-pop-max` and the side modifiers on every anchored panel, and set `--pp-tip-x`/`--pp-tip-y` on a tooltip that uses `.at`. A panel that sets neither still cannot be drawn off-screen in the horizontal axis, but it can be below the fold — the backstop cap is the window height, not the room below the trigger.

## What I rejected, and why

- **`minmax(0,auto)` for the controls column alone** (GAP-111's one-line override). It makes the measured case worse: grid gives free space to the `auto`-max track before an `fr` track whose minimum is 0, so the name column goes to zero instead of 75px. The floor on the name column is the part that does the work.
- **The bare-icon legend without words anywhere** stays rejected from 2.0, and 2.1's answer to it stays: icons on the card and the row, words on the print detail. GAP-113 does not reopen it; it only shortens the words.
- **Making the missing-file icon group focusable** so its tooltip is keyboard-reachable. It is a graphic with a text alternative, not a control, and a tab stop on every card that is missing a file — inside a stretched card link — costs more than it gives. Its words are on the print detail, which is the path that teaches them anyway.
- **A hover delay of any size.** 400ms was in the spec because tooltips elsewhere repeat a visible label; this one is the only explanation of a glyph. A tooltip that costs nothing to show costs nothing to show by accident.

## What I need you to measure

*All four came back the same day and all four values hold — see the Addendum below; nothing in this list is outstanding.*

None of the five decisions waits on a number; these verify them, and if one comes back wrong I change the value rather than you inventing one.

- **GAP-111, the floor.** The min-content width of the widest thing that can sit in the name column with `nowrap`: every badge it can carry ("Mogelijk dubbel" 128px measured, "Niet in een bestelling", "Bestand ontbreekt", "Op factuur {nummer}") at your real data. If any exceeds **240px**, tell me the number and I raise `--pp-name-min`; do not raise it yourself.
- **GAP-111, the sweep.** The **container** width of `.pp-assetlist` at window widths 900, 1400, 1700 and 2000. Your sweep is over window widths and the rule is a container query; broken at 900 and 1700 but correct at 1400 and 2000 cannot be monotone in the container, so I would like to know what the container actually does at 1700.
- **GAP-112, the floor of 240px.** How often, and where, the sheet form is reached: the natural height of the tallest anchored panel in the app (the tag editor with every tag, the column menu in Toegang, the spool picker with 30 spools) and the smallest viewport height you see in practice. If nothing ever reaches the floor it is a backstop; if the tag editor reaches it on a laptop, I want to know.
- **GAP-109 / 2.1's figures.** How many of the 83 cards carry missing-file icons. 2.1 says 58% of tiles carry nothing, which makes about 35 cards; your GAP-109 measurement says 10 cards carry icons, all 10 without tags. Both cannot be right, and the second is the one the owner sees. I have not changed anything on the strength of either.

## Addendum, same version (2026-10-08, after 2.2 was implemented)

Your four measurements came back and all four values hold, so **the version stays 2.2**: no rule, class, token or copy key changes below, and bumping the number would make you re-import a prose correction. What changed is the record.

**Measurements, answered.**

1. **The name-column floor holds.** Widest `nowrap` badges in that column: "Mogelijk dubbel" 128px, "Niet in een bestelling" 151px, "Op factuur {nummer}" 134px, asset status badge 139px. All under 240px, so `--pp-name-min` stays at 240px. (Side note for some round: the spec names a "Bestand ontbreekt" badge the app does not have.)
2. **Container widths — answered twice, and the first answer was withdrawn.** The first set (780 / 572 / 1326 / 1620) was derived rather than measured and the implementer retracted it; the explanation that came with it is withdrawn too. **Measured**, print-level / order-level, because since 2.0 a print detail holds **two** `.pp-assetlist` containers: window 900 → 796 / 794, 1400 → 1132 / 628, 1700 → 1432 / 794, 2000 → 1732 / 961. The **order list** is the narrow one and the only one whose `.acts` measures 651px; the print-level row carries a download, about 36px. These figures close the loose end exactly: 794 − 24 − 24 − 20 − 651 = **75px**, the name column first reported, at windows 900 *and* 1700; 628 is below the breakpoint so 1400 was in the two-row form; 961 leaves 242px, two pixels clear of this gap's floor, which is why 2000 looked correct. The sweep was monotone all along — in a container nobody had measured. The implementer's verified 486px of controls corroborates 794 and rules out 780 (which would give 472px).
3. **The sheet floor is unexercised.** Panels measure 302px (30-spool picker), 136px (tag editor, two tags), 96px (column menu); on a 760px viewport a low picker is offered 348px, so parts 1 and 2 of the rule cover everything this machine can produce and part 3 would first bite near 560px of viewport height. It stays in as the backstop, and Popover's README now says plainly that it is specified rather than verified.
4. **The count conflict was 2.1's error, not a conflict.** 58 is a count: 58 of 83 prints carry nothing, 20 carry one type, 3 two, 2 three — so **70%** carry nothing and 25 of 83 carry icons, which is what 2.0 said. 2.1 wrote the count as a percent and sized the icon form against "58%". Corrected in PrintCard's README, where the per-type figures already reconciled with the counts (20×1 + 3×2 + 2×3 = 32 = 18 + 7 + 7). The "10 cards carry icons, all without tags" measurement is the icon-carrying cards among the 24 the dashboard's first page renders — a page, not a sample — and GAP-109's 2.2 note now says so.

**Corrected in my own files**, both reported by the implementer: `README.md` opened with "This is version 1.9" and now says 2.2, and the duplicated "## Versie 1.7" section is gone.

**Accepted without change:** the two hooks write the measurement onto the element instead of through React state. The contract is the modifiers and the two data properties; how the app gets them there is theirs, and refusing to render twice to reach the same pixels is right.

**The overflow risk my own fix creates, exercised.** Letting the controls track shrink means a control that cannot shrink will overflow it, and `.pp-spoolbtn` does not truncate. Measured on a print with spools assigned: 29 spools, longest name 35 characters, widest trigger 216px, zero rows overflowing at window 1700; and at the 760px breakpoint the controls track still gets 452px against a 216px widest control. Real in principle, unexercised rather than disproved. No gap logged for a number nobody can produce.

**Still the owner's to settle:** GAP-113's wording. "Ontbreekt: G-code, 3MF en STL" is built in both places; if they prefer "Geen G-code, 3MF en STL", both places change together and nothing else does.

## Long cases drawn

The duplicate file row in a 900px container (the width where the name column was 75px) and in a 768px one; the spool picker with 30 spools flipped above its trigger and again capped at 210px with the list scrolling and the search field in place; the same picker as a sheet; a tagless card with one icon, a three-icon card, a 33-character name with icons behind it, and a card whose tag row still carries "Geen spoel"; the tooltip above, right-hanging and below.

# Changelog 1.9

Resolves GAP-062 to GAP-087 (26 gaps from the walkthrough of app 1.0.0). Version 1.8 follows below.

| Gap | About | Result |
|---|---|---|
| GAP-062 | Checkbox hops 4.5px when ticked | **confirmed as built**: `vertical-align: top` on `.pp-opt` is now in `bundle.css` |
| GAP-063 | Sidebar footer unreachable on tall pages | **confirmed as built**: `.pp-app>.pp-side` is sticky, `100vh`, `overflow-y:auto`; the page scrollbar stays on the page |
| GAP-064 | Viewer 4:3 and 1090x830 | **resolved**: `.pp-viewer.fluid` caps at 560px (420px high); no model is `pp-viewer is-empty`, a 72px strip |
| GAP-065 | Theme control always a moon | **resolved**: icon shows the current state (monitor, sun, moon); accessible name names state and next state |
| GAP-066 | No sort and no status filter | **resolved**: Sorteren and Status Selects in FilterBar, server-side, in the URL |
| GAP-067 | Klant strip grows without limit | **resolved** (your decision): one scrollable chip row on all widths plus "Overzicht" dialog with the tiles; about 56px |
| GAP-068 | No thumbnail in the list view | **resolved**: 40px `pp-thumb sm` first column in PrintRow, rule for the phone block |
| GAP-069 | Bulk bar not sticky above 480px | **resolved**: sticky at every width (`bottom: space-4` floating, flush on phones) |
| GAP-070 | Only the klant name is clickable | **confirmed as built, whole tile** (stretched button, `aria-pressed`, controls above it) |
| GAP-071 | Dark tint swallows the model | **proposed, needs your measurement**: `--mix` floor towards `border-strong` (40% minimum); I need the model/ground ratio |
| GAP-072 | Subtitle repeats the print name | **proposed, needs your confirmation**: klant alone when the project equals the print name; share page shows the date |
| GAP-073 | "Kosten ontbreken" twice | **resolved**: PaymentPanel line is official; the cost card says "Onvolledig" and names the missing input |
| GAP-074 | Order block nests three cards | **resolved**: one order card, sections with hairlines; 360, 768 and 1280px drawn |
| GAP-075 | Verwijderen too prominent | **resolved** (your decision): OverflowMenu "⋯" on the print detail and the klant tile; ConfirmDialog stays |
| GAP-076 | Missing cost has no link to the setting | **resolved**: `pp-missing` line "Geen vermogen voor {printer}." with link; "Vermogen ontbreekt" badge in Printers |
| GAP-077 | Share page shows the internal label | **resolved** (your decision): label dropped, header studio, klant, expiry; dialog says it is internal |
| GAP-078 | Share page gives no payment instructions | **resolved** (your decision): "Betalen" block with IBAN, t.n.v., bedrag, kenmerk and contact, copy buttons |
| GAP-079 | No thumbnails on the share page | **resolved** (your decision): 48px neutral `surface-2` thumbnail per line, no tint |
| GAP-080 | Openstaand is one long list, age invisible | **resolved** (your decision): collapsed groups, age badge in three steps (30 and 90 days), max 10 lines then "Toon alle"; thresholds to be measured |
| GAP-081 | Deel-links cannot be filtered, duplicates | **resolved**: Actief / Inactief / Alle, numbered duplicate suffix, create warning; "shown once" line once per page (deviation) |
| GAP-082 | No payment status on invoices | **resolved**: Status column with Betaald / Open / Deels betaald / Afgeschreven, creditnota "—"; preview **rejected** (browser viewer) |
| GAP-083 | Settings saves without unsaved warning | **resolved** (your decision): per section, "Niet opgeslagen" marker, Opslaan only when dirty, leave confirmation |
| GAP-084 | Card around Scalar | **resolved**: no card; the renderer meets the page padding; rule point 5 for third-party renderers |
| GAP-085 | No video player or thumbnail | **resolved with a new component**: VideoPlayer (dialog, poster, states, mkv fallback), poster as thumbnail with play badge |
| GAP-086 | Only one model viewable | **resolved with a new component**: ModelPicker (strip up to 6, Select above, caption "Model n van m") |
| GAP-087 | Loss of connection announced twice | **resolved**: bar is the state, loss toast dropped, "Weer verbonden." toast kept |

## Decisions you made (asked in this round)
GAP-077 label is internal; GAP-078 payment block with IBAN, t.n.v., bedrag, kenmerk and contact; GAP-079 neutral thumbnail ground; GAP-063 sticky sidebar; GAP-080 collapsed groups and age steps; GAP-067 one scrollable chip row; GAP-075 overflow menu; GAP-083 per-section save with a changed state.

## Defaults I chose; please confirm or change
- **GAP-072** (shown as proposed): klant alone when the project equals the print name. It changes what the card's second line means.
- **GAP-070**: whole tile as the control; **GAP-073**: PaymentPanel's sentence is official; **GAP-087**: bar kept, loss toast dropped; **GAP-065**: icon shows the current state; **GAP-069**: sticky at every width.
- **GAP-066**: five sort options, six status options (the ones you listed), both server-side.
- **GAP-081**: "shown once" is one line on the page, not on every row (deviation). **GAP-082**: no in-app invoice preview.
- **GAP-064**: cap of 560px; **GAP-086**: strip up to 6 models, Select above that.

## What I need you to measure
- **GAP-080:** days-open distribution of the open lines (thresholds 30 and 90).
- **GAP-071:** the rendered model colour and the ground colour of a black and a dark-purple thumbnail after the change (aim 3:1).
- **GAP-086:** how many models a print holds (largest and median).
- **GAP-085:** how many prints are video-only, and how many videos are `.mkv`.
- **GAP-064:** the y-position of the price field at 1360x900 and 390x844.

## Long screens drawn at real size
Openstaand with 90 lines and 10 klanten (desktop and 360px, collapsed and one group open); the dashboard strip with 20 klanten at 1280 and 360px, plus the overview dialog with 20 tiles; the print detail at 360px with and without a model; the order block at 360, 768 and 1280px. Checked for horizontal overflow; the only flags are the known preview artefacts.

## New and changed
- **Tokens:** none added, renamed or removed. New allowed inline data property: `--mix` (thumbnail tint floor).
- **New components:** ModelPicker, VideoPlayer, OverflowMenu.
- **New classes:** `pp-sharepay`, `pp-sharepay-row`, `pp-share-lead`, `pp-share-thumb`, `pp-models`, `pp-modelbtn`, `pp-model-cap`, `pp-video`, `pp-play`, `pp-menu`, `pp-missing`, `pp-strip`, `pp-allcust`, `pp-ogrp` (with `-bar`, `-more`, `-list`), `pp-sl-tools`, `pp-sec-hd`, `pp-sec-ft`, `pp-theme`, `pp-warnico`, `pp-scrollframe`, helpers `pp-w-160`, `pp-w-720`, `pp-w-768`, `pp-w-1280`, modifiers `is-empty` (viewer), `poster` and `sm` (thumb), `is-overflow` (chips), `sel` (filter selects), `dup`.
- **Changed classes:** `.pp-viewer.fluid` (560px cap), `.pp-order` family (flattened cards, sections), `.pp-cust` and `.pp-cust-name` (whole tile), `.pp-bulk` (sticky at every width), `.pp-opt` (`vertical-align: top`), `.pp-app>.pp-side` (sticky), `.pp-thumb.tinted` (`--mix` floor, inset ring), `.pp-dialog h2` (`min-width: 0`).
- **Components changed:** ScreenSharePage, ScreenShareLinks, ShareLinkRow, Viewer3D, OrderSection, CostBreakdown, PaymentPanel, AssetListItem, ScreenPrintDetail, CustomerCard, CustomerChips, FilterBar, BulkActionBar, PrintRow, PrintCard, ScreenDashboard, AppShell, Checkbox, ScreenApiDocs, Toast, ScreenSystemStates, LiveIndicator, OutstandingGroup, ScreenOutstanding, ScreenInvoices, ScreenSettings.
- **Contrast report:** seven new pairs, 143 in all, 0 fail.
- **Copy deck:** "Added in 1.9" (about 90 keys); one removed (the loss toast).

## Breaking changes
- **Visual only, no renamed or removed names:** the viewer on the print detail shrinks from unbounded to 560px; cards inside an order are flattened by CSS; the dashboard no longer shows the klant card strip on the page (the tiles moved into the overview dialog) and the klant tile has no delete icon; a klant tile and a print have a changed second line (GAP-072, if confirmed); Openstaand groups are `<details>` and their group actions moved from the header into the body.
- **App changes needed:** the share-page header and PDF title drop the label; the loss-of-connection toast is removed.

---

# Changelog 1.8

Resolves GAP-060 and GAP-061. Version 1.7 follows below.

| Gap | Result |
|---|---|
| GAP-060 ScreenApiDocs: Scalar's endpoint list not reachable by keyboard on a phone | **confirmed as built, and generalised.** The app makes every scrollable-but-unfocusable region of the renderer a labelled, focusable region (`tabindex="0"`, `aria-label` = `api.title`), `role="region"` on generic elements only (never on a list), removed again when it stops scrolling. Written into the ScreenApiDocs README together with a four-point rule for screens drawn by a third-party renderer. Verified by the app at 360px; I have not run Scalar myself |
| GAP-061 Contrast report: translucent over translucent | **resolved.** `contrast.md` has a table *Translucent token inside a translucent row* (the four state tints over row hover and selected row, both themes) and a rule. The table shows that the nested composite would fall below AA in several light pairs (for example `unpaid` 4.10 on a selected row, 4.44 on a hovered row; `paid` 4.41 and `info` 4.33 on a selected row; dark `unpaid` 4.12 on a selected row), so badges now carry an opaque `surface` base: their ground is `surface` in every row state |

## Decisions
- **Badges on tinted rows (your choice):** the tint sits on an opaque `surface` base, so a badge on a hovered, selected or `surface-2` row is a slightly lighter pill and always measures like a badge on `surface` (4.93 to 5.33 light). This also settles the open v1.7 finding about light `unpaid` and `warning` badges over `surface-2` (4.29 and 4.32) without a token change.
- **Your app measurement and mine differ.** You measured 4.98 and 4.97 on a hovered row, because in the app the hover tint does not lie under the badge. The design system's own selected table row (`.pp-table tr.is-selected td`, `primary-tint`) does put the tint under a badge, and your measurement did not cover a selected row. The opaque base makes the result independent of that structure.
- **Region name:** `api.title` stays as the accessible name; `api.endpoints` ("Lijst met endpoints") is an optional improvement, not added.

## New and changed
- **Tokens:** none added or changed.
- **Changed classes:** `.pp-badge.paid/.unpaid/.warning/.info`, `.pp-hint` and the hint inside `.pp-money` (background is the tint over an opaque `surface` base; look: only on tinted grounds).
- **Contrast report:** new nested table and rule. 129 paired checks, 0 fail.
- **Components changed:** StatusBadge (preview with a selected row, README), ScreenApiDocs (README: GAP-060 and the third-party renderer rule).
- **Copy:** none (optional `api.endpoints`).

## Breaking changes
- None. Visible change: badges on a hovered, selected or `surface-2` row are a slightly lighter pill than before.

---

# Changelog 1.7

Resolves GAP-054 and GAP-056 to GAP-059. Version 1.6 follows below.

| Gap | Result |
|---|---|
| GAP-056 ScreenApiDocs: Swagger UI or Scalar | **resolved: Scalar is official, Swagger UI is dropped.** Scalar 0.9.78 with `theme: "none"`; the complete variable mapping (every one of the 102 declared variables plus the three `button-1` ones) is in the ScreenApiDocs README and shipped as `.pp-scalar` in `bundle.css`; preview of the themed result in both themes; the three unused Swagger classes are removed |
| GAP-059 Contrast report does not name the ground | **resolved:** `contrast.md` has a Ground column on every pair, a table *Translucent tokens over every ground* (7 tokens, 3 grounds, 2 themes) with the grounds each is approved over, and a rule at the top. Real alpha values are used |
| GAP-054 `.pp-lockhelp` does not wrap | **resolved:** `flex-wrap: wrap`; column layout at 480px and below; checked at 360px |
| GAP-057 First-run folder diagram wraps | **resolved:** `.pp-tree` is `nowrap`; it sits in `.pp-scroll` (focusable, labelled region); verified at 360px |
| GAP-058 ScreenAccess empty state | **confirmed as built:** EmptyState "Nog geen gebruikers om toegang te geven" with link "Naar Gebruikers"; previews desktop and phone |

## Decisions
- **Scalar mapping.** Colours: GET `info`, POST `paid`, PUT `warning`, DELETE `unpaid`; text `text-strong`, `text`, `muted`; grounds `surface`, `surface-2`, `bg`. Where I changed what the app built: `--scalar-background-accent` is `primary-tint-soft` (was `primary-tint`, which fails AA over `surface-2` in the light theme); `--scalar-background-alert` and `-danger` are `warning-tint` and `unpaid-tint` (they defaulted to solid orange and red); `button-1`, `-color` and `-hover` are mapped (primary buttons, not black or white); links follow `.pp-link`; borders are 1px; Scalar's 10px text becomes `text-xs` (12px); radius, text, leading and shadow follow our scales. Structural variables (header and address-bar height, brightness, tooltip padding, text-decoration colours, font weights) keep Scalar's value.
- **The dump list is incomplete.** The section "Still on a value of their own" of the Scalar dump leaves out `--scalar-button-1`, `--scalar-button-1-hover` and the literal heading, line-height, paragraph and size variables of the group "other". All of them are decided in the README mapping now. Regenerate the dump after a Scalar upgrade and compare.
- **Open question (new, from the matrix):** where do badges on `surface-2` occur in the app? If they do, the light `unpaid` and `warning` tokens need a slightly darker value, or those rows use `surface` instead.
- **Check in the app:** the callouts that use `--scalar-background-alert` and `-danger` (text colour on the tint) and the `Test request` button.

## New and changed
- **Tokens:** none added or changed.
- **Contrast report:** new column Ground, new table of translucent tokens over `bg`, `surface` and `surface-2`; alphas are the real ones from `tokens.css` (until 1.6 rounded: .08, .14, .20; no verdict changed). Not approved (below 4.5:1; light theme unless noted): `primary` on `primary-tint` over `surface-2` (4.34); `muted` on `primary-tint` over `surface-2` (4.27); `primary` on `primary-tint-strong` over `bg` (4.26) and `surface-2` (3.98), and in dark over `surface-2` (4.05); `unpaid` on `unpaid-tint` over `surface-2` (4.29); `warning` on `warning-tint` over `surface-2` (4.32). Everything else is approved over all three grounds. **New finding, not changed in 1.7:** the last two mean a light Open or missing-data badge is below AA when it sits on a `surface-2` ground (for example a hovered table row or a table header). Fixing it needs either darker `unpaid` and `warning` text colours in the light theme (a token change) or a rule that these badges never sit on `surface-2`; please decide (see the open question below). 129 paired checks, 0 fail.
- **New classes:** `.pp-scalar` (variable mapping), `.pp-sc`, `.pp-sc-side`, `.pp-sc-search`, `.pp-sc-grp`, `.pp-sc-main`, `.pp-sc-op`, `.pp-sc-m`, `.pp-sc-code`, `.pp-sc-note`, `.pp-sc-btn` (illustration of the themed renderer in the preview only).
- **Changed classes:** `.pp-lockhelp` (wrap, column at 480px), `.pp-tree` (nowrap, `width: max-content; min-width: 100%`).
- **Components and screens changed:** ScreenApiDocs (preview and README rewritten), AssetListItem, AccessMatrix, ScreenAccess, ScreenSystemStates.
- **Copy:** `access.empty.title`, `access.empty.body`, `access.empty.link`, `api.title`, `api.noLoginField`, `api.search`, `api.testRequest`, `api.loadErrorBody` (changed text: "De documentatie kon niet worden opgehaald. Probeer het opnieuw.").

## Breaking changes
- `.pp-api-head`, `.pp-api-row` and `.pp-method` are removed from `bundle.css` (added in 1.6 for the Swagger layout; unused in the app).
- The `ds-gap: GAP-056`, `GAP-057` and `GAP-058` markers can come out; GAP-056 can use `.pp-scalar` instead of the app's `.app-api` block.

---

# Changelog 1.7

Resolves GAP-054 and GAP-056 to GAP-059. Version 1.6 follows below.

| Gap | Result |
|---|---|
| GAP-056 ScreenApiDocs: Swagger UI or Scalar | **resolved: Scalar is official, Swagger UI is dropped.** Scalar 0.9.78 with `theme: "none"`; the complete variable mapping (every one of the 102 declared variables plus the three `button-1` ones) is in the ScreenApiDocs README and shipped as `.pp-scalar` in `bundle.css`; preview of the themed result in both themes; the three unused Swagger classes are removed |
| GAP-059 Contrast report does not name the ground | **resolved:** `contrast.md` has a Ground column on every pair, a table *Translucent tokens over every ground* (7 tokens, 3 grounds, 2 themes) with the grounds each is approved over, and a rule at the top. Real alpha values are used |
| GAP-054 `.pp-lockhelp` does not wrap | **resolved:** `flex-wrap: wrap`; column layout at 480px and below; checked at 360px |
| GAP-057 First-run folder diagram wraps | **resolved:** `.pp-tree` is `nowrap`; it sits in `.pp-scroll` (focusable, labelled region); verified at 360px |
| GAP-058 ScreenAccess empty state | **confirmed as built:** EmptyState "Nog geen gebruikers om toegang te geven" with link "Naar Gebruikers"; previews desktop and phone |

## Decisions
- **Scalar mapping.** Colours: GET `info`, POST `paid`, PUT `warning`, DELETE `unpaid`; text `text-strong`, `text`, `muted`; grounds `surface`, `surface-2`, `bg`. Where I changed what the app built: `--scalar-background-accent` is `primary-tint-soft` (was `primary-tint`, which fails AA over `surface-2` in the light theme); `--scalar-background-alert` and `-danger` are `warning-tint` and `unpaid-tint` (they defaulted to solid orange and red); `button-1`, `-color` and `-hover` are mapped (primary buttons, not black or white); links follow `.pp-link`; borders are 1px; Scalar's 10px text becomes `text-xs` (12px); radius, text, leading and shadow follow our scales. Structural variables (header and address-bar height, brightness, tooltip padding, text-decoration colours, font weights) keep Scalar's value.
- **The dump list is incomplete.** The section "Still on a value of their own" of the Scalar dump leaves out `--scalar-button-1`, `--scalar-button-1-hover` and the literal heading, line-height, paragraph and size variables of the group "other". All of them are decided in the README mapping now. Regenerate the dump after a Scalar upgrade and compare.
- **Check in the app:** the callouts that use `--scalar-background-alert` and `-danger` (text colour on the tint) and the `Test request` button.

## New and changed
- **Tokens:** none added or changed.
- **Contrast report:** new column Ground, new table of translucent tokens over `bg`, `surface` and `surface-2`; alphas are the real ones from `tokens.css` (until 1.6 rounded: .08, .14, .20; no verdict changed). Not approved: `primary` text on `primary-tint` over light `surface-2` (4.34) and over `primary-tint-strong` over `bg` and `surface-2`, and `muted` text on `primary-tint` over light `surface-2` (4.27). 129 paired checks, 0 fail.
- **New classes:** `.pp-scalar` (variable mapping), `.pp-sc`, `.pp-sc-side`, `.pp-sc-search`, `.pp-sc-grp`, `.pp-sc-main`, `.pp-sc-op`, `.pp-sc-m`, `.pp-sc-code`, `.pp-sc-note`, `.pp-sc-btn` (illustration of the themed renderer in the preview only).
- **Changed classes:** `.pp-lockhelp` (wrap, column at 480px), `.pp-tree` (nowrap, `width: max-content; min-width: 100%`).
- **Components and screens changed:** ScreenApiDocs (preview and README rewritten), AssetListItem, AccessMatrix, ScreenAccess, ScreenSystemStates.
- **Copy:** `access.empty.title`, `access.empty.body`, `access.empty.link`, `api.title`, `api.noLoginField`, `api.search`, `api.testRequest`, `api.loadErrorBody` (changed text: "De documentatie kon niet worden opgehaald. Probeer het opnieuw.").

## Breaking changes
- `.pp-api-head`, `.pp-api-row` and `.pp-method` are removed from `bundle.css` (added in 1.6 for the Swagger layout; unused in the app).
- The `ds-gap: GAP-056`, `GAP-057` and `GAP-058` markers can come out; GAP-056 can use `.pp-scalar` instead of the app's `.app-api` block.

---

# Changelog 1.6

Resolves GAP-047 to GAP-053 and cleans the two milestone 9 previews (ScreenSystemStates, ScreenApiDocs). Version 1.5 follows below.

| Gap | Result |
|---|---|
| GAP-053 Share page and PDF: totals read "€ 0,00" with no prices | resolved: with no priced line the totals card (page) and totals block (PDF) are left out; list, "Prijs volgt", footnote and "Download overzicht" stay; "Er staat niets open." wins with "Alleen openstaand" on; the PDF footer then has no payment instruction. Previews added to ScreenSharePage and DocOverview |
| GAP-052 ShareLinkRow columns shift without Intrekken | resolved: last column fixed at `--pp-share-act: 88px` (no subgrid), also at 900px and below |
| GAP-047 DatePicker calendar button | confirmed as built, specified: `.pp-iwrap>.pp-btn.r` ghost icon button, label "Kies een datum", click in the field does not open the calendar; previews of DatePicker and ScreenInvoiceExport now show the button |
| GAP-048 Locked order controls | confirmed as built (visible `pp-help` line with `aria-describedby` instead of a tooltip, as you reasoned); added decision: "Spoel voor de hele print" skips locked orders and names the reason; locked previews in AssetListItem and CostBreakdown, rules in OrderSection, PaymentPanel and ScreenPrintDetail |
| GAP-049 "Geldig tot" without expiry | confirmed as built: row left out; preview added |
| GAP-050 Close TokenReveal without copying | confirmed as built: ConfirmDialog "Sluiten zonder kopiëren?" with "Terug" and "Sluiten"; preview added |
| GAP-051 Day counts 0 and 1 | confirmed as built: ICU plurals and "Vandaag", "morgen"; previews in ShareLinkRow and ScreenSharePage |
| M9 inline values | resolved: no layout `style` is left in ScreenSystemStates and ScreenApiDocs (only the data property `--w`); loading and error states added |

## Decisions applied
- **Share page and PDF:** one line per order; archived prints stay; written-off orders and deleted prints never appear; header shows logo, else company name, else "3D Prints Portal"; a niet-factureren klant sees Print, Project and Datum only; all dead links show the same page; the Overzicht says "Dit is een overzicht, geen factuur." and adds payment instructions only while something is open (reference: klant name).
- **Link expiry:** 7, 30 or 90 dagen, or Nooit; no notice and no "Geldig tot" row for Nooit.
- **No prices:** totals omitted, not "Prijs volgt" amounts (your choice).
- **Locked order:** "Spoel voor de hele print" skips it (your choice).

## New and changed
- **Tokens:** none added or changed (129 contrast pairs, 0 fail; no new colour pair).
- **New classes:** `--pp-share-act` (variable on `.pp-share`), `pp-lockhelp`, `pp-qty-text`, `pp-api-head`, `pp-api-row`, `pp-method`, `pp-minh-180/420/560`, `pp-w-980`, `pp-w-520`, `pp-left-t`, `pp-tree`, `pp-indent-1` to `pp-indent-4`, `.pp-alert.banner`, `.pp-state.is-inline`, `.pp-iwrap>.pp-btn.r`.
- **Changed classes:** `.pp-share` grid columns (fixed last column); `.pp-share-amt .pp-muted` no longer wraps.
- **Components:** changed DatePicker, AssetListItem, CostBreakdown, OrderSection, PaymentPanel, TokenReveal, ShareLinkRow, ScreenSharePage, DocOverview, ScreenPrintDetail, ScreenInvoiceExport, ScreenSystemStates, ScreenApiDocs. No new components.
- **Copy:** `date.pick`, `share.closeUncopied`, `share.closeUncopiedBody`, `common.back`, `date.daysOne`, `date.daysOther`, `date.agoOne`, `share.expiresTomorrow`, `share.expiresToday`, `spool.wholePrintSkipped`, `api.loadError`.

## Breaking changes
- None. The ApiDocs operation row padding changes from 10px to `space-2` (8px) and the method badge from 56px to 72px minimum.
- The `ds-gap: GAP-0xx` markers in the app code can come out for GAP-047 to GAP-051.

---

# Changelog 1.5

Resolves GAP-037 to GAP-045 and removes the remaining inline values from the milestone 8 previews. Version 1.4 follows below.

| Gap | Result |
|---|---|
| GAP-043 DatePicker calendar classes | resolved: `.pp-cal`, `.pp-cal-hd`, `.pp-cal-ft`, `.pp-pop.pp-calpop` in `bundle.css`; new component DatePicker with README and preview (open, error, phone bottom sheet); the export dialog uses it |
| GAP-041 Per-line "Markeer als betaald" in Openstaand | resolved: dialog in ScreenOutstanding (amount, default the remainder); one line per order; a Nabestelling reads "{print} (nabestelling {n})", Bestelling 1 shows the print name |
| GAP-040 "Spoel voor de hele print" placement | resolved: ScreenPrintDetail and OrderSection READMEs and preview; "Nog niet in een bestelling" section for unassigned files; files that never count are marked |
| GAP-042 "Factuur" button on phones | resolved: CustomerChips toolbar; hidden for niet-factureren klanten (variant added) |
| GAP-037 Invoice footer | resolved (option "Voorstel overnemen"): "Definitief maken" is refused without name and IBAN (aria-disabled, hint with link to Instellingen; Concept still works without the payment sentence); "Deze factuur is volledig betaald." replaces the payment sentence when nothing is open |
| GAP-038 18 truncated READMEs | resolved: cause was a write helper that truncated the file before reading it; fixed and every README holds the full spec (anatomy, tokens, states, accessibility, Dutch copy) |
| GAP-039 `pp-text-lg/xl/2xl` undefined | resolved: defined, plus `pp-text-3xl` and `pp-gap-6` |
| GAP-044 `.pp-anchor.up` off screen on phones | resolved: on phones the sheet pins to the bottom; `.pp-device.phone .pp-anchor` is static so it anchors to the device |
| GAP-045 Three footer buttons overflow 440px | resolved: the footer wraps (primary on its own row); export dialog at 440px (`pp-dialog.sm`) and 360px phone stack verified |

## Decisions applied
- **Order date:** modification time of the newest counted G-code in the order, else the creation date; used for the Datum column, the Van/Tot en met filter and the OrderSection header.
- **Days open:** from the invoice date, else the date the Verkoopprijs was set, else the order date.
- **Payment reference:** final invoice uses its number; Concept and Herinnering use the klant name.
- **Finalising:** "Voorstel uit marge" becomes the order's Verkoopprijs; price, cost adjustments and "Aantal keer geprint" lock with "Op factuur {nummer}"; payments and write-offs still work.
- **Credit notes (Admin):** write off only what is still open; what was paid stays paid.
- **Role User:** Openstaand is read-only, no buttons, only granted klanten.
- **Logo:** PNG or SVG upload (max 1 MB), stored and served as PNG; it replaces the studio name in the AppShell sidebar, phone top bar and drawer (max height, alt text); the icon rail keeps the initial tile.
- **PDFs:** built-in Helvetica, Western European characters only. Reindex progress bar: unchanged.

## New and changed
- **Tokens:** none added or changed (129 contrast pairs, 0 fail).
- **Classes:** `pp-cal`, `pp-cal-hd`, `pp-cal-ft`, `pp-calpop`, `pp-logo`, `pp-viewer-sm`, `pp-text-lg/xl/2xl/3xl`, `pp-gap-6`, `pp-cust-name`, plus layout helpers that replace inline values in the share, document and skeleton previews.
- **Components:** DatePicker (new); changed: AppShell (logo), CustomerChips, CustomerCard, ScreenOutstanding, ScreenInvoiceExport, ScreenPrintDetail, OrderSection, DocInvoice, DocOverview, ScreenShareLinks, ScreenSharePage.
- **Previews:** `class="sel"` removed (state is `aria-selected`); `<style>` blocks removed from DocInvoice, DocOverview, DocReminder, PrintCard and Viewer3D (only the Cover keeps one).

## Breaking changes
- None. Class `pp-btn-focus` (a typo) is now `pp-focus`.

---

# Changelog 1.4

Resolves GAP-029 to GAP-036 and removes the inline values from the M6 and M7 previews. Version 1.3 follows below.

| Gap | Result |
|---|---|
| GAP-033 Instellingen: printers, tariff, material prices | resolved: Prijzen gets Stroomtarief and Materiaalprijzen; new section Printers (`pp-printer`); ScreenSettings desktop, errors, empty state and phone |
| GAP-029 No stacking level for popovers | resolved: stacking tokens `z-raised`, `z-sticky`, `z-popover`, `z-tooltip`, `z-overlay`; `.pp-pop` carries `z-popover`; `.pp-anchor` floats it |
| GAP-035 Several orders in one print (Nabestelling) | resolved: OrderSection, NabestellingDialog, "Niet in een bestelling" badge and hint, summed PrintCard/PrintRow, PaymentPanel rules, ScreenPrintDetail variant |
| GAP-034 Bulk dialogs "Spoel toewijzen" and "Prijs instellen" | resolved: BulkDialogs with the per-print result (toast plus alert with reasons); price goes on the newest order |
| GAP-036 Inline sizes in the M6 previews | resolved: classes and one token (`space-9`); no layout `style` is left in PaymentPanel, CostBreakdown, CostOverrideDialog, SpoolPicker, MoneyDisplay, ScreenSettings, ScreenOutstanding, ScreenInvoiceExport and ScreenInvoices |
| GAP-030 CustomerCard selected state; restore on phones | resolved: `.pp-cust.is-selected`; deleted chip `.pp-chip.is-deleted` and "Herstellen" in the toolbar |
| GAP-031 Palette colours announced in English | resolved: Dutch accessible names and keys `tags.colour.*` |
| GAP-032 ConfirmDialog README and copy deck differ | resolved: the README and preview now use the copy deck text |

## Decisions applied
- **Bulk price:** "Prijs instellen" always sets the price on the newest order of each selected print; a print whose newest order is paid, written off or invoiced fails with a reason, the others continue.
- **Orders on the detail page:** stacked sections, newest first, settled orders closed; same on phone and desktop.
- **Instellingen:** Stroomtarief and the Materiaalprijzen table under Prijzen, plus a separate section Printers.
- **Deleting a Nabestelling:** Admin and Editor, only without payment or write-off and not on an invoice; Bestelling 1 never; the files return to "Niet in een bestelling".

## New tokens
- `space-9` 48px (slot indent).
- Family `zIndex`: `z-raised` 1, `z-sticky` 10, `z-popover` 30, `z-tooltip` 40, `z-overlay` 50.
- Family `opacity`: `opacity-deleted` 0.45, `opacity-archived` 0.6, `opacity-disabled` 0.5.
- No colour token is new or changed. Contrast report: 129 pairs, 0 failures (new rows: selected customer card, progress bar on its track, selected card border).

## Changed tokens
None changed. The raw numbers in `bundle.css` now read the new tokens: z-index 10, 20 (tooltips, now `z-tooltip` 40), 50 and the matrix cells, and the opacity values 0.45, 0.6 and 0.5.

## New and changed classes in `components/bundle.css`
- **Stacking and popovers:** `.pp-anchor` (with `.end` and `.up`); `.pp-pop` now has `position:relative` and `z-index: var(--z-popover)`.
- **Orders:** `.pp-orders`, `.pp-order` (a `details` element, with `.ttl`, `.sum`, `.chev`, `.bd`, `.is-open-order`), `.pp-pick`, `.pp-results`.
- **Settings:** `.pp-printer`, `.pp-mprices`, `.pp-progress` with `.pp-bar` (width from the data property `--v`), `.pp-logo-box`, `.pp-setrow`, `.pp-kv.narrow`, `.pp-kv.tight`, `.pp-time`, `.pp-cols-2`, `.pp-cost tr.slot` and `.pp-slotname`.
- **States:** `.pp-cust.is-selected`, `.pp-chip.is-deleted`, `.pp-hint` (standalone), `.pp-scrim.sheetframe`.
- **Helpers:** `pp-m0`, `pp-fw-regular|medium|bold`, `pp-right`, `pp-grow`, `pp-minw-0`, `pp-minw-200`, `pp-self-start`, `pp-items-start`, `pp-items-center`, `pp-pushr`, `pp-info`, `pp-unpaid`, `pp-dim`, `pp-bg-2`, `pp-mb-1`, `pp-p3`, `pp-p4`, `pp-rel`, `pp-reset`, `pp-plain`, `pp-minh-64`, `pp-minh-700` and the fixed widths `pp-w-120|160|200|260|320|340|420|440|480|600` (all capped at 100% of the container). They already existed from before: `pp-between`, `pp-end`, `pp-start`, `pp-push`, `pp-nowrap`, `pp-fill`, `pp-gap-*`, `pp-text-*`, `pp-strong`.

## New components and screens
- **New components:** OrderSection, NabestellingDialog, BulkDialogs.
- **Changed components:** Popover (floating, `z-popover`), FilterBar and TagEditor (stacking notes), PaymentPanel (overpayment error, undone payments in the history), PrintCard and PrintRow (several orders), AssetListItem (not in an order), CustomerCard (selected), CustomerChips (deleted klant), ConfirmDialog (text from the copy deck, new confirmations), BulkActionBar (what the buttons open), CostBreakdown, CostOverrideDialog, SpoolPicker and MoneyDisplay (no inline values).
- **Changed screens:** ScreenSettings (Prijzen, Printers), ScreenPrintDetail (orders), ScreenDashboard (notes), ScreenTags (Dutch colour names), ScreenOutstanding, ScreenInvoiceExport, ScreenInvoices (no inline values).

## Inline audit (GAP-036)
In the nine listed previews and the new ones, every `style` attribute is gone except the data properties `--c1`, `--c2`, `--v`, `--tag` and `--tag-ink`. The values that had no token: slot indent 48px (`space-9`), the 110px label column (`pp-kv.narrow`), the two time inputs (`pp-time`), the reindex progress bar (`pp-progress`), the logo box (`pp-logo-box`), the Klanten rows (`pp-setrow`), the two-column Bedrijfsgegevens grid (`pp-cols-2`, one column on phones) and the Standaardmarge field (`pp-w-200`). Two values map to the nearest token: 6px gaps became `space-2` (8px) and 13px text became `text-sm` (13.5px).
Previews of other components still contain layout `style` attributes (for example the share page, API-docs and the loading skeletons); they are not part of the contract and will be cleaned in the next round if you want that.

## Breaking changes
- **Tooltip layer:** rail and nav tooltips moved from `z-index` 20 to `z-tooltip` (40); anything between 20 and 40 in the app now sits below them.
- **Popover markup:** `.pp-pop` now has `position:relative`. Floating popovers must sit in `.pp-anchor`; a `.pp-pop` placed elsewhere keeps its place in the page flow.
- **Print detail:** the page lists OrderSection blocks; a print with one order shows one open "Bestelling 1" section instead of a single Bestanden, costs and payment column.
- **PrintCard and PrintRow:** price, status and open amount are sums over the orders.
- **Copy:** `confirm.deleteTagBody` and the README example for `confirm.deleteCustomerBody` now match the copy deck (the deck text did not change).

---

# Changelog 1.3

Resolves GAP-024 to GAP-028 and removes inline values from the dashboard, print detail and asset list. Version 1.2.1 follows below.

| Gap | Result |
|---|---|
| GAP-024 Dimmed deleted and archived thumbnails, row flash, muted row text | resolved: `.is-deleted` (45%), `.is-archived` (60%), `.pp-row.flash` and `.pp-row .muted` in `bundle.css`; no inline opacity |
| GAP-025 Phone customer chip row | resolved: `.pp-chips` and `.pp-chip` with `aria-pressed`, component CustomerChips |
| GAP-026 Delete a whole klant | resolved: ghost icon button on CustomerCard, "Klant verwijderen" in the filtered phone view, destructive ConfirmDialog, deleted card with Herstellen; keys `customers.delete`, `confirm.deleteCustomer`, `confirm.deleteCustomerBody` |
| GAP-027 Tag editor and tag management | resolved: TagEditor popover (`.pp-tagpop`), palette `.pp-pal`, new page ScreenTags (Admin and Editor); keys `tags.*`, `confirm.deleteTag*`, `error.tagExists`, `error.tagTooLong` |
| GAP-028 Copy for fullscreen and print count | resolved: `viewer.fullscreen`, `viewer.exitFullscreen`, `customers.printCount` (ICU plural) |

## New and changed
- **Tokens (new, 10):** `tag-rose`, `tag-orange`, `tag-amber`, `tag-lime`, `tag-teal`, `tag-sky`, `tag-blue`, `tag-violet`, `tag-lilac`, `tag-grey`, per theme. Chip text `#141a33` or `#ffffff`; all new pairs pass WCAG 2.2 AA (121 pairs, 0 failures).
- **Classes (new):** `.pp-chips`, `.pp-chip`, `.pp-cust`, `.pp-custs`, `.pp-toolbar`, `.pp-tagpop`, `.pp-pal`, `.pp-tagrow`, `.pp-plate`, `.pp-detail`, `.pp-showcase`, `.pp-card-hd`, `.pp-viewer .full`, `.pp-viewer.fluid`, `[data-c=…]`, text, gap and layout utilities. **Changed:** thumbnails, cards and rows (`.is-deleted`, `.is-archived`, `.flash`).
- **Components (new):** CustomerCard, CustomerChips, TagEditor. **Changed:** PrintCard, PrintRow, AssetListItem (40px plate thumbnail), TagChip (`data-c`), Viewer3D (fullscreen), ConfirmDialog (klant, tag), AppShell (Tags nav item for Admin and Editor).
- **Screens (new):** ScreenTags, desktop and phone. **Changed:** ScreenDashboard, ScreenPrintDetail, User role view.
- **Audit:** inline values in the dashboard, print detail and asset list previews moved to classes. Remaining inline: `--c1`, `--tag`, `--tag-ink` (data) and `min-height` on preview devices (scaffolding, not for the app).

## Breaking changes
- Tag colours are now palette keys; an old free hex still renders through `--tag` and `--tag-ink` but is no longer offered in the editor.
- Print-detail delete and "Toon verwijderde" are role-gated as described in the README.
- The app can remove its temporary `ds-gap` styles for GAP-024 to GAP-028.

# Changelog 1.2.1

Patch release: resolves GAP-023. Version 1.2 follows below.

| Gap | Result |
|---|---|
| GAP-023 No class to swap a table for cards at 480px and below; login page padding stays 24px on phones | resolved: wrapper classes `pp-only-wide` and `pp-only-phone`, and `pp-center` pads the page with `space-4` (16px) at 480px and below |

- **How to use it:** put both layouts in the DOM, each in its own wrapper without a display of its own: `<div class="pp-only-wide">table</div>` and `<div class="pp-only-phone">cards</div>`. Above 480px only the first shows; at 480px and below only the second. The wide table keeps its own `pp-scroll` box as a fallback. The preview container `pp-device.phone` forces the same rules at a fixed width.
- **Screens changed:** Gebruikers and Toegang (table and cards in one DOM), Login (phone padding from the class instead of an inline value).
- **Tokens:** none new or changed. **Breaking changes:** none; the temporary `ds-gap: GAP-023` stylesheet in the app can be removed.
- **Not changed:** other tables (Facturen, Openstaand, print lists) keep their current phone behaviour; the swap classes are available for them.

---

# Changelog 1.2

Version 1.2 resolves GAP-013 to GAP-022 from the implementation of 1.1. Version 1.1 is kept below for history.

## Gap resolution

| Gap | Result |
|---|---|
| GAP-013 Deel-link for niet-factureren klanten | resolved: the disabled create dialog is gone; the Klant field shows the help "Deze klant wordt niet gefactureerd. De link toont alleen de printlijst, zonder bedragen." and Maken stays enabled; ScreenSharePage gets a not-billed variant (Print, Project, Datum only, intro "Hier zie je de prints die voor je gemaakt zijn.", no amounts, payment badges, totals or PDF button). DocOverview is unchanged: a niet-factureren klant has no Overzicht PDF |
| GAP-014 "Nooit" as expiry | resolved: fourth option Nooit with the help "De link blijft werken tot je hem intrekt."; ShareLinkRow shows "Verloopt niet" in `muted` (class `never`); the share page omits the expiry notice |
| GAP-015 AppShell has no responsive CSS | resolved: media queries at 900px (56px icon rail with tooltips) and 480px (top bar, bottom bar, `.pp-drawer`); phone rules exist as media queries, so the app never sets `.phone`; one DOM for every size; rail and drawer are drawn in the AppShell page |
| GAP-016 No line-height tokens or base typography | resolved: 8 `leading-*` tokens and a `body` rule in `bundle.css`; all raw line-heights in `bundle.css` now use the tokens |
| GAP-017 Raw sizes in login and system states | resolved: classes `pp-auth`, `pp-auth .or`, `pp-state`, `pp-state.wide`, `pp-iwrap.compact`, `pp-dialog.sm`; the 22px state heading is merged into `text-xl` / `leading-xl` (20/28), so no 22px token was added |
| GAP-018 Local sign-in by name or e-mail | resolved as proposed: field "E-mailadres of naam" (`type="text"`, `autocomplete="username"`), key `auth.identifier` |
| GAP-019 Choosing a password after a temporary one | resolved: new login-card state "Nieuw wachtwoord kiezen" (with errors) and a small dialog "Wachtwoord resetten voor '{naam}'" where the admin types the temporary password |
| GAP-020 "Rol wijzigen" on phones | resolved: the same native Select inside the card; the button and its copy are dropped |
| GAP-021 Editor rows in the access matrix | resolved: Editor rows look like Admin rows (disabled, checked, "· Editor"); note "Admin en Editor hebben altijd toegang."; phone cards show a disabled, checked list |
| GAP-022 Error copy for sign-in and users | resolved: `auth.oidcFailed`, `error.passwordTooShort`, `error.userExists`, `confirm.deleteUserBody`, all drawn in their screens |

## New tokens

`leading-xs` 16px, `leading-sm` 20px, `leading-base` 22px, `leading-md` 24px, `leading-lg` 26px, `leading-xl` 28px, `leading-2xl` 32px, `leading-3xl` 40px. They sit in the `fontSize` family of `tokens.json` (the format has no separate line-height family) and appear in `tokens.css` as `--leading-*`. No colour token is new or changed; the contrast report has 6 more rows (107 pairs, all pass).

## Changed tokens

None.

## New classes in `components/bundle.css`

`body` base rule, `pp-drawer-backdrop`, `pp-drawer`, `pp-auth` (with `.or`), `pp-state` (and `.wide`), `pp-iwrap.compact`, `pp-dialog.sm`, `pp-sr` (visually hidden), `pp-main > h1`, `pp-share .never`, plus the responsive rules for `pp-app`, `pp-side`, `pp-nav`, `pp-phone-top`, `pp-bottomnav`. The preview containers `pp-device.rail` and `pp-device.phone` force the same rules at a fixed width.

## New or changed components

- **AppShell:** responsive spec, DOM contract, icon rail, drawer.
- **ShareLinkRow:** "Verloopt niet" state.
- **AccessMatrix:** Editor rows, new note.
- **ConfirmDialog:** `pp-dialog sm`, delete-user confirmation with its consequence sentence.

## New or changed screens

- **ScreenLogin:** identifier field, Authentik-failed, session-ended and new-password states.
- **ScreenUsers:** compact role select, native select on phones, reset-password dialog, create-dialog errors, delete icon button.
- **ScreenShareLinks:** Nooit and not-billed creation, a link without expiry in the list.
- **ScreenSharePage:** not-billed variant, no expiry notice.
- **ScreenAccess:** Editor rows.
- **ScreenSystemStates:** classes instead of inline sizes (title 20px instead of 22px).
- **ScreenSettings:** README text about the Deel-link for niet-factureren klanten.

## Decisions applied

- **Credited prints:** a credited print becomes Afgeschreven. This is stated in the README rules; no new component was needed because the status already exists.
- **Sign-in rules:** Authentik admin group becomes Admin, a 60-minute idle and 12-hour session limit, 5 login attempts per minute, passwords of at least 12 characters and the last-Admin guard are recorded in README and the screen specs.

## Additions beyond the gaps

- An `info` notice "Je sessie is verlopen. Log opnieuw in." on the login card.
- A ghost button "Uitloggen" on the new-password card, so the user is never stuck.
- The user Denise added to the sample data (a second User row).

## Breaking changes

- **Markup:** AppShell. Nav links need `<span class="lbl">` and `data-tip`, the brand needs `.ini` and `.full`, and on phones `header.pp-phone-top`, `nav.pp-bottomnav` and the drawer sit inside `.pp-app` instead of next to it. `.pp-phone-main` and the `.phone .pp-stats` rule still exist for compatibility but are no longer used.
- **Copy keys removed:** `share.noShareLink`, `share.notBilled`, `access.adminAlways` (use `access.allAccessRoles`), `auth.email` (use `auth.identifier`).
- **Copy key text changed:** `auth.wrong` is now "Verkeerd e-mailadres, naam of wachtwoord."
- **Visual:** state-page titles are 20px instead of 22px; dialogs with a maximum width of 400px or less now use the 380px `pp-dialog sm`, wider ones the 440px default.

## Known limits

- Many previews still contain inline `style` attributes for demo layout. They are not part of the contract; the app uses only tokens and the classes above. The inline values in login, state pages, role select and ConfirmDialog (GAP-017) are gone; a full audit of every preview is not done.
- Wide layouts (1440px and up) are specified in the README text, not drawn.

---

# Changelog 1.1

Version 1.1 resolves every open gap from the implementation of 1.0.

## Gap resolution

| Gap | Result |
|---|---|
| GAP-001 No screens, screen copy or invoice layout | resolved: 17 screen and document pages added (below), screen copy in each README and in `copy-deck.md` |
| GAP-002, GAP-003 | not in the list received; nothing done |
| GAP-004 No "partially paid" status | resolved: badge Deels betaald, remaining-amount line, PaymentPanel, OutstandingGroup, PrintCard, PrintRow, share page, documents |
| GAP-005 Per-slot filament usage | resolved: slot rows and slicer-colour swatch in AssetListItem; CostBreakdown slot sub-rows; tint fallback rule in SpoolSwatch |
| GAP-006 Aantal keer geprint | resolved: compact input in AssetListItem, "× n" in meta, "n × …" in CostBreakdown |
| GAP-007 Duplicate file warning | resolved: badge Mogelijk dubbel plus visible hint line (see deviations) |
| GAP-008 3MF plates as rows | resolved: child rows "Plaat n" with their own controls and slots |
| GAP-009 Manual price per kg, grams and time | resolved: new CostOverrideDialog opened by "Aanpassen" |
| GAP-010 Niet factureren customers | resolved: badge, "Kosten" display, PaymentPanel note, Instellingen toggle; no Deel-link for such klanten (your decision) |
| GAP-011 Write-off states | resolved: written-off PaymentPanel state, admin undo, new WriteOffDialog with optional reason |
| GAP-012 Invoice register, finalise, credit notes | resolved: new Facturen screen, finalise dialog, credit-note dialog, "Op factuur" badge and locked state |

No gap was rejected or merged. Decisions you made while resolving: Facturen is visible to Admin and Editor and only Admins create a Creditnota; a Creditnota covers the whole invoice or chosen lines; a klant that is niet factureren cannot get a Deel-link.

## New tokens

None. Every new state uses existing tokens. Version in `tokens.json` is now 1.1.

## Changed tokens

None. Values, names and the `tokens.css` fallback are unchanged.

## New components

- **AppShell** (Screens group): sidebar, icon rail, top bar, bottom bar and drawer.
- **CostOverrideDialog**: manual price per kg, weight and print time.
- **WriteOffDialog**: partial write-off with optional reason.

## Changed components

- **StatusBadge:** added Deels betaald, Niet factureren, Mogelijk dubbel, Op factuur {nummer}, Concept, Definitief, Creditnota; added the `pp-remaining` line.
- **MoneyDisplay:** remaining-amount and negative variants, "Kosten" label.
- **SpoolSwatch:** `.slicer` variant with the "slicer" hint chip; thumbnail tint rule.
- **AssetListItem:** times-printed input, slot rows, plate child rows, duplicate hint, automatic and manual exclusion with reason; layout now adapts to container width.
- **CostBreakdown:** header with Aanpassen, per-slot sub-rows, times-printed calculation text, "Niet meegeteld" line.
- **PaymentPanel:** states for partial, written off, niet factureren, rol User, locked by invoice, missing cost; admin-only undo actions.
- **OutstandingGroup:** partial line variant; totals are sums of remainders.
- **PrintCard, PrintRow:** partial, niet factureren, deleted (with Herstellen) variants.
- **ConfirmDialog:** finalise variant and the new undo and finalise copy.

## New screens and documents (group Screens)

ScreenLogin, AppShell, ScreenDashboard, ScreenPrintDetail, ScreenInvoiceExport, ScreenOutstanding, ScreenShareLinks, ScreenAccess, ScreenUsers, ScreenSettings, ScreenApiDocs, ScreenSharePage, ScreenInvoices (new page), ScreenSystemStates, DocInvoice (Factuur, Concept, Creditnota), DocReminder (Herinnering), DocOverview (Overzicht).

## Changed screens

None; there were no screens in 1.0.

## New files and copy

- `copy-deck.md`: about 150 new keys, grouped by area.
- `contrast.md`: 11 new rows (neutral badge text, remaining-amount line, duplicate hint, document text on white paper); all pass.
- `bundle.css`: classes `pp-slot`, `pp-hintchip`, `pp-qty`, `pp-reason`, `pp-remaining`, `pp-assetlist`, `pp-device`, `pp-app`, `pp-side`, `pp-nav`, `pp-main`, `pp-bottomnav`, `pp-paper` and layout helpers.
- README: roles, documents, screens, payment rules and the "no VAT" rule.

## Deviations from the proposals

- **GAP-007:** the explanation is a visible hint line instead of a tooltip, so it is readable on touch and by screen readers; the badge itself is as proposed.
- **GAP-009:** when Spoolman supplies the price per kg the price field is disabled with "Prijs komt uit Spoolman.", which follows the precedence you gave (Spoolman, then handmatig, then standaard per materiaal).
- **GAP-001:** screens are shown at desktop (980px) and phone (360px) widths, with both themes through the page's theme switch. Tablet and wide behaviour is specified in text under Responsive and AppShell, not drawn.
- **GAP-012:** concept PDFs are not stored, so the register lists only final invoices and credit notes.

## Breaking changes

- **Copy:** the vocabulary entry "BTW" is removed from the README; no token or component used it. Any implementation of a VAT toggle, rate, VAT number or KvK field from the brief must be removed.
- **Behaviour:** "Betaling ongedaan maken" is now Admin-only and always confirms.
- **Layout (AssetListItem):** `.pp-asset` is now a two-line grid by default and switches to one line inside a `.pp-assetlist` container that is 760px wide or more; `.pp-slot` is now a wrapping flex row. Consumers that copied the 1.0 three-column grid must wrap the list in `.pp-assetlist`.
- **Payment status:** a print with `0 < paid < price` now shows Deels betaald instead of Open, and counts only its remainder in Openstaand.
- **Invoice numbers:** only final invoices and credit notes are numbered; a Concept download and a Herinnering have no number.

## Notes

IBAN, address and e-mail on the documents are placeholders. The Swagger operations on the API-docs screen are illustrative.
