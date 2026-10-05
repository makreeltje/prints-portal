Print detail (`/prints/:id`) shows one print: identity and status, the 3D model, its files, the cost breakdown and the payment panel.

**Anatomy.** **Header:** breadcrumb "klant / project", name as `<h1>`, the payment or billing badge, tags, and a danger button "Verwijderen" (ConfirmDialog; deleting hides the print but keeps its financials). **Desktop (901px and up):** two columns, left Viewer3D then the file list (AssetListItem with slots, plates, times printed, duplicates), right "Spoel voor de hele print" (SpoolPicker), CostBreakdown and PaymentPanel. **Phone:** one column in the order Viewer3D (above the fold, fixed aspect ratio), payment, files, costs. **Variants:** *Gearchiveerd* (info alert; files gone from disk, model and downloads unavailable, price and payment stay editable); *Verwijderd* (admin only, unpaid-tinted alert with Herstellen); *Kosten ontbreken* (warning alert with Aanpassen; the suggestion button is disabled); *Vergrendeld* (badge "Op factuur {nummer}" and an info alert; price field disabled); *Niet factureren* (cost shown as "Kosten", PaymentPanel replaced by its note); *Rol User* (name, price and status only; no cost, breakdown, notes or file controls).

**Tokens.** `bg`, `surface`, `border`, CostBreakdown, PaymentPanel, AssetListItem, Viewer3D tokens.

**States.** Loading (Skeleton), default, archived, deleted, missing cost, locked, niet factureren, user role, saving, error.

**Accessibility.** One `<h1>`; each card has a heading; admin-only controls are not rendered for other roles; destructive actions confirm.

**Dutch copy.** Bestanden | Spoel voor de hele print | Bestanden en slots met een eigen spoel gaan hierboven voor. | Gearchiveerd. | Verwijderd op {datum}. | Kosten ontbreken. | Op factuur {nummer}. | Je ziet alleen prijs en status.
