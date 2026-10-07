ModelPicker lets the viewer show any of a print's models when a print holds several (GAP-086, new in 1.9).

**Anatomy.** Under the Viewer3D frame: a caption "Model {n} van {totaal}: {bestandsnaam}" (`text-sm`, name in `text-strong`) and, for two or more models, a strip of 76px buttons (`pp-modelbtn`: a square thumbnail on the print's tinted ground, the file name truncated under it). The buttons are one `role="group"` named "Modellen"; each is a toggle button with `aria-pressed`, the selected one has a `primary` border and `primary-tint-soft` ground. Choosing a model swaps the viewer (the frame keeps its size, "Model laden…" shows while the new file loads) and the caption; the choice is not stored. **Which model first:** the one the print's thumbnail is rendered from (first model by file name). **Many models:** up to 6 the strip, more than 6 a Select "Model" with options "{naam} ({n} van {totaal})" in file order; the strip scrolls sideways on narrow screens. **One model:** no strip and no caption. **None:** Viewer3D's no-model strip.

**Tokens.** `surface`, `border`, `border-strong`, `primary`, `primary-tint-soft`, `muted`, `text-strong`, `radius-md`/`radius-sm`, `space-1`/`space-2`, `focus-ring`.

**States.** Default, hover, selected, focus-visible, loading the next model, more than 6 (Select), one model, none.

**Accessibility.** Toggle buttons in a labelled group; the accessible name of a button is "Model {naam}", the selected state is `aria-pressed`, not colour alone (the border and background change and the caption names the model); Arrow keys are not required, Tab moves between buttons; the viewer's `aria-label` names the current model ("3D-voorbeeld van {naam}"). The strip is a scroll region only when it overflows and then has `tabindex="0"` and `aria-label="Modellen"` (the 1.8 rule).

**Dutch copy.** Modellen | Model | Model {n} van {totaal}: {bestandsnaam} | Model laden… | 3D-voorbeeld van {naam}

**To measure (owner):** how many models a print holds (the largest and the median). The 6-button limit assumes few prints have more than 6; if many do, raise the limit or always use the Select.
