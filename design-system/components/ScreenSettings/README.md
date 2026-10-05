Instellingen (`/settings`, admin only) holds the few global settings, stacked as sections in one scrolling page.

**Anatomy.** Sections as cards: **Algemeen** (button "Opnieuw indexeren" with a progress bar and, when done, a result alert; Thema radio Systeem, Licht, Donker); **Prijzen** (NumberInput "Standaardmarge" in %); **Bedrijfsgegevens** (Naam, IBAN, Adres, optional E-mailadres and Telefoon, optional Logo upload for PNG or SVG that replaces the studio name; there is no BTW, KvK or VAT field); **Klanten** (one Toggle "Niet factureren" per klant; flagged klanten have no sale price, payment, Openstaand, invoice or Deel-link); **Spoolman** (status card: Verbonden or Niet bereikbaar with the URL, spool count and last sync). **Phone:** one column, two-field rows stack. Each section saves on its own button; toggles save immediately.

**Tokens.** Card, FormField, NumberInput, Toggle, Radio, Alert tokens.

**States.** Reindex idle, running, done, failed; logo empty and set; Spoolman connected and unreachable (warning alert with Opnieuw proberen).

**Accessibility.** Sections are headings; the progress bar has `role="progressbar"` with values; toggles have visible labels.

**Dutch copy.** Instellingen | Algemeen | Opnieuw indexeren | Indexeren… {n} van {totaal} bestanden | Klaar. | Thema | Prijzen | Standaardmarge | Bedrijfsgegevens | Naam | IBAN | Adres | E-mailadres (optioneel) | Telefoon (optioneel) | Logo uploaden | PNG of SVG. Vervangt de naam op het scherm en op documenten. | Klanten | Niet factureren | Spoolman | Verbonden
