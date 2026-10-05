Viewer3D shows the STL or 3MF model of a print, tinted with the spool colour.

**Anatomy.** 4:3 container (fixed aspect ratio, above the fold on phones) on a soft radial `surface` to `surface-2` ground, model centred, controls hint bottom-left ("Sleep om te draaien, scroll om te zoomen"), fullscreen button top-right. States: loading (skeleton with spinner and "Model laden…"), ready, error ("Model kon niet worden geladen" with retry), no model (`box` icon, "Geen 3D-model beschikbaar", the thumbnail is shown instead).

**Tokens.** `surface`, `surface-2`, `border`, `muted`, `radius-lg`; model colour comes from the spool.

**States.** Loading, ready, error, no model, reduced motion (no auto-rotate).

**Accessibility.** Canvas has `role="img"` with `aria-label="3D-voorbeeld van <naam>"`; keyboard: arrows rotate, +/- zoom, 0 resets; the hint is real text.

**Dutch copy.** Model laden… | Sleep om te draaien, scroll om te zoomen | Model kon niet worden geladen | Geen 3D-model beschikbaar.
