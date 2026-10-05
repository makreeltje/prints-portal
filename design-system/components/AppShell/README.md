AppShell is the frame around every operator page: sidebar on desktop, top bar plus bottom bar on phones, with the theme switch and the live-connection indicator.

**Anatomy.** **Desktop (901px and up, sidebar from 901):** 220px sidebar (`surface`, `border` right edge): studio name (or uploaded logo) in `heading-lg`, nav list with 20px Lucide icons — Dashboard (layout-dashboard), Openstaand (clock), Facturen (receipt), then the group "Beheer" for Admins: Deel-links (link), Toegang (shield), Gebruikers (users), Instellingen (sliders-horizontal) — and API-docs (book-open) for everyone. Facturen is visible to Admin and Editor, not to User. Footer: user badge with role, "Thema" (cycles Systeem, Licht, Donker), "Uitloggen", LiveIndicator. The current page has `aria-current="page"` and a `primary-tint` ground. **Tablet (481–900px):** the sidebar collapses to an icon rail (56px) with tooltips. **Phone (480px and below):** top bar (menu button, studio name, live dot) and a bottom bar with Dashboard, Openstaand, Facturen and Meer; Meer opens the drawer (280px) with the full list, the user badge, Thema and Uitloggen. Main content padding is `space-6` on desktop and `space-4` on phones. No horizontal page scroll.

**Tokens.** `surface`, `border`, `primary-tint`, `primary-tint-soft`, `text-strong`, `muted`, `overlay`, `heading-lg`.

**States.** Nav item default, hover, current, focus-visible; drawer open and closed; live and reconnecting (the indicator changes; a toast announces the loss once).

**Accessibility.** `<nav aria-label="Hoofdmenu">`; skip link "Naar inhoud" before the nav; the drawer is a modal dialog with focus trap and Esc; icon-only items keep `aria-label`.

**Dutch copy.** Dashboard | Openstaand | Facturen | Beheer | Deel-links | Toegang | Gebruikers | Instellingen | API-docs | Meer | Thema | Uitloggen | Naar inhoud | Menu
