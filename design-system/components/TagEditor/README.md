TagEditor is the popover (bottom sheet on phones) that sets the tags of one print, or of a selection through BulkActionBar. Search finds existing tags; a new name can be created on the spot.

**Anatomy.** `.pp-pop.pp-tagpop`: search field "Zoek of maak een tag", `.list` of `label.row` (checkbox plus TagChip; tri-state in bulk), and at the end `.row.create` "Tag 'x' maken" with a plus icon. A name that already exists in another case shows only the existing tag and no create row (tags are case-insensitively unique). Maximum 64 characters; longer input shows "Een tag mag maximaal 64 tekens hebben." and no create row. Colour is chosen on the Tags page (palette `.pp-pal` with 10 colours and "Geen kleur"); new tags from the popover start without colour. **Phone:** the popover becomes a bottom sheet over the page with 44px rows.

**Tokens.** `surface`, `border`, `shadow-lg`, `radius-xl`, `primary-tint-soft`, `tag-*` palette tokens, `focus-ring`.

**States.** Empty list, results, with create row, name exists, too long, saving, error.

**Accessibility.** `role="dialog"` with label "Tags bewerken"; focus starts in the search field; Esc closes; the create row is a button reachable with Tab and Enter; rows are real checkboxes.

**Dutch copy.** Tags bewerken | Zoek of maak een tag | Tag '{naam}' maken | Een tag mag maximaal 64 tekens hebben. | Geen tags gevonden

**Stacking (1.4).** Above 480px the editor is `.pp-anchor > .pp-pop` and floats under the tags it edits, above the viewer and cards (`z-popover`); it does not push the page down. At 480px and below it is the bottom sheet (`z-overlay`).

**Colour names (1.4).** The palette swatches in `.pp-pal` have Dutch accessible names (`tags.colour.rose` … `tags.colour.grey`: Roze, Oranje, Amber, Limoen, Turquoise, Hemelsblauw, Blauw, Violet, Lila, Grijs, plus "Geen kleur"); the `data-c` keys stay English because they are data, not copy.

**Where the panel goes (2.2, GAP-112).** The editor is a Popover and takes Popover's placement rule in full. `.list` is the scroll region: it keeps 240px as the height it prefers and shrinks below it when the panel is capped, so the search field and the create row stay in view while the tags scroll. With many tags on a trigger low in the page this is the difference between a search field and a usable editor.

**Checkboxes are a statement about meaning (2.8, GAP-121).** The rows are checkboxes and tri-state in bulk, which says that tags are **independent and simultaneous**: any subset of them is valid, and the editor will never refuse a combination. That is the right behaviour for labels and the wrong behaviour for stages, so it is also the reason a stage may not be modelled as a tag — see TagChip. Do not add exclusivity to this editor, a radio variant, a "stage" group or an order to the list: the moment a tag set needs one of those, the thing being modelled is state and belongs in a status the whole UI can read.
