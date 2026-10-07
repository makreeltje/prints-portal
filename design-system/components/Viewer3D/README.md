Viewer3D shows the STL or 3MF model of a print, tinted with the spool colour.

**Anatomy.** 4:3 container (fixed aspect ratio, above the fold on phones) on a soft radial `surface` to `surface-2` ground, model centred, controls hint bottom-left ("Sleep om te draaien, scroll om te zoomen"), fullscreen button top-right (`pp-btn-ghost pp-btn-icon full`, icon maximize; in fullscreen the icon is minimize and the viewer fills the screen, Esc exits). The accessible name of the button is "Volledig scherm", and "Volledig scherm sluiten" while fullscreen. On the print detail page the viewer uses `pp-viewer fluid` (no max width). States: loading (skeleton with spinner and "Model laden…"), ready, error ("Model kon niet worden geladen" with retry), no model (`box` icon, "Geen 3D-model beschikbaar", the thumbnail is shown instead).

**Tokens.** `surface`, `surface-2`, `border`, `muted`, `radius-lg`; model colour comes from the spool.

**States.** Loading, ready, error, no model, reduced motion (no auto-rotate).

**Accessibility.** Canvas has `role="img"` with `aria-label="3D-voorbeeld van <naam>"`; keyboard: arrows rotate, +/- zoom, 0 resets; the hint is real text.

**Dutch copy.** Volledig scherm | Volledig scherm sluiten | Model laden… | Sleep om te draaien, scroll om te zoomen | Model kon niet worden geladen | Geen 3D-model beschikbaar.

**1.9.** (2026-10-07) **Size on the print detail (GAP-064, resolved).** `pp-viewer.fluid` is no longer unbounded: it caps at **560px wide** (4:3, so 420px high at most; 270px on a 360px phone, full width below 560px). At 1360px the viewer measured 1090x830, now 560x420, so Files, costs and the price field start about 410px higher; on a phone the viewer is full width and 270px high (was 293px). The cap replaces the earlier "no max width" rule; judging a part does not need more pixels, and orbit and zoom work inside the frame. **No model.** The state is its own element, `pp-viewer is-empty`: a one-line strip (min-height 72px, `space-3`/`space-4` padding, icon at the left, "Geen 3D-model beschikbaar" in `muted`), full width of the column, no 4:3 box and no thumbnail. It also stands for "model unavailable" on an archived print. **Several models** are chosen with ModelPicker (GAP-086, below the frame). **To measure (owner):** nothing; if 560px feels small on a 4K display the cap is a single value (`.pp-viewer.fluid`).
