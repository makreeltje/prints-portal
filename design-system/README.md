Design system for **3D Prints Portal**, a self-hosted web app that indexes print files, prices them, tracks payment and shares read-only pages with customers. The operator UI is a calm, precise workshop tool; the customer share page and the PDF invoice are the same brand, lighter and more spacious. All UI copy is Dutch (nl-NL). This is version 2.12 (see `changelog.md`).

## Principles

1. **Status first.** Show Betaald/Open, Gearchiveerd and missing-data badges before anything else on a card or row.
2. **Numbers are content.** Set every figure with tabular numerals (`font-variant-numeric: tabular-nums`), right-align money, always show units.
3. **Dense but breathable.** Compact tables on a 4px grid, generous gaps between sections (`space-6` to `space-8`).
4. **The filament colour is the only decoration.** Keep chrome neutral (`bg`, `surface`, `surface-2`, `border`); let spool swatches, tinted thumbnails and the 3D preview carry colour.
5. **Customer-facing is friendlier.** On the share page and invoice use `text-md`, larger `space-*` steps and `radius-xl`; never show internal cost.
6. **Accessible by default.** Meet WCAG 2.2 AA (see `contrast.md`), never use colour alone for status, keep touch targets at 44px or more on phones.

## Colour

- Default theme is `dark`; `light` is the second theme. Apply with `[data-theme]` on `html`, and fall back to `prefers-color-scheme` when no theme is stored. The consuming app must provide this fallback block; the generated `tokens.css` only has the `[data-theme]` blocks.
- Put pages on `bg`, cards, tables, dialogs and inputs on `surface`, nested or hover grounds on `surface-2`. Body text is `text`, headings and money are `text-strong`, secondary text is `muted`.
- **A boundary that carries meaning is `border-strong`; a hairline between content and content is `border` (2.15).** `border` measures 1.37:1 on `surface` in dark and 1.42:1 in light, so it can be a card, dialog, popover or panel edge, a row or list divider, the rule under a card header, a media frame — and nothing that identifies a control, its extent or one of its states. Everything that does takes `border-strong` (3:1 or more on `bg`, `surface` and `surface-2` in both themes): inputs, checkboxes, radios, toggles, the secondary button, a segmented control's **track**, the guest head's nav track, a model strip button. The test is not what the element is but what the line is doing: if removing it would leave you unable to see where the control is or which state it is in, it is `border-strong`.
- Use `primary` for the single main action per view, links and active navigation; text on a primary fill is `on-primary`. Use `primary-tint-soft` for row hover, `primary-tint` for selection and live-update flashes, `primary-tint-strong` for pressed states.
- Status colours: `paid` (Betaald, check icon), `unpaid` (Open and Afgeschreven, clock or ban icon, also destructive actions), `warning` (missing spool, price or cost, triangle icon), `info` (notices, "voorgesteld"). Badge ground is the matching `*-tint`; badge text is the status colour. Pair `paid` and `unpaid` with an icon and a word every time; they differ in lightness, not only hue.
- Focus: draw `2px solid var(--focus-ring)` with a 2px offset on every interactive element. Dialogs and sheets sit on `overlay`. Skeletons use `skeleton`.
- Tags and spools carry user-chosen colours. Choose tag text between `#141a33` and `#ffffff` by relative luminance (pick the one with the higher contrast). Never recolour a spool swatch to fit the theme.
- Charts: use `viz-1` to `viz-5` in order for categories; they avoid the paid/unpaid/warning hues, so do not put `viz-4` beside `unpaid` in one chart. Use `viz-seq-1` to `viz-seq-5` for magnitude; label the two lowest steps in text.

## Typography

- Use the system sans stack (`--font-sans`) for all UI and `--font-mono` for file names (middle-truncate them), G-code names, hashes, paths and tokens. No web fonts are loaded.
- **Middle truncation has a name since 2.4: `.pp-fname`.** `.pp-fname > .a` is the head and shrinks with an ellipsis, `.pp-fname > .b` is the tail and never shrinks, and the tail is **the extension plus the three stem characters before the dot** (`_03.stl`, `ize.stl`). The app splits the string; CSS cannot. Never cut a file name at the end: the extension is often the only thing that tells two names apart, and in an enumerated family (`Onderdeel_01` … `_06`) so is the character before the dot. `.pp-asset .fn` has carried these rules since 1.2 and is the same thing under an older name.
- **That tail is a starting point, not a fixed length (2.5, both ends since 2.6).** Where truncated names must be told apart **in one row** — a picker, a strip, a set of toggle buttons — no two of them may render the same label: the app grows **whichever end reaches the difference**, the tail first and then the head, against two floors **and a ceiling** — the **extension always survives**, the head keeps **two characters**, and **the tail never exceeds `W - 1 - 2` characters including the extension**, which at the strip's 15-character window is **12**. The ceiling is not decoration: two floors alone do not bound the sweep, and an implementation that grew the *stem* to `W - 1 - 2` and then added the extension to it proposed a 16-character tail in a 15-character box — a label longer than its own window, whose head CSS then cuts to nothing. So the sweep is over the **tail**, from `extension + 3` up to 12 and then back down to the bare extension; the head is `W - 1 - tail`. For a four-character extension that is a stem of at most 8. (Added 2.8, GAP-135: the floors were written down in 2.5 and the ceiling was not, and it was derived wrongly in good faith.) This is allowed where a comparison of *pictures* is not, and the difference is the point: two labels are exactly equal or they are not, over a handful of strings, with no perception and no threshold. A vertical list (`.pp-asset .fn`) does not need it — names there sit under each other and can be compared — and does not have it.
- **A truncated window has a blind zone, and the design names it rather than hiding it (2.6).** A window of *W* characters shows a difference at left-index *d* only if `d < W-5` (the head, tail at the bare extension) or `d >= len-(W-3)` (the tail, head at its floor), so **every name longer than 2W-8 characters has a middle zone no split can reach**. At the model strip's 15 characters that is every name over 22, against a median of 25. Measured there, and it is **three buckets, not two**: of 1682 within-print pairs, **55 share both ends** — **3** have byte-identical names, **16** the rule separates, **36** are unreachable. The three identical pairs are **neither separated nor unreachable**: the rule never runs on them, because there is nothing to tell apart. That is a statement about the rule's **domain**, not a failure of it, and the arithmetic only closes when they are counted as their own bucket — `55 - 36 = 19` silently counts them as separated, which is why no sum should be taken from two of three numbers. *(**These figures are measured against the rule as written, not against what the app renders.** The two coincide on this library — every stem fails on the one colliding print, so the fallback renders a tail of 7 throughout, verified in the browser — but on a library where the sweep fires they could differ, and a design system should not quote a number as rendered when it was counted from a re-implementation of its own spec. Read them as what the rule does, which is the thing this section is about. The figure read **40** from 2.6 until 2.8. 40 came from a sweep of the tail at 7–13 absolute, which is both too narrow at the bottom and over the ceiling at the top; swept as the rule above defines it the answer is 36. The decision never turned on 36 against 40 — both are "more than a handful" — but the number was wrong and is corrected rather than quietly kept.)* Do not chase the residue by re-splitting as the reader scrolls: where the label cannot discriminate, say so in the component's README, and let the picture, the fixed order, the caption and the tooltip carry it.
- Body is `body` (15px/22px, tokens `text-base` and `leading-base`, set once by the `body` rule in `bundle.css`); every font size has a matching line-height token (`leading-xs` 16, `leading-sm` 20, `leading-base` 22, `leading-md` 24, `leading-lg` 26, `leading-xl` 28, `leading-2xl` 32, `leading-3xl` 40); dense table cells use `body-sm`; badges and meta use `caption`. Page titles use `heading-2xl`, section titles `heading-xl`, card and dialog titles `heading-lg`, stat-tile figures `heading-3xl`.
- Set inputs at 16px (`body-md`) on phones to prevent browser zoom. Keep text lines under about 80 characters on wide screens.
- The `text-xs` … `text-3xl` tokens are the raw sizes behind these styles.

## Spacing, radius, elevation, motion

