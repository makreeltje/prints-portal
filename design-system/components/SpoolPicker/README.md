SpoolPicker chooses a spool from Spoolman by material, colour, vendor or price per kg; it fits inside a narrow table cell.

**Anatomy.** Trigger (swatch + name + chevron, 160px minimum) opens a Popover (320px; full-width sheet at 480px and below) with a search field and a listbox. Each option: swatch, name (500), "materiaal · leverancier" (`muted`), price per kg right-aligned. The selected option is `primary-tint`; the keyboard-active option has a 2px `focus-ring` outline. Last option "Geen spoel". Empty state: "Geen spoelen gevonden" with a link to Spoolman.

**Tokens.** `surface`, `border`, `shadow-md`, `primary-tint`, `primary-tint-soft`, `focus-ring`, `muted`.

**States.** Closed, open, option hover/active/selected, searching, empty, Spoolman unreachable (warning alert in the popover, manual entry offered).

**Accessibility.** Combobox pattern: input `role="combobox"` with `aria-controls`/`aria-activedescendant`; ArrowUp/Down move, Enter selects, Esc closes and returns focus to the trigger; typing filters immediately.

**Dutch copy.** Kies een spoel | Zoek op materiaal, kleur of leverancier | Geen spoelen gevonden | €/kg | Geen spoel

**Inline values (1.4).** The trigger uses `pp-minw-200 pp-start`; spool colours stay data (`--c1`, `--c2`).

**Where the panel goes (2.2, GAP-112).** This is the component the bug was measured on: 320x302 with 30 spools, opened at y=831 in a 900px window, 233px of it below the fold. The placement rule is Popover's, in full, and it is not optional — side, `--pp-pop-max`, sheet under 240px of room. The listbox is the scroll region: it keeps 240px as the height it prefers and shrinks below it when the panel is capped, so the search field stays visible and the page never scrolls to reveal the list; that is what the owner was missing when all they could see was the search field.

**An inherited value is shown, never hidden behind the placeholder (2.3, GAP-115, resolved).** Measured in the app: a slot with no spool of its own is costed with the print's spool — EUR 7,05 with no print spool, EUR 5,13 after choosing one, EUR 7,05 again after clearing it — while the trigger said "Kies een spoel" the whole time, including while that spool was costing it. A control that can override a value must state the value it is overriding. This is the rule for every picker in the system, not only this one:

**A trigger shows what is in force, and names where it came from when that is not itself.** Four states, in precedence order:

1. **Its own value.** Swatch + name, no chip. Unchanged.
2. **Inherited.** Swatch of the inherited spool + its name + the hint chip `pp-hintchip` reading **"van de print"**. The name is set in the trigger's normal ink, not `muted`: the value is real and it is costing money. The chip is the same device that already marks a slicer colour, which is why there is no new class — provenance is a chip, a value is a value.
3. **A slicer colour only.** The dashed `.pp-spool.slicer` disc with the chip "slicer" and the label **"Kies een spoel"** — which is true: a slicer colour is not a spool and costs nothing. Unchanged, and this is the state the 2.2 preview draws.
4. **Nothing at all.** `.pp-spool.none` + "Kies een spoel". Unchanged.

**Where the chip goes.** The provenance chip belongs on the control that can override the value. So when a row has a trigger, the row's swatch cell (`span.sw`) shows the disc alone and the chip sits in the trigger; when there is no trigger — role User, or a locked order — the chip stays in the swatch cell, because then nothing can override it and the cell is the only place the fact can live. Today the slicer chip sits in the cell *beside* a trigger that contradicts it; that is the duplication this rule removes.

**The accessible name** of an inherited trigger is `asset.spoolFromPrint.aria` — "Spoel van de print: {naam}. Kies hier een eigen spoel voor dit bestand." — so the chip is not the only carrier of the fact.

**The print-level control says what it does (2.3).** "Spoel voor de hele print" keeps its help line and gains one line under it: `spool.wholePrint.applies`, "Geldt nu voor {n} slots zonder eigen spoel.", or `spool.wholePrint.appliesNone` when every slot has its own. **No print in this library of 83 has a whole-print spool set**, which is what a control that has never looked like it does anything earns. The count is the app's to compute; it is not a design value.

