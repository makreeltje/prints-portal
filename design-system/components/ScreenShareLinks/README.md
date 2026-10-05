Deel-links (`/share-links`, admin only) manages the read-only links customers open on their phone.

**Anatomy.** List grouped per klant with ShareLinkRow rows (label, created, expires relative and absolute, status, Intrekken). The primary button "Deel-link maken" opens the create dialog: Klant, Label, Verloopt (Over 7 dagen, Over 30 dagen, Over 90 dagen, Nooit). Choosing Nooit shows the help text "De link blijft werken tot je hem intrekt."; ShareLinkRow then shows "Verloopt niet" in `muted` instead of a date. A klant that is niet factureren may get a link as well: the Klant field shows the help text "Deze klant wordt niet gefactureerd. De link toont alleen de printlijst, zonder bedragen." and Maken stays enabled; the share page then uses the not-billed variant (see ScreenSharePage). There is no disabled state. After Maken the TokenReveal dialog shows the full URL once. Intrekken opens a ConfirmDialog naming the label. **Phone:** rows become cards with the button under the details; dialogs are sheets. **Empty:** "Nog geen Deel-links" with the create button.

**Tokens.** ShareLinkRow, Dialog, TokenReveal, Alert tokens.

**States.** Loading, default, empty, creating, creating with Nooit, creating for a niet-factureren klant, token shown, revoking, error.

**Accessibility.** Status is text plus icon; token box is focusable and selectable; confirm before revoke.

**Dutch copy.** Deel-links | Deel-link maken | Klant | Label | Verloopt | Maken | Nog geen Deel-links | Deel-link {label} intrekken? | Over 7 dagen | Over 30 dagen | Over 90 dagen | Nooit | Verloopt niet | De link blijft werken tot je hem intrekt. | Deze klant wordt niet gefactureerd. De link toont alleen de printlijst, zonder bedragen.
