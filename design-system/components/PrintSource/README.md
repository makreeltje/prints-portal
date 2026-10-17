PrintSource shows where a print's model came from: the links a print carries, typed or found in its folder.

**Why it exists (GAP-152).** The queue can say a job has no files; it could not say what kind of job it is. *Not downloaded yet* takes five minutes and *must be modelled from scratch* takes an evening, and 2.10 deliberately refused a fourth state for that difference (GAP-143) and read it from an observation instead. A bron is the **second observation in the same spirit**: a link means a model exists somewhere, so the job is a download. Nothing infers the other half — see *What this does not say* below, and PrintNote.

**It belongs to the print, not to the queue.** A request is the same record without a folder (2.10), so the field sits on every print and a queue row merely reads it, the way the row already reads the price. That is why its copy is `print.source.*` and not `queue.*`.

**Anatomy.** `div.pp-srcs` is the list; `span.pp-src` is one entry. Inside an entry, in this order: the `external-link` glyph (`svg.pp-ico`), the link (`a.pp-link` — **required**: the ellipsis lives on the link, not on the entry), and, only for an entry the indexer read out of the folder, `span.pp-hintchip` "uit de map". One entry is still a `.pp-srcs` with one `.pp-src` in it, so nothing changes shape when a second arrives.

**The visible text is the host and path, without the scheme** — `makerworld.com/models/482193`, not `https://makerworld.com/…`. The scheme is noise in a list of links and the host is what tells the operator at a glance which site this is. **A URL truncates at its end**, which is the opposite of a file name (`.pp-fname` cuts the middle, GAP-119): the identifying part of a URL is at the front, and the identifying part of a file name is at both ends.

**Typed and found sit side by side, and there is no precedence.** A typed bron never overwrites a `.url` file in the folder and the folder never overwrites what the operator typed — the same arrangement as a typed price beside measured grams. Order: the typed one first, then the folder's in folder order, because the typed one is the only one that can be edited here. The chip marks provenance and therefore appears **only** on the folder's entries: the provenance of a typed value is "you", and a chip saying so would be noise on every print.

**The one case that is folded:** when the typed URL is character-for-character one of the folder's, a single entry is shown — the folder's, with its chip. That is deduplication of one fact, not a precedence rule.

**Where it renders.**

| surface | form |
|---|---|
| **ScreenPrintDetail**, card "Deze print" | a `pp-kv tight` row, `dt` "Bron", `dd` the `.pp-srcs` list. Editable for Admin and Editor (below); role User sees the row read-only, because the klant sees it too |
| **ScreenQueue**, a row with **no files** | one `div.pp-reason.one` line in the name block: glyph, the host as a link, and `span.n.pp-muted` "+{count}" when more than one. Only on a fileless row: with files on disk the row's job is done and the bron is noise |
| **ScreenSharePage** | the host as a link under the print's name, **once per print**, on the first line that print has in the list (a nabestelling does not repeat it). No chip, no folder name, no provenance — the klant does not need to know the library's shape. The owner decided the klant *does* see this |
| **"Aanvraag toevoegen"** | a field in the dialog, whose anatomy is still not designed (2.10). When it is designed, it carries this field and PrintNote's |

**Editing (Admin, Editor).** Empty: no "Bron" row at all, and a ghost button **"Bron toevoegen"** under the facts. Filled: the typed entry becomes a `pp-field` with `input.pp-input[type=url]`, placeholder `https://…`, with Annuleren and Opslaan. **An entry with the chip is not editable** — it follows its `.url` file, and the next index pass would undo any edit. **Clearing is emptying the field and saving; there is no remove button** — 2.9 settled that absence is a value and not a separate act (GAP-138), and a destructive-looking control for something that destroys nothing is the pattern that rule exists to prevent.

**States.** Empty (nothing drawn but the add button), one entry, several entries, read-only (no add button, no input), editing, saving (input disabled, spinner in Opslaan), **error** — `aria-invalid="true"` on the input and `span.pp-err` "Vul een volledige link in, met https:// ervoor." The error is the only validation: a bron must parse as an absolute `http(s)` URL. Nothing checks that the page exists, and nothing fetches it — 2.3's rule stands (don't fetch the thing a picker picks between to label it), and a dead model page is still the truth about where the model came from.

**Phone.** Unchanged in the card (the list is one column already). On a queue row the line is clamped to one line with an ellipsis by `.pp-reason.one`, which matters since GAP-151 gave the name block the row's full width.

**Accessibility.** Each link is a real `<a>` with `rel="noopener noreferrer"` and `target="_blank"`; its accessible name is `print.source.open` "{host}, opent in een nieuw tabblad", so the new tab is announced and the name is never just "link". The chip's `title`/`aria-label` is `print.source.fromFolderAria` "Gevonden in {bestandsnaam}, in de map van deze print" — the chip's three words are not the only carrier of the fact. The glyph is `aria-hidden`; the link text carries the meaning, so colour is not the only cue.

**What this does not say.** A bron means **a link exists**, nothing more. It does not say the model is free, still online, licensed, downloaded, or that this print was printed from it. And a print with **no** bron is not "a design job": it may simply be a model the owner never kept the page for. The row with neither a bron nor a note is exactly today's row — "Nog geen bestanden" and nothing else — and that is the common case: 15 of 84 folders carry a `.url`, so **69 of 84 prints will show nothing here**. Inferring the job type from an absence is the fault rule 6 was written for, and GAP-143 already refused it once.

**Tokens.** `primary` (the link, 6.12 light / 6.79 dark on `surface`, already in `contrast.md`), `muted` (the glyph and the counter), `surface-2` and `border-strong` through `.pp-hintchip`, `unpaid` through `.pp-err`. **No new token and no new colour pair.**

**Icons.** `external-link` for a bron — **not** `link`, which the Iconography table already gives to a `.url` *file* in the library, and which the queue row uses for the *action* "Bestanden koppelen". A glyph says either what a thing is or what pressing does, never both (2.7, `play`/`film`).

**Dutch copy.** Bron | Bron toevoegen | https://… | uit de map | Gevonden in {bestandsnaam}, in de map van deze print | {host}, opent in een nieuw tabblad | +{count} | Vul een volledige link in, met https:// ervoor.
