PrintNote is the short internal note on a print: what the owner still has to make, in his own words.

**Why it exists (GAP-152).** A fileless job can be a download or an evening of modelling, and the owner held that difference in his head. PrintSource reads the download half from a link. This is the other half, and it is deliberately **not** a classification: it is the sentence he wrote for himself. The note is a field on **every print record**, like the bron and like the price, because a request is the same record without a folder (2.10).

**Internal, decided by the owner.** The note never appears on the share page, in the Overzicht PDF, on an invoice or anywhere else a customer can reach, and the role **User never sees it** (a rule this system has had since 1.1: "User never sees cost or notes" — this is the first field that makes it concrete). The field says so itself, beside the text, every time: `print.note.internal` "Alleen voor jou. Niet zichtbaar op de deel-link."

**Anatomy.** `div.pp-note` on `surface-2`, `radius-md`, with the required descendants `span.l` (the label "Notitie"), a `p` (the text, which keeps the operator's own line breaks — `white-space: pre-line`) and `span.pp-help` (the internal line). Writing it: a `pp-field` with `textarea.pp-input`, `maxlength="280"`, the placeholder "Wat moet er nog gemaakt worden?", the same help line through `aria-describedby`, and Annuleren / Opslaan.

**280 characters, and the reason rather than the number:** the note is read in two places with two different budgets — the card shows it whole (three lines at `text-sm` in a 420px column) and a queue row shows **one** clamped line. A field that can hold a paragraph would mean the row shows a fragment of something the operator thinks he can see. If he needs a paragraph, it is not a note, and the right answer then is a question for the owner rather than a longer field.

**Where it renders.**

| surface | form |
|---|---|
| **ScreenPrintDetail**, card "Deze print" | `div.pp-note` at the foot of the card, under the facts and the spool control. Admin and Editor can write it; role User does not see the block at all |
| **ScreenQueue**, any row | one `div.pp-reason.one` line in the name block — the `sticky-note` glyph and the note's text, clamped to one line. **It shows on a row with files too**, unlike the bron: the note is about the work, and the work outlives the arrival of the files ("In zwart printen, de vorige was wit") |
| **ScreenSharePage**, the Overzicht PDF, the invoice | never |
| **"Aanvraag toevoegen"** | a field in the dialog, whose anatomy is still not designed (2.10); it carries this field and PrintSource's when it is |

**Order inside the row's name block:** name, klant (and project), "Nog geen bestanden", the bron, the note. Never more than these; a row shows at most three meta lines, and each is one line.

**States.** Empty (nothing drawn — no empty frame, no label; a ghost button "Notitie toevoegen" where the role may write), filled, editing, saving (textarea disabled, spinner in Opslaan), error (the save failed: the existing inline alert and a toast; the text the operator typed stays in the field), read-only for a role that may see it, and **absent** for role User. There is no "too long" error state: `maxlength` stops the 281st character, which is the state nobody has to be told about.

**Clearing is emptying the field and saving.** No remove button, for the reason 2.9 settled (GAP-138): absence is a value, not a separate act.

**Phone.** The block is full width in the card. On a row, `.pp-reason.one` clamps the line, which is what makes a note safe in a row whose name block now owns the full width (GAP-151).

**Accessibility.** The block is plain text, not a tooltip and not a title attribute, so it is read by everything that reads the row. The glyph is `aria-hidden`. The help line is tied to the field with `aria-describedby`, never only visual. The note's text is **never** turned into a status, badge or colour: it is the operator's prose and the system makes no claim about it.

**What this does not say.** A note does **not** mean "this must be designed". It may say "wacht op maten van Eva" or "in zwart printen". The system therefore never derives a job type, a sort order, a badge or a filter from the presence of a note — 2.10 refused exactly that inference for "no files" (GAP-143) and the reason has not changed: naming an inference is the fault rule 6 exists for. The sort inside a queue group stays the one 2.10 specified (fileless rows first), and the note changes nothing about it.

**Tokens.** `surface-2` (the well), `text` on it (10.89 light / 9.38 dark, in `contrast.md`), `muted` for the label and the help line (5.18 light / 6.06 dark on `surface-2`, in `contrast.md`), `radius-md`, `space-3`. **No new token and no new colour pair.**

**Icons.** `sticky-note` for the note, added to the Iconography table. Not `pencil`: a pencil is the act of writing, and this glyph marks a thing that exists (2.7, `play`/`film`).

**Dutch copy.** Notitie | Notitie toevoegen | Wat moet er nog gemaakt worden? | Alleen voor jou. Niet zichtbaar op de deel-link.
