Dialog is a modal window for a focused task such as creating a Deel-link or exporting a Factuur.

**Anatomy.** Scrim (`overlay`), panel (`surface`, `radius-xl`, `shadow-lg`, max 440px; 560px for forms), header with title and close button, body, footer with actions right-aligned (primary last). At 480px and below it becomes a full-height sheet pinned to the bottom.

**Tokens.** `overlay`, `surface`, `border`, `shadow-lg`, `radius-xl`, `space-5`, `heading-lg`.

**States.** Opening and closing fade with `motion-base`; body scrolls inside the panel; loading state disables the footer buttons and shows a spinner on the primary one.

**Accessibility.** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` the title; trap focus; Esc closes (unless a request is running); return focus to the trigger; lock page scroll.

**Dutch copy.** Deel-link maken, Label, Verloopt, Maken, Annuleren.

**1.5.** Dialogs have three widths: `pp-dialog sm` 380px, the default 440px and `pp-dialog lg` 560px (the invoice export dialog). The footer wraps when the buttons do not fit and stays right-aligned. In previews the frames `pp-scrim f-sm`, `f-md` and `f-lg` match these widths (dialog plus 24px scrim padding on both sides) so overflow is not hidden by a wider frame.

**2.13.** (2026-10-18) **A click beside the panel (GAP-147, resolved).** The spec said Esc closes
and said nothing about the backdrop, so the app did exactly that and the owner reached for the
backdrop first. **The rule is by kind, and the kind is decided by what a stray click can cost:**

- **A dialog that holds nothing the viewer has typed closes on a backdrop click.** The klant
  overview, a preview, the video player, a 3D view, anything that only shows. Nothing is lost, and
  dismissing it is the most frequent thing anybody does to it.
- **A dialog with a form does not** — any field the viewer can have typed in or changed, including
  one still empty: the invoice export, the Nabestelling, a cost override, a write-off, the bulk
  dialogs, "Deel-link maken".
- **A ConfirmDialog never does**, destructive or not. A confirmation exists to make an act
  deliberate; dismissing it with a click that lands beside it is the opposite of deliberate, and the
  reflex that closes an information dialog would then also answer a question.

**By kind, not by state.** A form dialog whose fields are untouched is **rejected** as a case: a
dialog that sometimes closes on a backdrop click teaches nothing, and the viewer cannot see which
kind of moment they are in. Unchanged either way: Esc closes (unless a request is running), the
close button and Annuleren are always there, and a dialog that refuses the backdrop does **not**
animate, flash or shake — it does nothing, and the two visible ways out are the answer.

The app's placeholder (a backdrop click closes a dialog with no `onSubmit` that is not an alert) is
what this specifies; the `ds-gap: GAP-147` marker can go. **No new class, no new token, no copy.**
