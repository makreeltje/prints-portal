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

**2.0.1.** (2026-10-08) **A strip of 29 is not a strip of 8 (GAP-094, reconsidered on your measurement).** You measured median 3, max **29**, and **22% of prints over six models**, with **one PNG per model file**. Two of those three numbers change my answer.

- **The Select stays rejected** and that part is settled: with a render per model file the buttons are real pictures, so a list of file names is strictly less information. Nothing about 29 makes a Select better.
- **But one scrolling line does not survive 29.** 29 buttons at 76px plus gaps is about 2,400px against a 560px frame: four screens of sideways scrolling with no sense of position. That is the failure the gap describes, moved to a new place.
- **So the strip wraps instead of scrolling sideways, above 8 pictures** (models plus the timelapse): `pp-models wrap` — `flex-wrap: wrap`, `overflow-y: auto`, `max-height: 304px` (three rows of buttons plus the gaps), and `is-overflow` then fades the **bottom** edge rather than the right. Same buttons, same group, same one control; only the shape changes, and vertical scrolling is the gesture people already have in the page. 29 models at 560px is 6 columns × 5 rows, three rows visible.
- **Threshold 8**, because the one-line strip shows about 6.5 buttons at 560px: at 8 you are already scrolling past more than one strip-width. Median 3 means most prints never see the wrapped form; 22% do.
- When it wraps and scrolls it is a focusable labelled region (`tabindex="0"`, `aria-label`), per the 1.8 rule — the preview shows it that way. The caption keeps saying "Model {n} van {totaal}", which is how you know where you are in 29.
- **A render per model file is now the normal branch**, not the exception. The glyph-and-name fallback stays specified for a file the renderer could not read.

**Changed classes.** `.pp-models.wrap` (new), `.pp-models.wrap.is-overflow` (bottom fade instead of right).

**Nothing more to measure here.** Your three numbers answered it.


**2.3.** (2026-10-08) **One line that scrolls, and buttons shaped like what they actually hold (GAP-116, resolved).**

Two things arrived together: the owner overruled 2.0.1's wrap, and the implementer withdrew the measurement 2.0.1 was built on. The second is the bigger one.

**The strip scrolls sideways at every count. Confirmed as the owner built it; `.pp-models.wrap` is deprecated.** Measured for this library (models plus timelapse per print): median **4**, 64 of 83 prints at eight or fewer, 14 at 9–15, 5 above 15, largest **34**. The base `.pp-models` already scrolls sideways with a fading edge, so the deviation was only that `wrap` was never applied — and the owner decides which of two tolerable shapes the product has. `.pp-models.wrap` and `.pp-models.wrap.is-overflow` stay defined in `bundle.css`, marked deprecated and scheduled for removal in **3.0**, so nothing breaks on the way out. The cost, recorded rather than argued: at 34 buttons the strip is several frame-widths of sideways scroll with the caption as the only sense of position. That is the owner's trade, and the two mitigations below are what the system can do about it without spending a click.

**The correction, and what it costs: there are no per-model renders.** 2.0.1 was told "one PNG per model file" and used it to strengthen the rejection of the Select — real pictures beat a list of names. The thumbnail service renders **one image per print record**; there is no per-asset route. So every square would carry the same type glyph and 76px of name truncated to about 68px, which is precisely the state GAP-094 complained about, rebuilt in a new shape. The glyph-and-name fallback was written as the exception and is in fact the only case.

- **New: `.pp-models.compact`** — the strip's form when no button has a picture. The button is horizontal: a 20px type glyph (`box` for STL, `package` for 3MF, `play` for the timelapse), then the file name in mono `text-xs` beside it, at `--pp-control-h` tall, width to content up to `--pp-modelbtn-max` (**200px**), middle-truncated as file names are everywhere else. The name gets the width, because the name is the whole of the information.
- **The strip has one form for all of its buttons.** If any button has a real picture, every button is a 76px square (glyph inside for the ones without); otherwise all are compact. Never a mixed row of 76px squares and 36px rows — including the timelapse button, which takes whichever form the strip is in.
- **Order in the strip is file name ascending, the timelapse last.** It was implied by "the first model by file name" and never written down; with names as the only cue, a 34-long scroll is only navigable if the order is predictable.
- **The square form stays specified**, unchanged, for the day a per-model render exists. It is not dead text: it is what the strip becomes the moment the renderer gains an asset route.