**Dutch copy (new).** van de print | Spoel van de print: {naam}. Kies hier een eigen spoel voor dit bestand. | Geldt nu voor {n} slots zonder eigen spoel. | Elk slot heeft een eigen spoel, dus deze keuze verandert nu niets.

If a file-level spool ever governs its own slots, the same chip applies with "van het bestand"; that key is not in the deck until the app has that relation, because dead copy is worse than a missing line.

**2.7 — "Geldt nu" may only be written where something is in force (GAP-118, resolved).** 2.3 added one line under the whole-print control and keyed it on the wrong condition: `spool.wholePrint.applies` asks *how many slots have no spool of their own*, which is true of the slots whether or not a spool has been chosen. Measured in the app on a print with two such slots and no whole-print spool: the trigger says "Kies een spoel", the total is EUR 1,86, and the line underneath says "Geldt nu voor 2 slots zonder eigen spoel." Nothing is in force. After choosing a spool the same line becomes true and the total is EUR 1,39. It is the same fault GAP-115 was raised for, on the control GAP-115 fixed, and it was mine: the condition I wrote named one axis of a two-axis state.

**The line is keyed on both axes now, and all four cells have words.**

| | **a whole-print spool is set** | **no whole-print spool** |
|---|---|---|
| **n ≥ 1 slots without their own spool** | `spool.wholePrint.applies` — "Geldt nu voor {n} slots zonder eigen spoel." *(unchanged)* | `spool.wholePrint.wouldApply` — "Een spoel hier geldt voor {n} slots zonder eigen spoel." *(new)* |
| **n = 0, every slot has its own spool** | `spool.wholePrint.appliesNone` — "Elk slot heeft een eigen spoel, dus deze keuze verandert nu niets." *(unchanged)* | `spool.wholePrint.wouldApplyNone` — "Elk slot heeft al een eigen spoel, dus een spoel hier verandert niets." *(new)* |

`n` is the same count in all four cells and stays the app's to compute. The line always sits third, under `spool.wholePrint` and its help line `spool.wholePrint.help` ("Bestanden en slots met een eigen spoel gaan hierboven voor."), in `pp-help`. No class, no token, no colour: the only change is which of four strings is rendered.

**The tell is the word *nu*.** It appears in the left column only. A sentence in the present tense is a claim about the present state, so it may be rendered only where that state holds; the right column speaks about the control instead ("een spoel hier"), which is true before anything is chosen. That is the general rule and it is in `README.md`.

**Two answers I did not take, and the reasons, because both were defensible.**

- **Show nothing when no spool is set** — the implementer's own reading, and the obvious fix. Rejected: it removes the line in precisely the state the line was written for. This control had never looked like it did anything, which is why 2.3 gave it a line at all, and **83 of 83 prints in this library have no whole-print spool** — so silence would mean the line is almost never seen and the control goes back to looking inert. The trigger's placeholder says there is no spool; it does not say that choosing one would cost anything, and that is the fact the operator is missing.
- **One tenseless line, "Geldt voor {n} slots zonder eigen spoel."** Rejected: it is true in both states by being specific in neither, and this gap exists because a sentence about money was ambiguous about when it applied. A line under a control that changes a total has to say whether it is describing the total or an offer.

**Accessibility.** The line is part of the trigger's description (`aria-describedby`, together with the help line), not a live region: it changes only as a result of the viewer's own choice in that same control, and the new total is announced where totals are announced. It must be real text, never a tooltip — it is an essential instruction and Tooltip forbids that.

**Both themes, no new pair.** `pp-help` is `muted` on `surface` in both themes and is already in the contrast report; nothing visual changes.

**Drawn in the preview:** all four cells, each with the trigger state that goes with it, and the n = 1 singular.