- Use `space-1` … `space-8` (4, 8, 12, 16, 20, 24, 32, 40px). Card padding is `space-4`, table cell padding `space-2`/`space-3`, gap between sections `space-7`.
- `radius-sm` badges and chips, `radius-md` buttons and inputs, `radius-lg` cards, tables and popovers, `radius-xl` dialogs and share-page panels, `radius-pill` segmented controls and avatars.
- Prefer borders over shadows. Use `shadow-sm` for hover, `shadow-md` for popovers and the spool picker, `shadow-lg` for dialogs and the sticky mobile bulk bar.
- Transition with `motion-fast` (hover, focus, toggle) and `motion-base` (popovers, dialogs, toasts, row flash) using `motion-ease`. Under `prefers-reduced-motion: reduce` set every duration to 0ms and replace the live-update flash by a static `primary-tint` background.

## Responsive

Breakpoints: up to 480px phone, 481–900px tablet, 901px and up desktop, 1440px and up wide. On phones tables become stacked cards, the bulk bar sticks to the bottom, dialogs become full-height sheets and the 3D viewer sits above the fold at a fixed aspect ratio. The app shell switches with media queries (see AppShell): sidebar above 900px, a 56px icon rail from 481 to 900px, top bar, bottom bar and drawer at 480px and below; the app never sets a `.phone` class. Never scroll the page horizontally; scroll wide tables inside their own container with a visible edge shadow.

**A phone rule is not delivered until it has a `.pp-device.phone` twin (2.11).** A preview frame is
a 360px **container** at the page's own viewport width, so no `@media (max-width:480px)` rule ever
fires inside it: the frame draws the *desktop* layout and a phone-only fault is invisible here
until the app renders it. GAP-151 was exactly that — a badge taking 192px of a 326px row, leaving
the name 90px, measured in the running app and unshowable in the preview that specified it. So
every phone rule in `bundle.css` is written twice: once in the media query, for the app, and once
as `.pp-device.phone <selector>` with the same declarations, for the frame. The twin is preview
markup only; the app still never sets `.phone`. When the two disagree, the media query is the
truth and the twin is a bug in the preview.

**A slot has a type, and the reason is that a track is shared (2.12).** In a grid whose rows share
their columns — which every two-row phone layout in this system is — the widest thing in an `auto`
track sets the width of everything above and below it. So a slot is not a free rectangle: `.ttl`
takes the name and what the thing *is*, `.age` the age badge, `.amt` a **figure**, and a sentence
in a figure slot is a layout bug waiting for a long screen. 2.10 put "waarvan {n} zonder bestanden"
in `.amt` on ScreenQueue; at 360px it took 181px of the shared track and left the heading beside it
**109px**, so a two-word heading wrapped to two lines while the group next to it had 274px on one.
The badge 2.11 added into the other half of that row then overprinted the sentence by 10px — and
holding the badge back removed the overprint and **left the squeeze**, which is how the cause was
found. Name a slot's type in the component README, and when a fact does not fit a slot's type, move
the fact, not the layout (GAP-155, OutstandingGroup).

## Floating panels (2.2)

Everything that floats beside a trigger — Popover, SpoolPicker, TagEditor, OverflowMenu, DatePicker, Tooltip — obeys one rule: **it is never drawn outside the window, and it never makes the page scroll to reveal it.** Measured in the app: a spool picker (320x302) on a file row low in a long print detail opened at y=831 in a 900px window, so 233px of it was below the fold, and a tooltip on a card in the last column ran 116px past the right edge. Both were the same hole in this page — no rule at all — not two bugs.

