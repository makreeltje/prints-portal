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
