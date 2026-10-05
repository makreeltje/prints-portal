System states are the pages and bars shown when something is wrong or nothing exists yet.

**Anatomy.** State pages use the classes `pp-state` (centred column, `space-6` padding, title in `text-xl` with `leading-xl`, text in `muted` with a maximum of 36 characters) and `pp-state wide` (44 characters, used by the first-run page); the buttons sit in `.acts`. **Global error** (`/` on a server or render failure): centred icon, "Er ging iets mis", one sentence and the buttons "Opnieuw proberen" (primary) and "Naar dashboard"; no stack traces. **403:** lock icon, "Geen toegang tot deze klant", the sentence "Je hebt geen toegang tot deze klant. Vraag een beheerder om toegang." and "Naar dashboard". **Offline or reconnecting:** a `warning` bar under the top of the page with a wifi-off icon and "Verbinding verbroken — opnieuw verbinden…"; content stays readable, write actions are disabled, the LiveIndicator in the shell shows the reconnecting state; when reconnected a toast "Verbonden" appears and the bar disappears. **First run:** folder icon, "Nog geen prints", the sentence about mappen per klant en project, a small diagram of the folder convention (`prints/` → klant → project → `.gcode`, `.3mf`, `.stl`) and the button "Opnieuw indexeren"; on a phone the diagram scrolls inside its card. Errors that are specific to a list use ErrorState inside the page instead.

**Tokens.** `bg`, `surface`, `border`, `unpaid`, `warning`, `font-mono`, Button tokens.

**States.** Each state is static; the offline bar toggles with the connection.

**Accessibility.** Each page has one `<h1>`; the offline bar is `role="status"`; icons are decorative.

**Dutch copy.** Er ging iets mis | De pagina kon niet worden geladen. Probeer het opnieuw. | Naar dashboard | Geen toegang tot deze klant | Je hebt geen toegang tot deze klant. Vraag een beheerder om toegang. | Verbinding verbroken — opnieuw verbinden… | Verbonden | Nog geen prints | Zet je bestanden in mappen per klant en project, en start daarna een index. | klant | project
