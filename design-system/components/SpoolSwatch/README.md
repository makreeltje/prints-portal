SpoolSwatch shows a filament colour as a 16px (24px large) disc; it is the main decorative colour in the UI.

**Anatomy.** Single: flat disc. Multi-colour: `.multi` (two halves) or `.grad` (diagonal blend, for silk). None: diagonal hatch for "geen spoel". **Slicer colour** (`.slicer`): a disc in the colour the slicer reports for a slot, drawn with a dashed outer ring and followed by the hint chip "slicer"; use it only where no spool is assigned to that slot. A 1.5px `border-strong` inner ring keeps very dark and very light filaments visible on every ground.

**Tokens.** `border-strong`, `muted`, `surface-2`; colours come from Spoolman, or from the slicer for an unassigned slot.

**States.** Static; in the picker the selected disc gets a `focus-ring` outline. **Tint rule (2.0):** the colour of the print's first assigned spool — else the slicer colour of the first used slot, else nothing — is used for **the object**: the Viewer3D model, the model in the server-rendered thumbnail, and the 4px filament bar under a card thumbnail. It is never used for a **ground**: thumbnail, plate and model-strip grounds are `surface-2` in both themes. See GAP-071 under PrintCard.

**Accessibility.** Swatch is decorative; the spool name (or "slicer" hint) is always next to it. Do not recolour the swatch per theme.

**Dutch copy.** Geen spoel, slicer, "eSun PLA+ Zwart", "Bambu PLA Silk Dual Goud/Zilver".

**2.0.** (2026-10-08) **GAP-071, resolved.** No `--mix`, no luminance floor, no `color-mix()`: the measurements showed that no single mix clears 3:1 at both ends, because an arbitrary colour and a fixed ground have no guaranteed contrast in either direction. The colour therefore moves off the ground and onto the object, and separation comes from a 1px outline the renderer bakes into the PNG (`#6f7a96`, 3.53:1 or more on both `surface-2` grounds). The swatch itself is unchanged — its 1.5px `border-strong` inner ring was already doing the right thing, and it is now the main place a filament colour is seen in a list.

**2.3.** (2026-10-08) **The outline moves from the renderer to the page (GAP-071, the open half, resolved).** 2.0 put a 1px `#6f7a96` outline in the server-rendered PNG. Measured, that rule covers **2 prints of 83**: 79 thumbnails are images embedded in a G-code, 3MF or project file that we only pass through. We do not rewrite a picture we did not make — so the outline is drawn by the page instead, from the picture's own alpha channel (`.pp-art`, four 1px `border-strong` drop-shadows). It is a token, so it is correct in both themes, which one baked ink could never be. The *Tint rule (2.0)* above still holds in full: the filament colour is for the object and never for a ground. Nothing about this swatch changes. Full reasoning: PrintCard's 2.3 note.