**The duration is withdrawn (GAP-096's `{duur}`).** The indexer reads no duration, and reading one in the browser means fetching every video to draw a strip — **rejected**: a picker must not download the thing it is picking between. The video button's visible label is **"Timelapse"** and its accessible name is **"Timelapse {bestandsnaam}"**. `.pp-modelbtn .dur` stays in `bundle.css` for a strip that one day knows a duration; nothing sets it now. If the indexer ever reads durations server-side, the old form returns and only the copy key changes.

**The preview is rewritten**, because almost every state in it was drawn from the withdrawn measurement: the 2.0.1 preview showed squares with per-model pictures implied, a duration under every video button, and the wrapped form at 29. 2.3 draws the compact strip at **4** (the median), at **34** (the longest print, one scrolling line with `is-overflow` and the focusable region), the timelapse button in the same strip with no duration, the phone at 360px, the loading state, a video-only print, and the square form kept as a specimen for the day a per-model render exists.

**Dutch copy (changed).** "Timelapse {bestandsnaam}, {duur}" becomes **"Timelapse {bestandsnaam}"**; the visible button label is "Timelapse". Everything else is unchanged.

**Needs your measurement.** The **longest and median model file-name length** in the library, in characters, and how wide the longest one renders in mono `text-xs`. `--pp-modelbtn-max` is 200px because that holds about 28 mono characters, which fits the sample names; it is a value I chose, not one I measured, and if your names run to 40 characters I will raise it rather than have you do it. The form does not wait on the number — build it at 200px.


**2.4.** (2026-10-09) **The renders arrived, so the square is the normal form again — and a file name is cut in the middle, not at the end (GAP-116 resolved, GAP-119 resolved, the owner's "drop the name" rejected).**

2.3 kept the square form "for the day a per-model render exists". That day came from the owner: shown the compact strip they asked what had become of the small previews they had asked for long ago, and the honest answer was that there had never been any. The app now renders one PNG per model file. **281 of 376 models render today** (every STL; a 3MF only where it carries a plate image), median **60ms** cold, 12–51 KB each, 1ms cached. Measured on an 11-button print: **9 pictures, 9 of them distinct**, one row, overflow 0, axe 0.

**Both forms now earn their place, and the switch rule is confirmed as built.** The strip is square whenever **any** button can show itself, compact when none can, one form for every button in the row — which is what 2.3 specified and what the app does. 2.3's reason for the compact form (a square would be a glyph beside 68px of truncated name) holds exactly where no render exists, and nowhere else. `--pp-modelbtn-max` is therefore the minority case's number now, not the main one.

**The conflict with my own brand book, resolved: the name is cut in the MIDDLE.** `README.md` has said since 1.0 that file names are mono and middle-truncated, `.pp-asset .fn` on the same screen does it, and the compact form's spec said it in so many words — but `.pp-modelbtn .nm` was plain `text-overflow: ellipsis`, which cuts the end, so "Honeycomb.stl" read "Honeyco…" and **the extension was the first thing lost** on a strip that mixes STL with 3MF. That was my hole, in both forms (the square form's name was not even mono). Both forms now use **`.pp-fname`**, which is the mechanism `.pp-asset .fn` has always used, given a name so the next component does not have to reinvent it:

- `.pp-fname > .a` is the head and shrinks with an ellipsis; `.pp-fname > .b` is the tail and never shrinks.
- **The tail is the extension plus the three stem characters before the dot** — `_03.stl`, `ize.stl`. The app splits the string; CSS cannot.
- Both measured failure families survive it. Names that differ at the **start** — `obj_2_new card divider size.stl` through `obj_7_…`, the six buttons that share one picture — keep their head. Names that differ at the **end** — `Onderdeel_01.stl` through `_06.stl` — keep their tail, which end truncation throws away. Middle is the only direction that survives both, and that is the argument, not the convention.

**The owner's proposal — drop the name where a button has a picture — is rejected.** They are right about 66 of the 74 prints with two or more pictures, and right that a fragment without an extension can be worse than nothing. The reason I still say no:

- **A picture is an accelerator; the file name is the identifier.** The file system guarantees the name is unique inside a print. Nothing guarantees that of a render.
- **The exception cannot be keyed on identical pixels.** The measurement found 8 prints with renders at distance 0, but perceptual identity is not pixel identity: two parts that differ by 2mm render two pictures at distance 1 that nobody can tell apart at 112px, and a rule keyed on 0 would call them distinct and hide both names. The measured library is full of exactly those families (`Onderdeel_01`…`_06`, `Pen_kort`/`Pen_lang`, `Hoekstuk_01`…`_03`). A rule that is wrong in the hard case and invisible in the easy one is worse than no rule.
- **The real complaint was the fragment, so the fragment is what changed.** 68px of end-truncated name was close to worthless; 112px of middle-truncated name is "obj_2…ize.stl" and "Onder…_03.stl" — the discriminating character and the extension, both there.

What I take from the proposal is its measurement: the picture carries most of the load now, so the *name* no longer has to be complete. It has to keep its two ends.

**The square is 120px, not 76px.** `--pp-modelbtn-w` (a `bundle.css` variable, like `--pp-name-min`, not a token). 120px of button = **112px of picture** and 112px of name = **15 mono characters at `text-xs`**: 7 + the ellipsis + 7. That is the narrowest width at which both ends stay legible, and the median print (4 pictures) still shows every button inside the 560px strip without scrolling (4×120 + 3×8 = 504). The cost, stated rather than hidden: 4.4 buttons per frame instead of 6.8, so the longest print scrolls further than it did. One width at every breakpoint — a picture button is not a 36/44px control, and the strip scrolls on a phone the way it does on a desktop.

**A per-model render carries `.pp-art`.** It is a picture this app made, so 2.3's rule applies unchanged: the **page** outlines the silhouette from the picture's own alpha channel in `border-strong` (3.69 light / 3.32 dark over the `surface-2` well), and nothing is baked into the PNG. This also settles the render half of GAP-071 for the strip without the renderer doing anything. A model file the renderer could not read keeps its type glyph (`box` for STL, `package` for 3MF) on the same well, so "no picture" and "picture" sit on one ground.

**A name that does not fit is read without choosing the button: the system's tooltip.** `.pp-tip` in the window-placed **`.at`** form, carrying the full file name, **only when the name is actually truncated** (the app knows: `.a` overflows) and never when it fits — a bubble that repeats a visible label is the thing Tooltip's README forbids. The button is a real control, so the bubble appears on hover **and** on keyboard focus, with no delay, and there is no new tab stop. Under *Name or description* this bubble **is** the trigger's name (the accessible name "Model {naam}" already carries it in full), so it is `aria-hidden="true"` and there is **no `aria-describedby`**.

**The bubble is not a child of `.pp-models`.** The strip scrolls and `.pp-models.is-overflow` carries a `mask-image`; a mask creates a stacking context, so a fixed bubble painted over the strip's fading edge fades with it. A mask is now the fourth property in *Floating panels* rule 8, beside `transform`, `filter` and `backdrop-filter`.

**Rejected alongside it:** letting the caption follow the hovered button instead of the selected one. It costs no new mechanism, but it moves a line of text 100px away from the thing being pointed at, it lies about what is selected, and it is no better on touch.

**Touch, said plainly.** On a phone there is no hover and no focus before activation, so the bubble is not the path there. What is: the caption names the selected model in full (`.pp-model-cap b` wraps rather than truncates), the order is file name ascending, and choosing is cheap and reversible — 60ms cold, 1ms cached, and the strip stays put. This is an accepted limit, not an oversight.

**The compact form keeps its shape and gains width.** `--pp-modelbtn-max` goes from **200px to 240px** on your measurement: median name 25 characters / 181px, and 181 + 52px of button chrome = 233. So the median name now fits whole. p90 (57 characters, 412px) and the longest (105, 759px) fit in no width that leaves the strip a picker — a 412px button in a 560px strip shows 1.3 buttons — so they truncate in the middle and the bubble carries them. 200px was a value I chose; 240px is one your numbers chose.

**Unchanged:** the order (file name ascending, timelapse last), the caption, the group labels, the scroll region rule, "Model laden…", the one-model and video-only cases, the timelapse button without a duration, and `.pp-models.wrap` — still deprecated, still going in 3.0.

**Anatomy (replaces the 2.0 line).** Square form: a 120px button holding a 112px picture well (`.pp-thumb`, `surface-2`) — the per-model render as `img.pp-art` with `alt=""` (decorative; the button carries the name), else the 24px type glyph, plus the 20px `pp-play` badge on the timelapse — with the file name under it in mono `text-xs`, middle-truncated (`.nm.pp-fname`), `text` ink and `text-strong` when selected. Compact form: `--pp-control-h` tall, width to content up to 240px, a 20px glyph then the same name element beside it.

**Drawn in the preview:** the median print with four renders; the measured 11-button strip with its two glyph squares; the six-button print whose renders are identical; the bubble over a truncated name in a 600px frame (`.pp-device.pane`, a preview helper); the compact strip with a 59-character name and its bubble; the longest print at 34; the phone at 360px; loading; one model; video only. The stand-in pictures are inline silhouettes, because the system ships no image files — the real ones are PNGs the app serves.

**Needs your measurement.** The head is 7 characters because 7 is where the two measured families separate, and that is a judgement sitting on top of your numbers. The number that would change it: **within a single print, how many model names share their first 7 characters with another model in that print, and how many share their last 7?** If prefixes collide often (`obj_12_…` against `obj_17_…`, or a `Onderdeel_` family of twelve), the head needs more characters and I will widen the button rather than let you widen it. Build at 120px meanwhile.

**Also worth a number, not blocking:** how many prints end up in the **compact** form now — prints where no model and no 3MF can show itself. If it is a handful, `--pp-modelbtn-max` is nearly dead text and I would rather know that than keep sizing it.


**2.5.** (2026-10-09) **All five measurements came back before 2.4 was imported, and two of them bite. The button stays at 120px; what moves is the split (GAP-119 extended, GAP-116 confirmed, GAP-071 closed).**

Nothing of 2.4 was built when these arrived, which is the cheapest moment to be wrong.

| Measured | What it did to 2.4 |
|---|---|
| **29%** of within-print pairs share their first 7 characters; 10% share their last 7 | **Changed the spec.** The head is the half that collides, and the window needed a rule, not more pixels |
| Median name **217px**; **90%** still overflow 112px | **Confirmed 120px** and retired the idea that width is the lever. Measured at the wrong size, though — see below |
| **1** of 79 prints reaches the compact form | **Confirmed `--pp-modelbtn-max` is nearly dead text.** Kept, demoted, not re-tuned |
| 3MF plate images: **0 of 20 opaque** | **No second branch.** One outline rule for both kinds of picture |
| 29 pictures with `.pp-art`: p95 **17.4ms vs 17.2ms**, 0 frames over 20ms | **GAP-071's paint question closed** and 2.3's reserve fallback withdrawn |

**120px stays, and your own second number is why.** Going from 68px to 112px of name box — 65% more width — bought **6 points** of overflow, 96% to 90%. Width is not the lever and cannot be: at 7.24px per monospace character the median name (25 characters, 181px) needs a **189px** button, which is 2.9 buttons in the 560px frame, and p90 (57 characters) needs **420px**, which is 1.3. A picker that shows one button is not a picker. So the name is a fragment on most buttons at every width that keeps the strip usable, and the question stops being *how much* of the name is shown and becomes *which part*.

**The spec change: no two buttons in one strip may show the same label.** The default split — the extension plus the three stem characters before the dot — is now the **starting point**, not the rule. The app extends the tail one character at a time until every rendered label in that strip is distinct, with the head's floor at two characters plus the ellipsis. Worked, from your own family:

```
Onderdeel_01.stl        -> Onderde…_01.stl      distinct already: the difference is in the tail
Onderdeel_06.stl        -> Onderde…_06.stl

Onderdeel_01_links.stl  -> Onderde…nks.stl      collides: same head, same tail
Onderdeel_06_links.stl  -> Onderde…nks.stl
   tail extended to 11  -> Ond…1_links.stl      distinct
                        -> Ond…6_links.stl
```

One correction, offered gently because it matters for which case we are fixing: **`Onderdeel_01.stl` against `Onderdeel_06.stl` is not the failure** — those two differ inside the tail, which is the half the split always keeps, so they read differently under 2.4 as published. The failure is the same family **with anything after the number**, and that one is real and your 29% is what exposes it.

**Why this exception is allowed when the pixel-identity one was not.** GAP-119 rejected "drop the name where the renders are identical" because *looks the same* is not computable — perceptual identity is not pixel identity, and a distance-0 rule would call two indistinguishable parts distinct. *Reads the same* is a different kind of thing: exact string equality, over a handful of strings in one strip, deterministic, no threshold, no perception. The rule fires or it does not, and it is checkable by looking at the strip. That is the line between the two, and it is worth keeping in mind the next time a rule wants to compare two things.

**Where even the longest tail cannot separate two names, nothing happens.** The label keeps its default split and the bubble and the caption carry it. The strip must not thrash its own text to chase a difference it cannot show; a picker whose labels shuffle as you scroll is worse than two labels that agree.

**Monospace is load-bearing, not decoration.** The window is computable only because every character has the same advance: the app can count the characters that fit from the box width without measuring glyphs. That is also why the split is the app's job and the **cut** is still CSS's — `text-overflow` cuts at the real rendered width, so a text zoom, a font fallback or a non-ASCII name degrades correctly, while a character count would be wrong by exactly as much as it guessed.

**Your measurement 2 was taken at the wrong size, and the number that matters is the character count.** You wrote "mono at `text` (15px), which is what 2.4 sets". `text` is the **ink** token (`#2b3150` / `#c0caf5`); the size `.pp-modelbtn` sets is `--text-xs`, **12px**. At 12px the 112px box holds **15.47 characters**, which is the 7 + ellipsis + 7 the design is built on; at 15px it holds **12.38**, which leaves the head 4 characters and quietly breaks it. Your 217px median is 181px at `text-xs`, exactly your earlier figure. The conclusion stands either way — most names are fragments — but **the invariant to build and check against is: the name box holds 15 monospace characters at `text-xs`.** If it ever holds 12, the size is wrong, not the split.

**The bubble is the normal path, and the system now says so.** At 85–90% truncation, "only when the name is truncated" is in practice "almost always", and it was wrong of 2.4 to call it the exception. The condition stays — it is `scrollWidth > clientWidth` on `.a`, it costs nothing, and the names that do fit should not carry a bubble that repeats them — but a bubble that is nearly always there has to stay cheap, and everything that keeps it cheap is already in Tooltip: one at a time, no delay, `aria-hidden`, pointer and focus only, never a tab stop of its own.

**The compact form: kept at 240px, demoted in writing, not re-tuned.** One print of 79. I am not going to tune a value that governs a single print, and I am not going to delete the form either: 95 of 376 files are 3MF, the renderer's coverage is a moving target, and one print added tomorrow with two plate-less 3MFs takes that branch. It is **specified and nearly unexercised** — the same standing as Popover's sheet floor, and said in the same words so neither of us mistakes it for a tested path.

**`.pp-art` covers a 3MF plate image too.** 0 of 20 opaque, so every picture in the strip has a silhouette and one rule outlines all of them. The second branch 2.4 asked about is not needed and is not written.

**Two lines of name: considered, rejected.** Two lines of 15 characters would hold the median name (25) whole, which is the most tempting answer to "90% are fragments". Against it: the `.a`/`.b` mechanism cannot middle-truncate across two lines (a line clamp's own ellipsis eats the tail), so the app would have to insert the ellipsis and fix the window in characters — losing exactly the robustness the CSS cut buys; it still fails p90 and the longest name; and it makes the button 156px tall. If the uniqueness rule turns out not to be enough, this is the next move and it is a 3.0-sized change to the mechanism, not a tweak.

**Unchanged:** 120px, 112px of picture, the two forms and the switch rule, the order, the caption, the group labels, the bubble's `.at` form and its mount outside `.pp-models`, every class. **This round changes no CSS at all.**

**Needs your measurement.** None of it blocks the build; each verifies a decision that is otherwise settled.

- **The intersection, which is the number I actually wanted.** How many within-print pairs share their first 7 **and** their last 7 characters? That is the collision rate of the rendered label; 29% and 10% are the two margins and the truth is at most 10%. It tells us how often the uniqueness rule fires, not whether it is right.
- **How often the rule cannot separate a pair** even with the tail at its longest — a difference that is beyond about 13 characters from the right and beyond 2 from the left. If that is more than a handful, two lines comes back on the table.
- **The 112px overflow count re-measured at `text-xs`** (12px), so the figure in the record is the one the app renders.


**2.6.** (2026-10-09) **The rule extends both ends, and where it still cannot reach, the system says so instead of reaching further (GAP-119, closed with a named residue).**

Three measurements came back and two of them change this. Nothing is built yet.

**You were right that the mechanism only ever extended one end, and there was no reason for that.** The split now grows **whichever end reaches the difference**: the tail first, then the head, with two floors that are the component's own promises — **the extension always survives** (which is what GAP-119 was raised about, so the tail never shrinks below `.stl`/`.3mf`) and **the head keeps at least two characters**. One clause, strictly more capable, and it cannot make anything worse: where there is no collision nothing moves.

**And the window has a blind zone, which is now written down rather than discovered.** At 15 monospace characters the window shows a difference at left-index *d* only if

```
d < 10              (the head, with the tail at the bare extension)
d >= len - 12       (the tail, with the head at its floor of two)
```

so **every name longer than 22 characters has a zone in between that no split can reach.** The median name is 25. Measured in this library: 55 of 1682 within-print pairs share both ends (3.3%), the extension rule separates **15**, and **40 fall in the blind zone** — the dominant shape being a number in the middle of a long name:

```
Babybox lock corner 20 inner width.stl     ->  Babybox…dth.stl
Babybox lock corner 21 inner width.stl     ->  Babybox…dth.stl     the number is at index 20 of 38
Babybox lock corner 22 inner width.stl     ->  Babybox…dth.stl     longest tail: Ba…er width.stl, still identical
```

**I am choosing to accept those 40 deliberately, which is your option four.** What carries the strip there is not the label: it is the **picture** (which distinguishes 66 of 74 multi-picture prints), the **order** — file name ascending, so a numbered family stands in numeric order and position is monotone — the **caption**, which names the selected model in full at all times, and the **bubble**. The label's job in a picker is to let you choose, not to identify; identification is one hover or one click away and a click costs 60ms cold, 1ms cached, and is reversible. Both of the alternatives that would reach the number cost more than that:

- **Two lines of name (a 30-character window) does reach it**, and I checked rather than assumed: the tail can grow to 27, the blind zone closes for every name up to **52** characters, and the trio reads `Ba…k corner 20 inner width.stl`. It costs the button 16px of height (140 → 156), and it costs the **mechanism**: `text-overflow` cannot cut a two-line box, so the app would have to insert the ellipsis and trust a character count — and the count is not trustworthy, because `--font-mono` is a fallback stack whose advances differ by platform (0.5em to 0.65em), so 15 characters per line is ±2 depending on which monospace the OS supplies. Today CSS cuts at the real rendered width and that error is invisible. **This is the move if the owner looks at those families and calls the strip unusable** — it is costed, it works up to 52 characters, and it is a 3.0-sized change to the mechanism, not a tweak.
- **A middle window** (`head…diff…tail`) does not fit: the trio needs 5 + 1 + 2 + 1 + 7 = **16 characters** in a 15-character box, it needs a second ellipsis that no CSS rule inserts, and it buys the middle by giving up either the family name or the extension.
- **Widening the button** to close the zone for a 38-character name needs **174px** — 3.1 buttons per frame against today's 4.4 — and p90 would need 243px. 2.5 already retired width as the lever on your own figures.

**Where the longest split still collides, nothing moves.** The label keeps its default split, the bubble and the caption carry it, and the strip does not re-split its own text to chase a difference it cannot show. Labels that shuffle as you scroll are worse than two labels that agree.

**Two files with the same name: my sentence was wrong and the conclusion is not.** 2.4 said the name stays partly because "the file system guarantees the name is unique inside a print". It does not — you measured 3 pairs in 2 prints, because a print gathers files from more than one folder — and that sentence is **withdrawn**. The reason that survives is better: **the name is the field the rest of the system refers the file by.** The caption, the file list, the download, the duplicate badge and the invoice all speak in names; a picture refers to nothing and cannot be quoted. And the duplicate case strengthens the answer rather than weakening it — two buttons reading the same label state a fact the operator needs ("there really are two files called this"), where two buttons with no label state nothing and invite the wrong click.

**So the duplicate case is not a truncation problem and must not be treated as one.** You said you would build the bubble to show two identical names and would not special-case it: that is right, it is now the spec, and nobody should "fix" it later. The place that *explains* a duplicate is the file list, which already has the words — the `warning` badge **"Mogelijk dubbel"** and its hint in AssetListItem. **One question for you, and it is not rhetorical:** do those 3 pairs actually raise that badge? It is specified for a duplicate *file*, and two files with the same name in different folders may or may not reach it. If they do, the picker needs no new words because the explanation sits one card below. If they do not, that is a gap on your side worth logging, and it is about the file list, not the strip.

**Unchanged:** 120px, 112px of picture, the two forms and the switch rule, the order, the caption, the bubble's `.at` form and its mount outside `.pp-models`, every class, every token. **2.6 changes no CSS either** — 2.4, 2.5 and 2.6 are one import.

**Drawn in the preview (the two cases the system does not solve, drawn rather than omitted):** the `Babybox lock corner 20/21/22` trio with three identical labels and one picture between them, and a print holding the same file name twice with its bubble showing that name twice.

**Nothing left to measure here that changes the answer.** The one open question was the `Mogelijk dubbel` badge above, which is about AssetListItem; it is measured and answered in 2.7, at the end of this file.

**2.7 — the open question is answered, and the answer was no (GAP-120).** 2.6 asked whether the 3 duplicate-name pairs raise "Mogelijk dubbel" in the file list, and said that if they did not, that was a gap about the file list. They do not: both rows come back `possibleDuplicate: null`, measured on the print that holds `Babybox lock corner 2.stl` twice. The badge is for a duplicate *file* as the indexer decides it — same content — and these are two real files sharing a name across folders.

**AssetListItem 2.7 carries it, and not with that badge.** The file list gets one neutral `.pp-reason` line on **both** rows, "Twee verschillende bestanden met dezelfde naam. Dit is het bestand in map {map}." The `warning` badge was deliberately not widened: its hint tells you to delete one file and raise the other's count, which would drop a real file from the invoice.

**Nothing in the strip changes, and that is a decision rather than an omission.** No badge on the button, no extra word in the label, no special case in the bubble. A picker's label is for choosing; the sentence that explains a data condition belongs where the files are listed, one card below, which is where it now is. So the strip still draws two identical buttons for such a pair — on purpose, with the explanation on the page — and 2.6's spec stands unchanged, including the bubble showing the same name twice.

**2.7 — the timelapse glyph is `film`, and the prose was wrong (no gap number; raised in `implementation.md`).** 2.3's compact-form note says the type glyph is "`box` for STL, `package` for 3MF, **`play`** for the timelapse". The preview has always drawn **`film`** — the rect with sprocket paths — and the app is built that way, because a play triangle on its own did not read as video to the owner. **The preview is the intention and that word is withdrawn.** The system already draws this distinction and I broke my own rule writing that line: `film` says *what the file is* and is the type glyph wherever a file is named (AssetListItem's video row has used it since 1.9); `play` says *what pressing does* and is only ever an action — the `Afspelen` button in the file list, and the 20px `.pp-play` badge that sits **on top of** the well in the square form, where it has a picture or a film glyph underneath it. So the square button keeps both, in that order, and the compact button has the film glyph alone. Nothing changes in the app; one word changes here.

**2.15 — the strip button's resting edge is `border-strong` (GAP-169's system half).** `.pp-modelbtn`
is a real control (`aria-pressed`, 120px, its own `surface` ground) and its only resting boundary was
`1px solid var(--border)` — **1.37:1** in dark, **1.42:1** in light, where WCAG 1.4.11 asks 3:1 of the
boundary that identifies a control. It is now **`border-strong`** (3.75 / 4.29 on `surface`).

**Its hover cue moves to the ground**, because `border-color: var(--border-strong)` was the hover and
is now the resting state: `.pp-modelbtn:hover { background: var(--surface-2) }`, the same hover
`.pp-btn-secondary` has had since 1.0. **The pressed state is unchanged** — `primary` border,
`primary-tint-soft` ground, `text-strong` label — so the three states are now a ground change, a
border colour change and a label change, each distinct from the other two. No new token, no new
colour pair, no change to the 120px, the picture, the labels, the order or the bubble.