1. **The app chooses the side, per axis, before the first paint**, from the trigger's rect and the panel's own height: down by default, `.up` when the room below is less than the panel's height and the room above is more; left-aligned by default, `.end` when a left-aligned panel would pass the right edge less `space-4`. A panel that reopens after a scroll is measured again.
2. **The app passes the room it has**, less `space-4`: `--pp-pop-max` for a popover, `--pp-tip-x`/`--pp-tip-y` for a tooltip's rect. These are inline data properties, like `--c1`: the app passes numbers it measured, never lengths it chose. Every length — offset, radius, maximum width, the sheet's height — stays in `bundle.css`.
3. **The panel caps itself and scrolls its own region.** A list inside the panel keeps its 240px as the height it *prefers* and shrinks below it only when the panel is capped, so a panel with room looks exactly as it did and the search field above the list stays in view.
4. **Under 240px of room on the better side, the panel becomes a bottom sheet** at any width (`.pp-anchor.sheet`), the form phones already get. 240px is the height of the list caps: below it a panel cannot show its list, and a sliver of scroller is worse than moving.
5. **A tooltip whose trigger sits inside anything that clips or scrolls** (`.pp-print` is `overflow:hidden`, a table lives in `.pp-scroll`) uses the window-placed form `.pp-tip.at`. Stacking tokens do not help there: a sticky cell paints over `z-popover` inside a scroll box (GAP-098), and `overflow:hidden` cuts off whatever `z-index` says.
6. **Every floating thing has that window-placed form (2.3).** 2.2 gave it to the tooltip only, so a popover inside a clipping card was still cut off: `.pp-pop.at` is the same rule with the same words (`--pp-pop-x`, `--pp-pop-y`, `--pp-pop-max`). A panel in `.at` form is re-measured while the page scrolls and closed when its trigger leaves the window, because a fixed box does not follow the page.
7. **A window-placed panel resets the edges it does not use, and never sits inside a `.pp-anchor` (2.3).** An anchor is an offset parent; a window-placed panel has no offset parent. The one that leaked cost a real bug: `bottom` survived from the anchored rule into `.pp-tip.at`, and a fixed box with both edges set is sized between them — the bubble collapsed to 8px. If a trigger needs the anchor's *other* quiet effect, sitting above a stretched card or row link, use **`.pp-lift`**.
8. **Nothing above a trigger carries a `transform`, `filter`, `backdrop-filter` or `mask` (2.4 adds the mask).** Each of the first three makes that element the containing block of a fixed box, which re-clips the panel the `.at` form exists to free; a mask creates a stacking context, so a fixed panel painted inside it is masked along with everything else — `.pp-models.is-overflow` fades its edge with a `mask-image`, and a bubble on a model button would fade with it. So the panel is a **sibling** of the masked element, never a child. (`.pp-art`'s filter is on the picture itself, which never has a panel inside it.)

9. **A window-placed panel leaves its wrapper: it is rendered as a child of the nearest open `<dialog>`, else of `<body>` (2.13).** `.at` escapes **clipping**; it does not escape a **stacking context**, and `.pp-lift` is one by construction (`position: relative; z-index: var(--z-raised)`). Three components found that out one at a time — the klant tile's menu (2.7), the tooltip, and the spool picker, where two later triggers of 200 x 32 painted over an open panel and it lost every probe. Measured over a grid of 575 points per menu: anchored **1 of 11** clear, portalled to the body **0 of 11** (a modal `<dialog>` paints in the top layer, so a panel outside it lands beneath the whole modal), portalled to the nearest open `<dialog>` **11 of 11**. So rule 8's list of things that confine a panel now reads: a clipping or scrolling `overflow`, a `transform`, a `filter`, a `backdrop-filter`, a `mask` — **and any stacking context, `.pp-lift` included**. Dropping `.pp-lift`'s `z-index` instead is rejected: that z-index is what `.pp-lift` is *for* (a trigger above a stretched card or row link), and without it the trigger's place in the stack depends on DOM order, which differs per component and fails silently. The cost is that Tab order cannot carry a portalled panel, so an `.at` panel is **focus-managed**: focus in on open, back to the trigger on close, Esc closes, focus leaving closes, `aria-controls` and `aria-expanded` tie the two together. Details: Popover, GAP-146.

**Rule 9's focus contract binds a panel that takes focus, and the Tooltip is exempt (2.14).** The implementer asked, and the answer is no: a tooltip is `aria-hidden`, its text *is* its trigger's accessible name, and its trigger can be a non-focusable graphic inside a stretched card link — there is no focus to move in, nothing to trap and no trigger to return it to. What binds every panel, tooltip included, is the **portal**: a window-placed panel is rendered in the nearest open `<dialog>`, else in `<body>`, because that is about paint order and not about keyboards. Focus in on open, back to the trigger on close, Esc, close-on-leave and `aria-controls`/`aria-expanded` are the contract of the panels a viewer operates: menus, pickers, the tag editor, the date picker. So the Tooltip is compliant as it stands and this is not a gap.

A tooltip appears **at once** on hover and on focus — no delay. Details and the name-or-description rule: Tooltip's README.

## Three rules this round wrote down (2.3)

**A control states what is in force, not what is unset.** Where a value can be inherited — the slot spool that falls back to the print's, and anything like it later — the trigger shows the inherited value and names where it came from with a `pp-hintchip` ("van de print"), in normal ink. It never shows its empty placeholder while a value is costing something. The placeholder is for the one case where nothing is in force. Measured: a print's total moved from EUR 7,05 to EUR 5,13 on a spool whose own control said "Kies een spoel" throughout. The chip belongs on the control that can override the value, not beside it. Details: SpoolPicker.

**A card that something important follows is capped; the last card on a page is as long as its content.** The print detail's file list is 585px of a 1892px page and up to 48 rows, and the answer is its position, not a disclosure, a fold or an inner scroller — all three are rejected under GAP-117. A long list costs nothing when nothing is behind it. One consequence: a page has **one** order of blocks at every width, not a desktop order and a phone order.

**We never rewrite a picture we did not make.** 79 of 83 thumbnails are images the slicer embedded and we pass through. Where a picture needs separating from its ground, the page draws the separation — `.pp-art` outlines the silhouette from the picture's own alpha channel in `border-strong`, which is a token and therefore right in both themes. Nothing visual is baked into an asset, because a baked value cannot read a theme and cannot be changed without re-encoding the library.

## Two rules this round wrote down (2.4)

**A picture is an accelerator; the identifying field is the identifier.** Where a set of things is referred to by one field — a file name, an invoice number, a token id — that field stays visible even when a picture, a colour or an icon usually tells them apart. **Not because it is unique (2.6 corrects that):** two model files in one print can carry byte-identical names, measured at 3 pairs in 2 prints. Because it is the field the rest of the system speaks in — the caption, the list, the download, the invoice, the duplicate badge all quote the name, and a picture cannot be quoted. Where two labels do come out identical, that is a fact worth stating: two buttons reading the same say “there really are two of these”, where two buttons with no label say nothing and invite the wrong click. A picture is allowed to be the fast path; it is never allowed to be the only one. Measured, in the model strip: 66 of 74 prints with two or more renders are perfectly distinguishable by picture alone, and 8 are not, with 87 pixel-identical pairs among them. The exception cannot be detected either, because perceptual identity is not pixel identity: two parts that differ by two millimetres make two pictures nobody can tell apart at 112px and a comparison calls distinct. So the name stays, and gets enough width to be worth reading — which is the other half of the answer (ModelPicker, 2.4).

**Enough width to be worth reading is a measurement, not a feeling.** 68px of file name was 9 mono characters, and 96% of this library's 501 model names overflowed it, so the name was decoration. The question to ask of a truncated field is not “does it fit” but “does what is left still separate the items”, and that is answered by looking at where the real names differ. Here they differ at both ends, so the box holds a head, an ellipsis and a tail (15 characters, 112px) — and the direction of the cut matters more than the width. **2.5 measured the width's limit exactly:** 68px → 112px of name box, 65% more width, bought **6 points** of overflow (96% → 90%), while holding the median name whole would need a 189px button (2.9 per frame) and p90 a 420px one (1.3). So width is never the lever for a truncated identifier; the *content of the window* is, and that is what the rule above adjusts.

## Two rules this round wrote down (2.7)

**A sentence in the present tense is a claim about the present state, and has to be keyed on every condition it claims.** The whole-print spool control said "Geldt nu voor 2 slots zonder eigen spoel." while no spool was chosen and nothing was in force: the condition I wrote asked how many slots lacked a spool of their own, which is true of the slots either way. The word **nu** is the tell — any line containing it may only be rendered in the state it describes. Where that state does not hold, the line does not go silent; it speaks about the control instead ("Een spoel hier geldt voor 2 slots zonder eigen spoel."), because the state where nothing is in force is the state where a control most needs to say what it would do. 83 of 83 prints in this library are in it. Write the states out as a grid before writing the sentence: a line about money needs a cell for every combination, and this one had two cells for four. Details: SpoolPicker, GAP-118.

**A warning is for something that needs doing; a fact that needs nothing gets plain ink.** Two files of one print can carry the same name, which the model strip cannot help with at all — same picture, same label. The fix was not to widen the "Mogelijk dubbel" badge to cover it: that badge means the same *content*, and its hint says to delete one file and count the other twice, which for two real files loses one off the invoice. A badge whose advice is false in the case it was widened to cover is worse than no badge. So the condition is stated in `muted` text on both rows, with each row naming its own folder, and nothing else about the row changes. Details: AssetListItem, GAP-120.

## What this portal may claim it knows (2.8)

This round answered a question rather than a gap: the owner asked whether the tag system earns its place, and the answer turned out to be about a lifecycle the portal does not model. Nothing visual changed. Four rules did, and they hold whatever the app decides to store, so they are safe to write down before the data decision is made.

**1. A screen may not present a stage it cannot observe — and an asserted stage carries its date.** This portal learns its records from exactly one source: the indexer, reading files from disk. Two kinds of fact therefore exist in it, and they must not be drawn alike.

- **Observed**: the files are there, a render came out, a weight is in the G-code, a price is set. The app can re-check it on the next index, so it cannot quietly go stale.
- **Asserted**: a person said so — asked, quoted, declined, printed, delivered. Nothing can re-check it. It is only as fresh as the last time somebody touched it.

Wherever a screen shows an asserted stage it shows **when it was asserted**, in the same place and in `muted`, not in a tooltip and not on a detail page one click away. This is not politeness: an asserted stage is the only kind that can be silently wrong, and a board of undated asserted stages reads as current when it may be six weeks old. A stage board with undated stages is not approved by this system. An observed stage needs no date — the next index is its date.

**2. A record without files is not drawn in the shape of a record with them.** No PrintCard, no thumbnail well, no `SpoolSwatch`, no 40px `.pp-thumb` square. The "no preview" box icon already means *this print has no thumbnail*; it may not be reused for *this job has no files at all*. Those are two different facts about two different things, and one glyph may not carry both — the first is a gap in a record, the second is the whole state of it. A record without files has words and nothing else, so it reads as **a line of text**: a `.pp-table` row or a stacked block with a sentence, a klant, a stage and a date. A card is a summary of a thing that exists; there is nothing to summarise.

**3. Money that will never arrive is set in the past tense, in `muted`, and appears in no total.** A quoted price the customer turned down is worth keeping — it is the record of what was asked — but every money surface in this app answers *what is owed*: Openstaand, the klant chip's openstaand figure, the invoice export, the share page, the dashboard totals. A declined quote belongs in none of them. It renders as an amount in `muted` rather than `text-strong`, with a word that says it was a quote and was refused, and it is excluded from every sum. Critically it does **not** take `unpaid` ink: `Afgeschreven` is `unpaid` because that money *was* owed and will not come, and a declined quote was never owed. The two must not look alike, and `unpaid` on a number the customer never agreed to pay is the one reading this system cannot allow. See StatusBadge.

**4. A tag is a property, not a stage.** A tag is a free label the operator invents; the system never reads it, nothing branches on it, and it has no order and no next step. The sample tags this system has always shown — `cadeau`, `prio`, `herprint`, `klant-ontwerp` — are all things a print **is**. A label whose values are mutually exclusive and ordered, so that moving to the next one means leaving the last, is **state**, and state belongs in a status the whole UI can read: a badge with an icon and a word, a FilterBar option, a position in a list, a figure on a tile. The mechanical reason is in the components, not in taste: TagEditor's rows are checkboxes and FilterBar's tag filter is AND, so two tags of one set can be carried at once and nothing anywhere refuses it. A state machine's entire value is that its invalid states are unrepresentable; a tag set makes every invalid state representable by construction. Details: TagChip, TagEditor, GAP-121.

**5. A direction between two files is drawn only where it is observed or recorded, never where it is read out of a file's name.** A print's files are sometimes a set and sometimes a history: 16 of this library's 84 prints carry a version mark in a model name (`Case_A_v5.stl`), and 7 hold an editable source file, which is where the owner's own design loop runs. Three relations between two files of one print now exist and only two may be shown: *duplicate* has a direction and it is **observed** (identical bytes, index order), so "Mogelijk dubbel" may mark the later file; *same name* claims **no** direction because none is observable (2.7); *superseded* is the one whose entire content is a direction, and it is known only to the person who made the versions — an asserted fact under rule 1, so it carries a date and an author or it is not drawn. A version mark sits in the middle of a long name, which *Typography* above establishes is the zone this system cannot read, and `v10` sorts before `v9`. Details: AssetListItem and ModelPicker, GAP-132 and GAP-133.

**7. Where another system owns a location, the design treats it as read-only in principle (added 2.9).** `/prints` is mounted read-only, and that had been described as a safety property — the app cannot damage 2.6 GB of real files. The real reason is **ownership**: the tree is a **Nextcloud-synced folder**, Nextcloud indexes it, and anything written behind its back is invisible to the person it was written for. A safety property can be weighed against a benefit; ownership cannot, because writing there does not produce a worse outcome, it produces **no** outcome. So **no control, empty state or help line may tell the operator that the app will put a file where they will look for it** — no "create folder", no "save to the prints folder", no "export here", no empty state offering to make a home for their files. The portal reads that tree and writes to it never. The tempting places are the ones a designer reaches for first, which is why this is a rule and not a note. Generalise it: a design that assumes a mount could be made writable later has assumed the wrong thing about who the location belongs to. Details: `changelog.md` 2.9, GAP-128 and GAP-137.

**6. A figure out of a database with nothing in it is not a measurement.** This project has decided things on real numbers since 2.3, and that only works while the numbers are labelled. This library yields **two classes** and they behave differently: figures derived from **the files themselves** — file names, the 3MF/STL split, the thumbnails, 84 prints, 215 slots, the 2 prints with no model files — are real, and every rule from 2.3 to 2.7 rests on them; figures derived from **anything a person typed** — prices, payments, spool assignments, invoices, tags, order numbers — are zero in the local build and mean nothing about the library. The failure is not noticing the difference: a 2.8 measurement request reasoned from "84 orders, all number 1" towards retiring OrderSection's multi-order apparatus, and repeat orders turned out to be a thing the owner does regularly. Before reasoning from what a dataset lacks, establish what it contains; and ask for a production figure from the person who has production. **A third provenance matters just as much: a figure counted by a re-implementation of a rule is "as specified", never "as rendered".** The label-rule counts in *Typography* come from a script that re-implements this system's split, not from the shipped function, and the two disagreed three times on the residue — which is how the missing ceiling was found. They may be quoted as what the rule does and not as what the screen shows. **And never take a sum from a subset of the buckets:** `55 - 36 = 19` looked like the separated count and was wrong, because a third bucket sat inside it. Details: `changelog.md` 2.8, the amendment at the top.

## Three rules this round wrote down (2.13)

**A column takes its max-content and the rest starves — in a page's sections as in a row's bands.**
Instellingen and AssetListItem had the same fault twice: one grid cell sized to the longest thing it
could hold, and the thing the screen is *for* paid for it. A settings page with `align-items: start`
put 1402px of nothing beside a 194px card because a 1580px card shared its row; a file row reserved
609px for a controls layout it never drew, because the controls wrap, and clipped the file name to
its 240px floor to pay for it. The answer in both places is the same shape: **the part whose size is
the owner's data stops sharing a track with the part that has to be read.** A section that lists
records takes the whole row (`span-2`); a band of value controls takes a line of its own under the
name. The alternative — balancing heights, or stretching the short card — treats the symptom and
makes the layout depend on today's data.

**Rows line up when at most one control's width is data, and it is the last one.** A right-aligned
band fixes only its right edge, so every control in it moves when a spool's name is longer; in a
library where the names happen to be the same length, nothing looks wrong until a customer's
screenshot arrives. Put the controls whose words are fixed first, the one that grows with data
after them, and the icon buttons in an `.end` group pinned to the row's right edge: then the first
two start at one x, the third starts at one x, and the last ends at one x — with no fixed widths
and nothing truncated. Details: AssetListItem, GAP-111.

**A hint chip qualifies a value: where it came from, or whether it is still current.** `pp-hintchip`
was described as *provenance* because its first three uses were provenance ("uit de map", "slicer",
"van de print"). "archief" on a spool is a **state**, and it belongs on the same device, because
what the chip actually is — quiet words attached to a value, with no ink, no icon and nothing to do
— fits it exactly. The boundary is what matters: a chip **may not** carry something that needs doing
(that is a `warning` badge with a reason line), it **may not** carry something that changes money (a
value is a value, in a cell of its own), it is **never** the only carrier of the fact, and when the
value moves into a trigger the chip moves with it. Details: SpoolPicker, GAP-161.

## Components

Components are plain HTML plus `components/bundle.css` (classes prefixed `pp-`); there is no JavaScript bundle. Load `tokens.css`, then `bundle.css`, and write the markup shown in each component's `preview.html`. Re-implement them in React one to one by keeping the class names and the ARIA roles from each component's README. Wrap a page in `.pp-stage` only for previews; the app supplies its own page background. Controls are 36px high on desktop and 44px at 480px and below (`--pp-control-h`).

## Roles

Admin sees everything, including Deel-links, Toegang, Gebruikers, Instellingen, Verwijderde prints with Herstellen, and the undo actions. Editor sees every klant (no grants needed, so Editor rows in Toegang are disabled and checked), Dashboard, Openstaand, Facturen, print detail with costs and payment, and can export and "Definitief maken", but cannot credit, delete users or change settings. User only sees the klanten an Admin granted. **A visitor with a deel-link is a User without an account (2.14):** a valid token mints an anonymous read-only session scoped to one klant, with the same screens and a head bar instead of the sidebar — no theme control, no "Uitloggen", no API-docs, and the URL as the only credential (ScreenShareSession, AppShell). User sees customer price and status only: no internal cost, breakdown, notes or file controls, no Facturen page, **no API-docs (2.16, GAP-173 — the item and the route both, so it is removed and not hidden)** and **no tags (2.15, GAP-166 — a tag is the owner's own filing word, and he does not use them)**. **What a User and a visitor do read, since 2.16:** materiaal and gewicht, on the card's meta line and in "Deze print" (GAP-174), and **the timelapse** in the media strip (GAP-175) — viewing, never downloading. **Where a print lives on disk (the `Map` row, GAP-182) is the operator's alone:** the library's shape is the workshop's. Never render a control a role cannot use.

## Screens and documents

The Screens group in Components shows every page at desktop (980px frame) and phone (360px) width; switch the theme in the page to see both. The AppShell page also shows the tablet icon rail (481–900px); wide (1440px and up) adds columns, as stated under Responsive. Each screen's README lists its layout, states, roles and Dutch copy. The three Doc pages show the A4 documents (20mm margins, light only, printable in black and white).

## Iconography

Use Lucide line icons (`lucide-react`), 1.75px stroke, in sizes 16 (inline with text), 20 (buttons, nav) and 24 (empty states, headers). Colour icons with `currentColor`; status icons take the status colour.

| Meaning | Icon |
|---|---|
| G-code | `file-code` |
| 3MF | `package` |
| STL | `box` |
| Video | `file-video` |
| Fusion 360 | `pen-tool` |
| PDF | `file-text` |
| URL | `link` |
| Other file | `file` |
| Betaald | `circle-check` |
| Open | `clock` |
| Afgeschreven | `ban` |
| Gearchiveerd | `archive` |
| Verwijderd | `trash-2` |
| Missing data | `triangle-alert` |
| Bron (de pagina waar een model vandaan komt) | `external-link` |
| Notitie | `sticky-note` |
| Overzicht (het scherm van de klant zelf, in een deel-linksessie) | `list` |

No logo has been supplied. Show the studio name in `heading-lg` type in the app shell, on the share page and on the invoice, with an optional uploaded logo image that replaces it when set in Instellingen.

## Content fundamentals

- Write Dutch, informal "je" on the share page, neutral and short in the operator UI. Use the exact vocabulary: Klant, Project, Print, Bestand, Openstaand, Betaald/Open, Markeer als betaald, Alles als betaald, Afschrijven, Verkoopprijs, Voorstel uit marge, Kosten/Totaalkosten, Materiaal, Stroom, Spoel, Factuur, Concept, Definitief maken, Creditnota, Herinnering, Overzicht, Deel-link, Intrekken, Verloopt, Toegang, Gebruikers, Instellingen, Opnieuw indexeren, Verwijderen, Herstellen, Gearchiveerd, Deels betaald, Niet factureren, Toon verwijderde, Aantal keer geprint, Plaat, Slot, Mogelijk dubbel, Op factuur, Reden, Telt niet mee in kosten, Tags.
- Format with nl-NL: money `€ 1.234,56`, dates `5 okt 2026` (with "12 dagen open" where useful), durations `1 u 20 min`, units `87 g`, `0,42 kWh`.
- Name the object in destructive confirmations: "Print 'Bloembak clips' verwijderen?" and say that deleting hides the print but keeps its financials.
- Show where a cost value came from (Spoolman, handmatig, geschat). A print without a price shows "Prijs volgt" on the share page.
- There is no VAT anywhere: no BTW toggle, rate or number, and no KvK, on screens or documents. Company details on documents are name, address, IBAN and optional e-mail and phone, plus an optional uploaded logo (PNG or SVG) that replaces the studio name.
- Documents: an unnumbered **Concept** invoice; a final **Factuur** numbered `YYYY-NNN` (yearly reset) created with "Definitief maken"; a **Creditnota** (negative, "Betreft factuur {nummer}", same number sequence); a **Herinnering** (unpaid lines only, no number); and the share-page **Overzicht** (no number, customer price only). Invoice table columns are Print · Project · Datum · Gram · Bedrag · Status; status is Betaald, Open or Deels betaald, and prints without a customer price are left out.
- Payment rules: a partial payment keeps the print open for the remainder ("Nog € 6,89 open"); Afschrijven covers only the remainder and takes an optional reason; only Admins can undo a payment or a write-off, both with confirmation.
- A klant flagged **Niet factureren** shows cost only: no sale price, payment, Openstaand or invoice. Such a klant may get a Deel-link; its share page lists the prints only (Print, Project, Datum), without amounts, payment status or PDF buttons.
- Search fields show a small `/` key hint on desktop; the `/` key focuses search.

## Sample values for previews

Customers Koen, Esmee, Veerle (and Algemeen, niet factureren); project "Bloembak clips"; PLA, 87 g, 1 u 20 min; material € 2,18, electricity € 0,12, total € 2,30; suggested price € 11,89 from a 400% markup; printer Creality K1 Max at about 350 W. These price, markup and wattage figures are illustrative layout data, not business rules.
- Deel-links: Verloopt offers Over 7, 30 or 90 dagen and **Nooit**; a link without expiry shows "Verloopt niet" in `muted`.
- Sign-in: local sign-in with e-mail address or name plus password (at least 12 characters), or Authentik (OIDC) when configured; members of the Authentik admin group become Admin. A temporary password must be replaced at the first sign-in. A session ends after 60 minutes without activity or 12 hours after signing in; login is limited to 5 attempts per minute. The last Admin can never be removed or demoted.
- A credited print (whole invoice or chosen lines) becomes Afgeschreven.
- Contract for the app: only tokens and the classes in `components/bundle.css`. Inline `style` attributes in the previews are demo layout only and are not part of the contract; sizes the app needs exist as tokens or classes (`pp-auth`, `pp-state`, `pp-iwrap compact`, `pp-dialog sm`, `pp-drawer`, `leading-*`).
- Table or cards: put both layouts in the DOM and wrap them in `pp-only-wide` (above 480px) and `pp-only-phone` (480px and below); wrappers carry no display of their own. Gebruikers and Toegang use this.

## Roles, tags and deleting (1.3)

- **Admin** and **Editor** delete prints (a project folder is one print) and whole klanten, and manage tags on the page "Tags". Only **Admin** sees and restores deleted prints and klanten ("Toon verwijderde"). **User** sees name, price, status, thumbnail, 3D model and tags read-only: no files, downloads, costs or notes, and no Tags page.
- The print colour sits behind the thumbnail through `.pp-thumb.tinted` and `--c1`.
- Tags are case-insensitively unique, at most 64 characters, with an optional colour from ten tokens (`tag-rose` to `tag-grey`). Chip text is `#141a33` or `#ffffff`.
- Screens contain no raw layout values: use tokens and `bundle.css` classes. The only things that may be inline are **data properties the app measured or read**, and preview scaffolding (`min-height` on `.pp-device`). The whole list, current at 2.3: `--c1` and `--c2` (spool colours), `--tag` and `--tag-ink` (tag colours), `--pp-pop-max` (the room a popover has), `--pp-tip-x` and `--pp-tip-y` (a tooltip trigger's rect), `--pp-pop-x` and `--pp-pop-y` (a popover trigger's rect, 2.3). **`--mix` left the contract in 2.0** when the filament colour stopped being the thumbnail's ground; if you still find it set anywhere, it does nothing.

## Orders, settings and stacking (1.4)

- A print (project folder) has one or more orders. Order 1 always exists; a Nabestelling is added by Admin or Editor. An order owns its items (each file or plate with its own "Aantal keer geprint"), Verkoopprijs, payments, write-off and, from M7, its invoice line. Files that are in no order wait until a Nabestelling is made. A print shows the summed price and the least settled status.
- A payment is at most the open remainder of its order; Admins can undo the most recent payment, and undone payments stay in the history.
- Instellingen (Admin) has the sections Algemeen, Prijzen (Standaardmarge, Stroomtarief, Materiaalprijzen), Printers, Bedrijfsgegevens, Klanten and Spoolman.
- Stacking: popovers use `.pp-anchor` and `z-popover` (30); sticky bars 10, tooltips 40, drawers, sheets and dialogs 50. Apps never choose a z-index.
- Fixed-size helpers (`pp-w-*`, `pp-minh-*`, `pp-gap-*`, `pp-text-*`, `pp-fw-*`) replace inline values; the previews no longer need `style` attributes except for data properties.



## Versie 1.5 (2026-10-07)
Date picker (`.pp-cal`), per-line payment in Openstaand, invoice footer rules, logo in the shell, one invoice line per order. Details: `changelog.md`.

## Versie 1.6 (2026-10-07)
Share page and PDF without prices, aligned share-link columns, calendar button, locked-order help line, M9 previews without inline values. Details: `changelog.md`.

## Versie 1.7 (2026-10-07)
Scalar is the API-docs renderer (`.pp-scalar` mapping), the contrast report names the ground of every pair, wrapping lock help, scrolling folder diagram, empty Toegang. Details: `changelog.md`.

## Versie 1.8 (2026-10-07)
Badges sit on an opaque `surface` base, the contrast report covers translucent tokens inside tinted rows, and a rule for third-party renderers (focusable scroll regions). Details: `changelog.md`.

## Versie 1.9 (2026-10-07)
A round driven by the real app (83 prints, 10 klanten): the share page (studio header, payment block, thumbnails), a print detail that fits the screen (capped viewer, one order card with sections, "⋯" menu), a finite dashboard and Openstaand (klant strip as one row, collapsed groups with age steps), sort and status filter, and three new components: ModelPicker, VideoPlayer and OverflowMenu. No token added, renamed or removed. Details: `changelog.md`.

## Versie 2.0 and 2.1 (2026-10-08)
*Recorded here in 2.2: both rounds updated the component files and `bundle.css` but not this page, `changelog.md` or `copy-deck.md`. What follows is the summary those component files carry; read them for the reasoning.* **2.0:** the filament colour stops being the thumbnail's ground and becomes a 4px bar along its bottom edge, the render carries a baked `#6f7a96` outline and `--mix` leaves the contract (GAP-071); missing files become one worded chip (GAP-090); one target per tile (GAP-091, with 093 and 099); the file list moves to print level and an order lists only what it bills (GAP-097); the card subtitle rule becomes official (GAP-072). **2.1:** the missing-file chip becomes three slashed type icons on the card and the row, worded only on the print detail (GAP-106, overruling 2.0 at the owner's second asking); the selection box is 24px of ink in a 36/44px target (GAP-107); each slot of `.pp-foot` holds the thing it is about (GAP-108).

## Versie 2.2 (2026-10-08)
Where floating things go: popovers choose their side, cap their height and fall back to a sheet, and the tooltip finally has a placement and no delay (GAP-112, GAP-110, section *Floating panels*). The file row's name column keeps a 240px floor so a badge is never drawn over the controls (GAP-111). The missing-file icons ride behind the print name instead of making a tag row of their own (GAP-109) and say "Ontbreekt: G-code, 3MF en STL" in one line, with the full sentence kept as the accessible name (GAP-113). No token added, renamed or removed. Details: `changelog.md`.

## Versie 2.3 (2026-10-08)
The five gaps that were left. The thumbnail outline moves out of the renderer and into the page (`.pp-art`, GAP-071): it covered 2 prints of 83 where it was, and we do not rewrite the 79 pictures the slicer made. Floating panels get the two fixes 2.2 left: `.at` resets the edges it does not use and the popover gains the window-placed form the tooltip had (GAP-114), with `.pp-lift` for the job the anchor was doing quietly. A spool trigger shows the spool that is in force instead of "Kies een spoel" (GAP-115). The media strip keeps one sideways-scrolling line at every count and, with no per-model renders to show, puts the file name first (`.pp-models.compact`, GAP-116). The print detail has one order of blocks at every width, with the file list last (GAP-117). No token added, renamed or removed. Details: `changelog.md`.

## Versie 2.4 (2026-10-09)
One gap and an owner's counter-proposal. There are per-model renders now — 281 of 376 model files — so the media strip's square form is the normal one again, with a 112px picture in a 120px button (GAP-116). A file name is cut in the **middle** everywhere, and the mechanism that does it finally has a name (`.pp-fname`): the old end truncation threw the extension away first, on the one screen where the extension tells two buttons apart, and 96% of model names were truncated (GAP-119). The full name is read without choosing the button, through the system's own tooltip in the `.at` form, and only when it is truncated. The owner's proposal to drop the name where a button has a picture is **rejected**: a picture is an accelerator, the file name is the identifier, and the 8 prints with identical renders are exactly what a picker exists for. No token added, renamed or removed. Details: `changelog.md`.

## Versie 2.5 (2026-10-09)
Five measurements, arriving before 2.4 was imported, and two of them bite. The square model button **stays at 120px**: your own figures retire width as the lever (65% more name box bought 6 points of overflow, and the median name would need a 189px button). What changes is the **split**: 29% of within-print name pairs share their first 7 characters, so the tail is now a starting point and the app extends it until no two labels in one strip read the same (GAP-119, extended). That exception is allowed where the rejected picture comparison was not, because exact string equality is computable and perceptual identity is not — the rule is under *Typography*. `.pp-art`'s paint cost is measured and closes GAP-071's last half: 29 outlined pictures, p95 17.4ms against 17.2ms, so the four-shadow ring stays everywhere and 2.3's reserve halo is withdrawn. The compact strip governs **one** print of 79 and is recorded as specified and nearly unexercised rather than tuned again. No token, class or copy key added, renamed or removed, and no CSS changed at all. Details: `changelog.md`.

## Versie 2.6 (2026-10-09)
Three more measurements, still before anything is built. The label rule now grows **whichever end** reaches the difference rather than always the tail — the asymmetry had no justification — against two floors: the extension always survives and the head keeps two characters. And the window's **blind zone is named** instead of left to be discovered: every name longer than 22 characters has a middle no 15-character split can reach, which is 36 of 1682 pairs in this library (**corrected from 40 in 2.8**), plus 3 byte-identical pairs that no rule can touch. Those are **accepted deliberately**, with the picture, the fixed order, the caption and the tooltip carrying the strip where the label cannot; two lines of name would reach them, is costed in ModelPicker, and is the move if the owner calls those families unusable. One sentence of 2.4 is **withdrawn**: a file name inside a print is not guaranteed unique, and the reason the name stays is that the rest of the system quotes it. No token, class or copy key added, renamed or removed, and no CSS changed. Details: `changelog.md`.

## Versie 2.7 (2026-10-09)
Two sentences, both about telling the truth in the state nobody looked at. The whole-print spool control stops claiming "Geldt nu voor 2 slots zonder eigen spoel." when no spool is set: the line is keyed on both axes now and all four cells have words, with the present tense reserved for the two cells where money is actually moving (GAP-118). And the file list stops leaving two same-named files of one print entirely to the model strip, which cannot tell them apart: one `muted` line on both rows, each naming its own folder, deliberately **not** the `warning` badge "Mogelijk dubbel" — that badge means the same content and its hint would drop a real file off the invoice (GAP-120). Four copy keys, one of them a line the app has rendered since 2.3 and the deck had never recorded. No token, class or CSS changed. Details: `changelog.md`.

## Versie 2.8 (2026-10-17)

**No gap, the largest question, and nothing drawn.** The owner asked whether the tag system earns its place. It does — as labels. What it had been doing instead is a request lifecycle the portal does not model: asked, quoted, accepted or declined, and then printed and delivered. Five of his production tags are that state machine wearing a tag's clothes, and the reason they cannot do the job is in this system's own mechanics, not in anyone's preference: tag rows are checkboxes and the tag filter is AND, so `printing` and `done` can sit on one print at once and nothing refuses it. Six rules are written down above: what may be claimed, the shape of a record with no files, how a price that will never be paid reads, what a tag is for, **when a direction between two files may be drawn** (never from a version mark in a name — revision turned out to be a fourth thing, and the answer is a refusal, not a feature), and **that a figure out of an empty database is not a measurement** — a request of mine this round reasoned from "84 orders, all number 1" towards retiring OrderSection's multi-order work, and repeat orders are something the owner does regularly. That request is retracted in `changelog.md` and nothing is deprecated. Two figures of mine are corrected the same way: the blind zone holds **36** pairs and not the 40 stated since 2.6, and a hypothesis that part of that residue was version pairs is **falsified, zero of 55** — 2.6 was right and the version question is separate from it. The label rule gains the **ceiling** 2.5 forgot to write (GAP-135), which is the fault of GAP-130 again: floors were specified and the bound they imply was not. **The queue screen is not in this version and must not be built yet** — it is proposed in `changelog.md` with the two questions it depends on, and one of those questions is the owner's, not mine. No token, class, copy key, preview or pixel changed; `bundle.css` is byte-identical to 2.7. Details: `changelog.md`.

## Versie 2.9 (2026-10-17)

**Step 1 of the lifecycle is built, and one option in my own advice turns out not to exist.** 2.8's declined-quote reading and its bulk control are in the app as specified — `Niet doorgegaan`, the amount `muted` and prefixed "was" with no strikethrough, out of every total, measured leaving and rejoining Openstaand — so 2.8 is spent. What this round corrects is mine: I ranked "the app creates the folder" joint-first among the four ways a record could meet its files, and the prints root is **Nextcloud-synced**, so a folder the app writes is never indexed and reaches no device. Not a trade against a read-only mount; no working version of the option at all. **Rule 7** generalises what that teaches: where another system owns a location, treat it as read-only in principle, and never offer the operator a control that promises to put a file where they will look. Two decisions the implementer made inside the spec are better than the spec and become it — "Geen status" as a fourth **value** rather than a clear action (the pattern "Geen spoel" and "Geen kleur" already set, which I had never written down), and **naming** a declined order in an invoice's exclusions rather than leaving it silently absent, since "excluded from every total" is satisfied by saying nothing and silence is what nobody can check. **Amended the same day:** the build named it through the existing sentence, so a print quoted at EUR 24,50 and refused was announced as having *no sale price*, in `warning` orange — the GAP-120 fault inside the change meant to remove it. The list splits: the `warning` alert keeps the missing-price exclusions, the declined ones become a `muted` `.pp-reason` line in the preview card, both lines gain ICU plurals and a five-name cap, and the rule itself narrows — **the surface where the operator creates or reviews a document** names what it leaves out, never the customer's copy, which my first wording would have put it on. Three invoice keys and the lifecycle's seven words are now in `copy-deck.md`. No token, class, copy key or pixel changed. Details: `changelog.md`.

## Versie 2.10 (2026-10-17)

**The queue is a page, and my instinct was wrong on the owner's numbers.** 2.8 said a screen does not get a nav item for three rows and put the threshold at about eight; measured, it is about **four open requests at a normal moment and regularly above ten**, and the state that costs him is not the steady one — it is *"die moet ik dan allemaal onthouden"*. **ScreenQueue** (`/wachtrij`) is two collapsible groups keyed on the states that shipped in 2.9, built from OutstandingGroup's `.pp-ogrp` form without one new class, and **Wachtrij** joins the nav between Dashboard and Openstaand. The real design question was the owner's own distinction between a request he must still design himself and one that is sliced and waiting for the printer: **one group, with the difference drawn by whether files exist** — fileless rows first, "waarvan {n} zonder bestanden" in the heading — because a fourth state would make him *assert* what the indexer can *observe*, and rule 1 says an asserted stage is the only kind that goes stale in silence. A fourth state is **rejected** with the measurement that would overturn it named. The matching mechanism is the owner's: **hand-linking**, chosen on *capture* rather than on controls — a request arrives while he is in someone's kitchen, and "Aanvraag toevoegen" works in a phone browser with no folder — so a record with no files is live, GAP-122's shape rule is live with it, and the row gains "Bestanden koppelen", which links to a folder that exists and never makes one (rule 7). Thirteen copy keys, no token, no class, no CSS. Details: `changelog.md`.

## Versie 2.11 (2026-10-17)

**Four defects from the running queue, and the first CSS change since 2.7.** Three of the four were
words: one key held **two different strings** (`outstanding.oldest` was the stat-tile label *and*
the group's age badge, so the shipped page read "118 dagen open" where this system's own preview
says "oudste 118 dagen"), the badge that needed the second string had no key at all, and
`queue.waiting` had no zero arm, so a request entered this morning read **"0 dagen geleden
gevraagd"** — the common case, on the one row the owner is certain about. All three are fixed, and
the deck gains the rule that prevents the class: **one key, one row**, since the importer takes the
first occurrence and the deck held twelve duplicated keys, two of them contradictory. The fourth
was measured in the app: at 360px a queue row's badge took 192px of 326px and starved the name to
90px, so **`.pp-line` now folds into three bands** on the phone — name, then badge and figure, then
actions — and the row copy is **not** shortened, because "geleden gevraagd" is what makes the badge
a wait rather than a debt. The lesson generalises into *Responsive* above: a phone rule needs a
`.pp-device.phone` twin, or the preview that specifies it cannot show it. **And the owner's new
feature:** a print carries a **bron** (the model's page, which the klant sees) and a **notitie**
(internal, which the role User never sees), two new components, so a queue row can say whether a
fileless job is a download or an evening of modelling — a second observation, deliberately not a
fourth state (GAP-143 stands). Two new icons, thirteen new copy keys, three changed, no token
added, renamed or removed. Details: `changelog.md`.

## Versie 2.12 (2026-10-18)

**Three gaps, all on the phone, and the round's lesson is that a slot has a type.** The queue's
group summary stops putting a sentence where OutstandingGroup keeps a figure: "waarvan {n} zonder
bestanden" becomes the second muted line of the title block, and `.amt` stays in the markup and
stays empty there. That is the only one of my three proposals that answers **both** halves of what
was measured — the owner held the badge back and the overprint went away while the **squeeze did
not**, so `.amt` sizing a shared column had been starving the heading to 109px since 2.10,
independently of the badge. Three bands for the summary is **rejected**: it rearranges a layout to
accommodate prose in a money slot. The age badge also gets the `justify-self: start` that
`.pp-line > .pp-badge` has had since 2.11 — two rules about the same kind of thing, one of which
let 124px of text paint inside a 223px pill (GAP-155). **`.pp-btn-sm` takes the 44px tap floor on
the phone** and keeps 32px on the desktop: a size variant is text and padding, never a smaller
target, and it had pinned 32px as a literal in nearly every row of the app, where no automated
check can see it — WCAG 2.2's target rule stops at 24px. An exemption is **rejected**, and so is the
proposed `max(32px, var(--pp-tap))`, which computes **36px on the desktop** and would have
abolished the small button everywhere. A row's two actions wrap instead of running 14px past their
band (GAP-156). And the group summary stops saying the age twice: `outstanding.groupMeta` is the
count alone, pluralized — which is what this component's preview has drawn since 1.9 — while the
badge beside it keeps the age; `outstanding.groupLabel`, the `aria-label` 1.9 specified in prose and
never gave a key, is **added** with its plurals, because a string the deck does not carry is a
string nobody proofreads; and `share.expiresIn` is **removed**, measured dead (GAP-154). One new
copy key, one changed, one row removed, no token added, renamed or removed, three changed CSS
declarations and no new class. Details: `changelog.md`.

## Versie 2.13 (2026-10-18)

**Two screens that gave a column its max-content, and the owner's two words for it.** Instellingen
was *"walgelijk"*: three columns where 2.0's own prose says never three — its `auto-fit` made three
from 992px up and nobody had read the CSS against the sentence — and, worse, one grid row shared by
a 194px card and a 1580px one, so the page carried **1402px** of nothing beside Algemeen. A third
column is now impossible by construction (a track is at least 320px **and** at least half the row),
the two sections that list records take the whole row, and the four fixed ones are paired by what
they are. The betaallink's explanation is written once under the heading instead of twelve times
under twelve klanten — **a label belongs to its control, an explanation belongs to the section** —
and the four strings 2.0.1 specified and never keyed are in the deck at last. The file row gave
*"een raar beeld in uitlijning"*: `align-items: center` floated a 20px type icon **44px** below its
own file name, the slot that was misaligned turned out to be the only one with no class, and the
controls band reserved 609px for a single-line shape it never drew while the name was clipped to
240px. The band now takes a line of its own when it carries value controls, the name gets the row's
full width, and rows line up because only one control's width is data and it is the last one. Three
smaller things: a window-placed panel **leaves its wrapper** and is rendered in the nearest open
`<dialog>`, which is the one sentence behind three patches (`.pp-lift` is a stacking context, and
`.at` escapes clipping, not stacking); `pp-hintchip` may carry a state as well as a provenance, so
an archived spool reads "archief" and an empty one reads "leeg" rather than "0 g over"; and a klant
with no prints reads **"Nog geen prints"** and is offered neither Factuur nor Klant verwijderen —
the folder is where that klant was made and where it is unmade, because the portal reads `/prints`
and writes to it never. A backdrop click now has a rule by dialog kind, `.pp-badges` names the
wrapper that a phone rule was missing, and the phone frames finally get the 44px tap floor as a
token twin. One new class (`.pp-badges`), two new row modifiers (`.pp-asset.band`, `.pp-setrow.cust`) and two
named slots (`.lead`, `.acts > .end`); no token added, renamed or removed.
Details: `changelog.md`.

## Three rules this round wrote down (2.14)

**Chrome belongs to the role; screens belong to the system.** A new audience gets the **same**
screens in a smaller frame, never a friendlier copy of a screen. The owner rejected widening the
share page screen by screen because he had watched that drift twice in a month, and he is right: two
implementations of "a print" disagree the first time one of them is changed. So a visitor with a
deel-link walks ScreenDashboard and ScreenPrintDetail, with the operator's chrome — avatar, role,
theme cycle, "Uitloggen", live dot, drawer, rail — replaced by one head bar. **What a role may see
is a question about data; what a role needs around it is a question about chrome.** Keep them apart
and a second audience costs one shell, not a second portal. Details: ScreenShareSession, AppShell,
GAP-165.

**A fact the viewer can do nothing about is not chrome.** The expiry notice and the "Betalen" block
stay on the screen where they mean something — beside the totals they belong to — and do **not**
become a bar on every screen of a session. A bar would repeat one sentence four times for a visitor
who cannot act on it from a print's page, which is the same arithmetic that took 404px out of
Instellingen when twelve copies of one help line became one (GAP-101). Say a fact where it changes
what somebody does, once. Details: ScreenSharePage 2.14, GAP-165.

**A floor is a floor for the thing it protects, and at some width it stops protecting anything.** The
spool trigger's 200px minimum existed so the control would not collapse beside a 320px panel; at
360px it made the control wider than its row, and the card's `overflow: hidden` silently removed the
last 32px of the name — the end, which is the worst place to cut a spool. The fix is not a longer
rule but a smaller scope: the floor is lifted where it does damage, and the name takes the middle cut
this system already specifies for anything identified at both ends. **When a minimum and a container
disagree, look for what is being thrown away where nobody declared it.** Details: SpoolPicker 2.14,
GAP-163.

## Two rules this round wrote down (2.15)

**A state that marks only where you are marks nothing where you could go.** `aria-current`'s tint
has been the whole of this system's navigation ink since 1.0, and it was right for a sidebar: a
column of items in a fixed place is self-evidently navigation, so the one that is dressed is the one
you are on. Lift the same pair into a bar of two items and the logic inverts — the current item
holds all the ink and the destination the viewer has never seen holds none, with `:hover` as its only
resting cue on the device it is opened from. The owner found that by using it, in the one screen
whose user gets a single visit. **So a navigation of few items in a horizontal bar draws the set
first and the position second:** one bordered track, both items visibly the same kind of thing, the
current one filled. And the idiom is borrowed without its ARIA — routes stay links with
`aria-current="page"`, never `aria-pressed` buttons. Details: ScreenShareSession 2.15, AppShell 2.15,
SegmentedControl 2.15, GAP-169.

**A measurement answers the question you asked; the distribution answers the one you should have
asked.** 2.14 said that if the largest klant had thirty prints, a visitor's list would get a search
field. It has 36 — and eleven of the twelve klanten have ten or fewer, which is the number that
decides whether a permanent control is chrome. The field is refused and the **page boundary** goes
instead, so the list matches the Overzicht beside it. When a decision is made conditional on a
measurement, ask for the shape of the data and not only the value that triggers the condition; a
maximum justifies a control on one screen in twelve, which is how chrome arrives. Details:
ScreenDashboard 2.15, ScreenShareSession 2.15, GAP-171, GAP-178.

## Versie 2.14 (2026-10-18)

**A deel-link stopped being a page and became a key, and the design system had to grow a second
kind of visitor.** The owner opened a share link and said *"leuk, maar niet wat ik had verwacht"*: he
expected the klant to walk through the portal. So a valid token now mints an anonymous read-only
session for one klant, and the visitor uses the real screens — which cost one new shell variant
(`.pp-app.guest`: a head bar with the studio, two destinations and "Sessie afsluiten", and none of
the operator's footer), one new screen page that writes down what the session is
(**ScreenShareSession**), and four reductions that were already half-specified and are now drawn:
the visitor's Prints list, the **reduced "Deze print" card** (GAP-158), the payment as a *state*
rather than a form, and the two endings — a dead link, which is still one page for unknown, expired
and revoked, and a session the visitor closed themselves. **Rejected:** a persistent bar for the
link's facts, Openstaand and API-docs in a visitor's nav, a theme control nobody can carry, and a
countdown that would yank a page out from under someone who is reading it. Also in this version: the
**"Aanvraag toevoegen" dialog** has an anatomy after being postponed twice (**AanvraagDialog**,
GAP-157); a request's **ending** is a value in the picker it already has and a deletion when there
are no files, never a third button on the row (GAP-159); the spool trigger's **32px** are given back
at phone width (GAP-163); and one sentence stops having two key names (GAP-164). Twenty-eight new
copy keys, two new components, **no token added, renamed or removed**, no new colour pair, no
breaking change. Details: `changelog.md`.

## Versie 2.15 (2026-10-18)

**The owner walked the session he asked for, passed everything, and stopped at the nav** — *"het is
niet duidelijk genoeg dat je ook naar prints kan gaan"* — which was spec-conform, so the spec was
wrong. The guest head's two destinations now sit in **one bordered track** with the current one
filled (**GAP-169**), still links with `aria-current="page"`, and the pill idiom is lent without its
ARIA. That decision carried a system-wide one with it: **`border` may not draw a boundary that
carries meaning** (1.37:1 dark, 1.42:1 light on `surface`), so `.pp-seg`'s track and
`.pp-modelbtn`'s resting edge move to `border-strong` — three selectors in all, listed in
`changelog.md`, and the rule is now in *Colour* and in both tokens' `usage` rather than in an
example list that let two controls slip through. Also: the guest head is **one height at every studio
name** on the phone (**GAP-172**); a visitor's payment is a **line in the header** instead of a card
below the fold (**GAP-170**); a session's Prints is **not paged** and gets **no search field**
(**GAP-178**, **GAP-171**); **role User sees no tags**, which settles a contradiction this system
published in two files at once (**GAP-166**); `.pp-lift` takes `min-width: 0`, which fixes a whole
class of clipped trigger rather than one case (**GAP-168**); every nav link draws the focus ring in
the token (**GAP-177**); the operator's "Deze print" stops repeating the print's name (**GAP-176**);
and **ScreenQueue's 2.12 section is restored** after the 2.14 export dropped it (**GAP-167**). **No
token added, renamed or removed; no copy key added, changed or removed; one new class
(`.pp-guestexit`); no breaking change.** Details: `changelog.md`.

## Versie 2.16 (2026-10-20)

**The owner answered the three questions 2.15 published as proposals, and all three went the way
the reasoning leaned.** *"api docs niet nodig voor rol User"* (**GAP-173**): the item goes behind
the same role check as Facturen, and because the app builds its routes from the same list that
check is also the route guard — the page is **removed** for that role, not hidden from its menu.
*"materiaal en gewicht is handig voor een gebruiker, dan hebben ze meer detail waarvoor ze moeten
betalen"* (**GAP-174**): a klant's "Deze print" gains two rows and their card gains a meta line of
**two** items — which also settles a contradiction this system published, because
ScreenShareSession §5 said a visitor's card has *no meta line* while the same export proposed
putting these two facts on it; **the sentence is withdrawn and the line stays**, carrying nothing
about the workshop (no print time, no order count). *"klant mag timelapse zien"* (**GAP-175**): the
media strip holds the models **and** the timelapse for every role, the strip's entries become a
field of the print rather than a reading of the file list — a role with no files card may not have
a control that depends on one — and the film is served for **viewing only**, because the owner's
rule for a deel-link is viewer yes, downloads no.

**And one new row, the only thing designed from scratch this round. GAP-182:** after GAP-176 took
the repeated name off the operator's print page, he asked for the project folder back **as a
path**. It returns as `Map` — one mono string, `klant / project`, the last row of "Deze print",
**always drawn** (the comparison that hides *Project* is a squashed one, so the path is the only
place the literal folder spelling is readable), **operator only**, and "Nog geen map" for a record
that has no folder at all. It **replaces** the conditional Project row on that card, because two
rows about where a print lives is the fault GAP-176 was about; GAP-176 itself is unchanged for the
reduced card and the breadcrumb.

Also: PaymentPanel's *Rol User* state is **struck**, since GAP-170 already took the card off that
role's page, and `pay.userNote` is **retired** rather than removed (**GAP-179**); the guest head is
one height at **every** studio name now that the brand is the item that gives way
(**GAP-180**); and the drawer's links draw the focus ring in the token — the fourth place GAP-177
named and the one it never wrote (**GAP-181**). **One new class (`.pp-path`), two new copy keys
(`print.folder`, `print.folder.none`), one key retired, no token added, renamed or removed, no new
colour pair, no breaking change.** The previews, the READMEs and this file also stop using three
customer names and one print name that are real folders in the owner's library. Details:
`changelog.md`.

## Versie 2.17 (2026-10-20)

**A names-only version, published because the owner's library is the only authority on what a safe
fixture name is and this system cannot read it.** A full scan of 2.16 against his twelve klant
folders and eighty-four project folders found three real strings 2.16's sweep had not been told
about: a project name used as a fixture print in six previews (now **Vitrinekast inzet**), a
project name used as the worked example in the argument against reading a version out of a file
name (now **Bloembak clip corner 22** — three sizes of one part, where the trailing number is a
width a regex reads as a version), and a fixture print name whose **first fifteen characters match
a sixteen-character real folder** (now **Kabelgoot bureau**). Both replacements are strings this
export already carried and the same scan cleared, so **no new name enters the system**. The rule
that follows is in `changelog.md`: a fixture name is either already in the export or checked
against the library before it ships, near-misses count as real names, and the sweep covers prose
examples and not only previews — both survivors were sentences, not fixtures.

**Also confirmed by the owner in this round, with nothing to change:** `Algemeen` is not a folder
in his library; GAP-182's `Map` row may replace the conditional `Project` row, which was the one
thing 2.16 changed rather than added; and the `.mkv` question is **answered at 2 of 121** (119
`.mp4`, 98%), so the unsupported-format state stays as specified and conversion is not urgent
(VideoPlayer 2.17). **No token, class or copy key changes; `bundle.css` is byte-identical to 2.16;
no breaking change.** Details: `changelog.md`.
