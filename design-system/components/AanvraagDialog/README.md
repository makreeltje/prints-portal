AanvraagDialog captures a request before it has files: the dialog behind ScreenQueue's primary "Aanvraag toevoegen".

**Why it took three rounds to draw (GAP-157).** 2.10 built the queue and deliberately left this dialog undesigned, because what a request *is* was the implementer's data model to settle; 2.11 gave the record two more fields (PrintSource, PrintNote) and both READMEs say, in a table row, that this dialog carries them; 2.13 postponed it again. In the meantime the app built it from nothing and marked it `ds-gap: GAP-157`. So this file is late, and its shape is almost entirely dictated by decisions that already exist: a request is **the same print record without a folder** (2.10), the dialog has to work **in a phone browser with no folder at all** (GAP-123, the owner enters requests while he is out), and **nothing here creates a folder** (`README.md` rule 7).

**Anatomy.** `pp-dialog` (440px; `pp-dialog sheet` at 480px and below), header with the title `queue.add` "Aanvraag toevoegen" and the close button, body in one column, footer Annuleren + the primary "Toevoegen". Five fields, in this order:

| # | field | required | form |
|---|---|---|---|
| 1 | **Naam** | yes | `input.pp-input`, placeholder "Bijvoorbeeld: Babybox locks". Holds focus when the dialog opens |
| 2 | **Klant** | yes | a combobox — `span.pp-anchor > span.pp-iwrap > input.pp-input[role=combobox]` with the `pp-pop pp-picker` listbox, SpoolPicker's pattern exactly. Options are the klanten the library knows, each with `customers.printCount` as its `small` line; the **last** option is the typed name, `queue.add.customerNew` "Nieuwe klant: {klant}". Help line underneath: "Een nieuwe klant is alleen een naam, tot er een map met bestanden is." |
| 3 | **Status** | yes (defaulted) | two radios in a `role="group"`: **Nog niet besloten** (default) and **Mee bezig** — the two queue states and no others, see below |
| 4 | **Bron** | no | `input.pp-input[type=url]`, placeholder `https://…`. PrintSource's field and PrintSource's one validation: it must parse as an absolute `http(s)` URL, error `print.source.invalid` |
| 5 | **Notitie** | no | `textarea.pp-input[maxlength=280]`, PrintNote's placeholder and its help line "Alleen voor jou. Niet zichtbaar op de deel-link.", tied with `aria-describedby` |

**Name before klant, because the dialog creates a row and the row reads name-then-klant.** The name is also the thing he was just told ("kun je een kastje maken voor de meterkast"), so the field that holds focus is the field he can fill without a decision.

**The klant may be a name that is not a folder yet, and that is the point.** He takes requests at other people's houses and makes folders on his laptop. So the combobox accepts a new name, the record keeps it as text, and `queue.linkFiles` ("Bestanden koppelen") later points at a folder that exists by then. The help line says what the new name is and is not, in the vocabulary rule 7 gives us: the portal reads `/prints` and never writes it.

**Three things this dialog does not have, each for a reason.**

- **No Project.** A project is a folder level the indexer reads. A project typed here would be a second name that has to keep agreeing with a folder nobody has made yet, and GAP-072's rule ("show the project only when it differs from the print name") has nothing to compare against before the files land. The queue row therefore shows the klant and no project until there are files.
- **No price.** The queue row shows a price *when one is set*, and it is set where money is managed — an order's PaymentPanel. A number typed here would be a quote, and this system has no concept of a quote (no VAT, no accounting, `README.md` *Content fundamentals*).
- **No "Niet doorgegaan" and no "Geen status" in the Status field.** Both are real values of the record (GAP-138) and neither can be the state of a record that has *just* been typed and has no files: it would be in neither queue group and absent from the dashboard (ScreenQueue, GAP-123), so it would exist in the database and on no screen at all. A request is refused later, on the row, not at birth.

**States.** Default (empty, focus on Naam), the klant list open, a name that is still empty after Toevoegen (`aria-invalid="true"` + `pp-err` "Vul een naam in."), no klant chosen (`queue.add.customerError`), an invalid bron, saving (both footer buttons `disabled`, `pp-spin` in the primary), and failed — a `pp-alert unpaid` at the top of the body with `queue.add.error`, **everything the operator typed kept**. There is no "too long" state for the note: `maxlength` stops the 281st character (PrintNote).

**What happens after Toevoegen.** The dialog closes, the row appears in its group — at the **top** of it, since a fileless row sorts first (GAP-143) — and a toast `queue.added` "Aanvraag toegevoegd." confirms it. **No flash**, and that is deliberate: the flash (`pp-flash`, GAP-024) marks a change made *somewhere else*, and this row is the result of the operator's own act in the dialog he just closed. The row count is announced politely, as ScreenQueue already specifies.

**Backdrop.** This is a dialog with a form, so a backdrop click does **not** close it and does nothing visible (Dialog 2.13, GAP-147). Esc closes unless the save is running; the close button and Annuleren are always there.

**Accessibility.** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` the title, focus trapped, focus returns to "Aanvraag toevoegen". Every field has a real `<label for>`; the Status group is a `role="group"` with `aria-labelledby` on its `pp-flabel`; the combobox carries `aria-expanded` and `aria-activedescendant` and is operated with ArrowUp/Down, Enter and Esc (SpoolPicker). Each error is real text in the field, linked with `aria-describedby`, never a tooltip.

**Tokens.** No new token. Dialog, FormField, Radio, Popover and Alert tokens; classes `pp-dialog`, `pp-field`, `pp-input`, `pp-radio`, `pp-opt`, `pp-anchor`, `pp-iwrap`, `pp-picker`, `pp-err`, `pp-help`, `pp-spin`, `pp-alert`. **No new class.**

**Dutch copy.** Aanvraag toevoegen | Naam | Bijvoorbeeld: Babybox locks | Vul een naam in. | Klant | Zoek of typ een klant | Nieuwe klant: {klant} | Een nieuwe klant is alleen een naam, tot er een map met bestanden is. | Kies of typ een klant. | Status | Nog niet besloten | Mee bezig | Bron | https://… | Vul een volledige link in, met https:// ervoor. | Notitie | Wat moet er nog gemaakt worden? | Alleen voor jou. Niet zichtbaar op de deel-link. | Toevoegen | Annuleren | Toevoegen mislukt. Wat je hebt ingevuld staat er nog; probeer het opnieuw. | Aanvraag toegevoegd.
