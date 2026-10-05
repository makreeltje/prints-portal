SpoolSwatch shows a filament colour as a 16px (24px large) disc; it is the main decorative colour in the UI.

**Anatomy.** Single: flat disc. Multi-colour: `.multi` (two halves) or `.grad` (diagonal blend, for silk). None: diagonal hatch for "geen spoel". **Slicer colour** (`.slicer`): a disc in the colour the slicer reports for a slot, drawn with a dashed outer ring and followed by the hint chip "slicer"; use it only where no spool is assigned to that slot. A 1.5px `border-strong` inner ring keeps very dark and very light filaments visible on every ground.

**Tokens.** `border-strong`, `muted`, `surface-2`; colours come from Spoolman, or from the slicer for an unassigned slot.

**States.** Static; in the picker the selected disc gets a `focus-ring` outline. **Tint rule:** a PrintCard or PrintRow thumbnail and the Viewer3D model use the colour of the print's first assigned spool; if no spool is assigned they use the slicer colour of the first used slot; if neither exists they use `surface-2` with no tint.

**Accessibility.** Swatch is decorative; the spool name (or "slicer" hint) is always next to it. Do not recolour the swatch per theme.

**Dutch copy.** Geen spoel, slicer, "eSun PLA+ Zwart", "Bambu PLA Silk Dual Goud/Zilver".
