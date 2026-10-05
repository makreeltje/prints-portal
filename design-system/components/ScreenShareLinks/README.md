Deel-links (`/share-links`, admin only) manages the read-only links customers open on their phone.

**Anatomy.** List grouped per klant with ShareLinkRow rows (label, created, expires relative and absolute, status, Intrekken). The primary button "Deel-link maken" opens the create dialog: Klant, Label, Verloopt (Over 7 / 30 / 90 dagen, Nooit is not offered). A klant that is niet factureren cannot get a link: choosing it shows the info alert "Geen Deel-link mogelijk. {klant} wordt niet gefactureerd, dus er is niets om te delen." and disables Maken. After Maken the TokenReveal dialog shows the full URL once. Intrekken opens a ConfirmDialog naming the label. **Phone:** rows become cards with the button under the details; dialogs are sheets. **Empty:** "Nog geen Deel-links" with the create button.

**Tokens.** ShareLinkRow, Dialog, TokenReveal, Alert tokens.

**States.** Loading, default, empty, creating, token shown, revoking, error.

**Accessibility.** Status is text plus icon; token box is focusable and selectable; confirm before revoke.

**Dutch copy.** Deel-links | Deel-link maken | Klant | Label | Verloopt | Maken | Geen Deel-link mogelijk. | {klant} wordt niet gefactureerd, dus er is niets om te delen. | Nog geen Deel-links | Deel-link {label} intrekken?
