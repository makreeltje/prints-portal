ShareLinkRow is one Deel-link in the list: who it is for, when it expires, and whether it still works.

**Anatomy.** Grid: label (600) with klant below, created date, expiry (relative on top, absolute below; a link without expiry shows "Verloopt niet" in `muted` on one line, class `never`, and no date), status badge (Actief `paid`, Verlopen neutral, Ingetrokken neutral), and a danger Intrekken button (hidden for non-active links). Revoking opens a ConfirmDialog naming the label. At 900px and below the row becomes label + button with the rest stacked beneath.

**Tokens.** `surface`, `border`, `paid`/`neutral` badges, `muted`, `unpaid` button.

**States.** Active, active without expiry, expired, revoked, revoking (spinner).

**Accessibility.** Row is a list item; status is text plus icon; relative time has the absolute date in `title`.

**Dutch copy.** Q2 overzicht | Joey | Verloopt over 30 dagen | 4 nov 2026 | Verloopt niet | Actief | Verlopen | Ingetrokken | Intrekken.

**Inline values (1.5).** The row and its list use `pp-flush` and `pp-rule-t`; no `style` attributes remain.

**1.6.** (2026-10-07) **Columns line up (GAP-052).** The row grid is `minmax(0,1.4fr) repeat(3,minmax(0,1fr)) var(--pp-share-act)` with `--pp-share-act: 88px` (the width of the small danger button), so expired and revoked rows, which have an empty last cell, keep their dates and badge in the same columns as the active rows; at 900px and below the grid is `minmax(0,1fr) var(--pp-share-act)`. Subgrid is not used, so it works in every supported browser. **Day counts (GAP-051), confirmed as built.** ICU plurals, no "0 dagen" or "1 dagen": expiry "Over 1 dag" / "Over {days} dagen"; "Vandaag" for 0 (reuses `date.today`); expired "1 dag geleden" / "{days} dagen geleden"; "Vandaag" for a link that expired earlier today. The absolute date stays under the relative text.
