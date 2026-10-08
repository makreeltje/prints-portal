ModelPicker is the media strip under Viewer3D: it chooses which of a print's pictures the viewer shows — any of its models and, since 2.0, its timelapse (GAP-086, new in 1.9; GAP-094 and GAP-096 in 2.0).

**Anatomy.** Under the Viewer3D frame: a caption "Model {n} van {totaal}: {bestandsnaam}" (`text-sm`, name in `text-strong`) and, for two or more models, a strip of 76px buttons (`pp-modelbtn`: a square on the neutral `surface-2` ground — the per-model render where one exists, else the file-type glyph — with the file name truncated under it). The buttons are one `role="group"` named "Modellen", or "Modellen en timelapse" when the strip also holds the print's video (2.0); each is a toggle button with `aria-pressed`, the selected one has a `primary` border and `primary-tint-soft` ground. Choosing a model swaps the viewer (the frame keeps its size, "Model laden…" shows while the new file loads) and the caption; the choice is not stored. **Which model first:** the one the print's thumbnail is rendered from (first model by file name). **Many models:** the strip at any count; it scrolls sideways (the Select above six is gone in 2.0, see below). **One model:** no strip and no caption. **None:** Viewer3D's no-model strip.

**Tokens.** `surface`, `surface-2`, `border`, `border-strong`, `primary`, `primary-tint-soft`, `muted`, `text-strong`, `radius-md`/`radius-sm`, `space-1`/`space-2`, `focus-ring`.

**States.** Default, hover, selected, focus-visible, loading the next model, overflowing strip (`is-overflow`), timelapse selected, one model, none.

**Accessibility.** Toggle buttons in a labelled group; the accessible name of a button is "Model {naam}", the selected state is `aria-pressed`, not colour alone (the border and background change and the caption names the model); Arrow keys are not required, Tab moves between buttons; the viewer's `aria-label` names the current model ("3D-voorbeeld van {naam}"). The strip is a scroll region only when it overflows and then has `tabindex="0"` and `aria-label="Modellen"` (the 1.8 rule).

**Dutch copy.** Modellen | Model | Model {n} van {totaal}: {bestandsnaam} | Model laden… | 3D-voorbeeld van {naam}

**To measure (owner, 1.9):** how many models a print holds (the largest and the median) — still open; see the 2.0 note at the end, which restates it. *The 6-button limit this question was asked for no longer exists.*

**2.0.** (2026-10-08) **One control, and the timelapse belongs in it (GAP-094 resolved, GAP-096 resolved in a changed form).**

**The Select above six models is dropped — that half of GAP-094 is rejected.** Two controls for one job is the thing that read wrong, and the Select hides exactly what the gap asked to see. The strip is the control at every count: 2 models, 7, or 12. When it overflows the app sets `is-overflow`, which fades the last `space-6` of the row (`mask-image`) so it visibly continues, as the klant strip does since 1.9; the selected button is scrolled into view with `scrollIntoView({inline:"nearest"})`. One model and no timelapse: no strip and no caption, as before.

**The button.** `pp-modelbtn`, 76px: a square on `surface-2`, the file name truncated under it. **With a per-model render** the square is that render (`object-fit: contain`), which is what the gap asked for. **Without one** it is the file-type glyph (`box` for STL, `package` for 3MF) and the name — it is *not* the print's own thumbnail, because then every button in the strip would be the same picture, which is the state the gap describes. No button is ever the filament colour: see GAP-071 in SpoolSwatch.

**The timelapse (GAP-096).** A video is one more button in the same strip, `pp-modelbtn video`: the neutral ground, the 20px play badge (`pp-play`) and the duration under it (`span.dur`, "4:12") instead of a file name that nobody reads. **No poster frame** — the container has no video decoder and the owner decided none goes in, so there is nothing to show and we do not pretend otherwise (GAP-089). Choosing it swaps the 4:3 `pp-viewer` for the 16:9 `pp-video` in place, at the same maximum width, with the caption "Timelapse: {bestandsnaam}"; the browser's own controls play it, no autoplay. Choosing a model swaps back. The dialog player of 1.9 stays for the play button in the file list; this is the same component shown inline.

**Group label.** "Modellen en timelapse" when the strip holds both, "Modellen" with models only, "Timelapse" when a print has a video and no model (one button, so no strip is drawn — the viewer *is* the video and the caption names it).

**Accessibility.** Unchanged, plus: the video button's accessible name is "Timelapse {bestandsnaam}, {duur}"; the viewer's `aria-label` follows the choice ("3D-voorbeeld van {naam}" or "Timelapse van {naam}"); the play badge is decorative.

**Dutch copy (new).** Modellen en timelapse | Timelapse | Timelapse: {bestandsnaam} | Timelapse {bestandsnaam}, {duur} | Timelapse van {naam}

**To measure (owner):** still the 1.9 question, now for a different reason — the largest and median number of models per print, and how many prints hold both models and a timelapse. The strip has no count limit any more, so the number only tells me whether the fade and the scroll are enough or the strip should wrap to two rows above some count. And: **does the renderer produce one PNG per model file, or one per print?** The spec covers both, but I would like to know which branch is the normal one.
