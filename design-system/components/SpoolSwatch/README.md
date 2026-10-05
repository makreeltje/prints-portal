SpoolSwatch shows a filament colour as a 16px (24px large) disc; it is the main decorative colour in the UI.

**Anatomy.** Single: flat disc. Multi-colour: `.multi` (two halves) or `.grad` (diagonal blend, for silk). None: diagonal hatch for "geen spoel". A 1.5px `border-strong` inner ring keeps very dark and very light filaments visible on every ground.

**Tokens.** `border-strong`; the colours come from Spoolman (hex).

**States.** Static; in the picker the selected disc gets a `focus-ring` outline.

**Accessibility.** Swatch is decorative; the spool name is always next to it. Do not recolour the swatch per theme.

**Dutch copy.** Geen spoel, "eSun PLA+ Zwart", "Bambu PLA Silk Dual Goud/Zilver".