**2.13.** (2026-10-18) **What is left on a spool, and what is not in stock any more (GAP-161,
resolved).** Measured against the owner's Spoolman: **31 spools, 29 active, 24 distinct names**;
three names cover several physical spools and two of those are identical in every field Spoolman
has. The list drew them as two identical rows and the owner read them as duplicates.

**The option's meta line is now three parts: "{materiaal} · {leverancier} · {rest}".** The remaining
weight is what tells two identical spools apart, and it is also **what you choose on** — a small
print goes on the spool that is nearly empty. It is an observed figure from Spoolman, so it needs no
date (`README.md` rule 1). `spool.remaining` carries a **zero arm**: an empty spool reads **"leeg"**,
not "0 g over". The owner noticed the odd reading and he is right — "0 g over" is a figure where a
word is meant, which is the rule this deck has followed since 2.11 ("sinds vandaag open", "alles van
vandaag"). The price per kg keeps its own right-aligned cell.

**(a) May a state use `pp-hintchip`? Yes, and the chip's definition was too narrow, not the use.**
The chip has carried "uit de map", "slicer" and "van de print", and I described it as *provenance*.
What it has always been is **a qualification of the value it sits on, in words, with no ink, no icon
and nothing to do**: where the value came from is one qualification, whether it is still in stock is
another. So **"archief" takes the chip**, and the boundary is written down instead of the examples:

- **It may not carry something that needs doing.** That is a `warning` badge with a reason line. An
  archived spool needs nothing: choosing it is correct for an old print, which is why the archive is
  in the list at all.
- **It may not carry something that changes money.** A value is a value; the weight and the price
  are cells of their own, not chips.
- **It is never the only carrier of the fact.** "archief" is real text inside the option, the
  archived spools sort last, and typing "archief" finds exactly them — all three already built.
- **It goes with the value.** When an archived spool is the one in force, the chip travels to the
  **trigger**, beside the name, exactly as "van de print" does (2.3). What is in force is shown with
  its qualification attached, or the row is lying by omission.

`title="Gearchiveerd in Spoolman"` stays as the app built it; it is an aid, never the carrier.

**(b) Does `pp-minw-200` still hold? Yes, and nothing is capped.** 200px is a **floor**, not a width:
a trigger grows with its content and the widest one in this library measured **216px** (2.2). The
longer *option* line lives in the 320px panel and never reaches the trigger. The pressure that would
have forced a cap was the row's third column, and AssetListItem's 2.13 band removes it — the trigger
now sits in a band of about 738px. **So the trigger does not truncate, and no spool name is cut.**

**On "Creality Skin Hype…", which I cannot explain: measure it.** Nothing in `bundle.css` truncates
a trigger — `.pp-btn` is `white-space: nowrap` with no `overflow` and no `text-overflow`, and
`.pp-spoolbtn` only sets a `min-width`. Tell me which element clips (`scrollWidth` against
`clientWidth`, and which ancestor has the `overflow`): if it is an app-side cap, remove it; if this
system is doing it somewhere I have not found, log it as its own gap and I will decide it with the
markup in front of me. **If a trigger ever does have to truncate, the cut is in the middle** — a
spool name is brand and material at the front and colour at the end, so both ends identify it, like
a file name and unlike a URL (`README.md`, *Typography*, 2.4). That is the rule, not a built form:
nothing in the export truncates a trigger today.

**Both themes.** No new token and no new class. One new ground pair is measured and in
`contrast.md`: the chip's dashed `border-strong` edge against a **hovered** (`primary-tint-soft`)
and a **selected** (`primary-tint`) option row — 3.83 and 3.49 light, 3.31 and **2.95** dark. The
one value under 3:1 is the chip's outer edge on a selected row in the dark theme; the same edge
measures **3.32** against the chip's own opaque `surface-2` ground, which is the contour that makes
the chip a chip, and the chip's text is `muted` on `surface-2` at 4.5:1 or better in both themes.
Nothing depends on that hairline, and it is recorded rather than rounded up.

**Dutch copy (new).** archief | Gearchiveerd in Spoolman | {grams, plural, =0 {leeg} other {# g over}}

**2.14.** (2026-10-18) **The 32px that disappeared was the card's clip, and the trigger's floor is now a floor for the panel only (GAP-163, resolved on the app's measurement).**

The app measured what 2.13 asked for and the answer is unambiguous: at 360px the trigger is **314px**
wide with `scrollWidth` equal to `clientWidth` — *nothing truncates it* — its row offers about
**302px**, and the only ancestor with an `overflow` is `section.pp-card.pp-assetlist.pp-flush`
(`clientWidth` **326** against `scrollWidth` **358**). So the last **32px** of "Creality Rainbow Wild
Blossom Hyper" is painted outside the card and `overflow: hidden` removes it. The page does not
scroll sideways precisely because the card absorbs it, which is why it read as a shortened name.
**I was wrong about one thing and right about another:** nothing in `bundle.css` truncates a trigger
(right), and my sentence that GAP-111's band "removes the only thing that was squeezing it" is true
at 961px and has **no effect at 326px** (wrong) — below 760px `.acts` has spanned the row for
longer than this round.

**The decision: at 480px and below the trigger may go below 200px, and the name takes the middle cut
this file already specified as the rule.** 200px was always a floor for the *panel's* sake, not a
width, and a floor that makes a control wider than its row is not protecting anything.

- `min-width: 0; max-width: 100%` on the trigger inside a file row's `.acts`, in the media query and
  in its `.pp-device.phone` twin. Both class names the trigger is built with are named
  (`.pp-spoolbtn` and `.pp-minw-200`), so the rule does not depend on which one the app wrote.
- **Markup obligation:** the trigger's name is wrapped — `<span class="nm pp-fname sans"><span
  class="a">…</span><span class="b">…</span></span>`. `.pp-fname` is GAP-119's mechanism (a
  shrinking head with an ellipsis, a fixed tail) and **`.pp-fname.sans`** is new, one declaration,
  because a spool name is not mono. The **app splits the string**, as it does for a file name:
  `.b` is the **last word** of the spool's name, `.a` is the rest. A spool is identified at both
  ends — brand and material at the front, the colour or line at the back — so "Creality Rainbow Wild
  Blossom Hyper" reads "Creality Rainbow Wild…Hyper" and never loses the end.
- The swatch, the hint chip ("van de print", "archief") and the chevron keep their width: only the
  name pays, and the chip gets `flex: none` so a qualification never shrinks to nothing.
- **Above 480px nothing changes at all.** The floor holds, the widest trigger in this library is
  216px, and the band gives it 738px.

**Rejected, both of the app's other two shapes.** **Wrapping the trigger to two lines:** a control
whose height depends on a spool's name undoes the row agreement GAP-111 bought two weeks ago, and
turns a 44px target into 68px on the one width where 44px was the point. **Letting the card scroll
its rows sideways:** this system scrolls tables inside their own container, not cards (`README.md`
*Responsive*), `.pp-flush`'s `overflow: hidden` is what keeps a flush list inside the card's radius,
and a scroll that hides a control is worse than a name cut where it can still be read.

**What this does not fix, and I want it measured.** The clip was at the card's edge, so **any**
control in that band can be clipped the same way at 360px. The spool trigger is the widest and was
the one that showed; see *What I need measured* in `changelog.md` 2.14.

**Both themes.** No new token, no new colour pair. New classes: `.pp-fname.sans`, `.pp-spoolbtn > .nm`.

**2.15 — a split name needs an explicit label.** The app's own correction from building 2.14, and it
belongs here: splitting the trigger's name into `.a` and `.b` breaks its **accessible name**, because
name computation joins element children without the space that lives inside them — "Creality Rainbow
Wild Blossom Hyper" was announced as one word. The answer was already in the system (ModelPicker
labels its split file names explicitly) and it is now written where the split is specified: **wherever
`.pp-fname` cuts a name into two elements, the control carries an `aria-label` built from its own
visible words**, the hint chip ("van de print", "archief") included, in the order they are read. This
holds for the trigger, for a listbox option and for anything else that borrows the middle cut. The
visible text is unchanged; what changes is that the name is stated rather than inferred.
