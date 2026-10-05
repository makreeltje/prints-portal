ShareLinkRow is one Deel-link in the list: who it is for, when it expires, and whether it still works.

**Anatomy.** Grid: label (600) with klant below, created date, expiry (relative on top, absolute below; a link without expiry shows "Verloopt niet" in `muted` on one line, class `never`, and no date), status badge (Actief `paid`, Verlopen neutral, Ingetrokken neutral), and a danger Intrekken button (hidden for non-active links). Revoking opens a ConfirmDialog naming the label. At 900px and below the row becomes label + button with the rest stacked beneath.

**Tokens.** `surface`, `border`, `paid`/`neutral` badges, `muted`, `unpaid` button.

**States.** Active, active without expiry, expired, revoked, revoking (spinner).

**Accessibility.** Row is a list item; status is text plus icon; relative time has the absolute date in `title`.

**Dutch copy.** Q2 overzicht | Joey | Verloopt over 30 dagen | 4 nov 2026 | Verloopt niet | Actief | Verlopen | Ingetrokken | Intrekken.
