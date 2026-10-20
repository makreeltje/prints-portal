WriteOffDialog writes off the open remainder of a print; it is the only place an Afschrijven amount is confirmed.

**Anatomy.** Dialog titled "Afschrijven ({bedrag})?", one sentence naming the print and the remainder, for a partially paid print the extra line "Al betaald: € 5,00. Alleen de rest wordt afgeschreven.", an optional Textarea "Reden" with the help "Optioneel. Zichtbaar voor beheerders.", and the footer Annuleren and the danger button Afschrijven. The amount in the title is the remaining amount, never the full price of a partially paid print.

**Tokens.** Dialog tokens, `unpaid`, Textarea.

**States.** Default, loading, error (inline alert, reason kept).

**Accessibility.** `role="alertdialog"`; initial focus on Annuleren; the textarea has its own label.

**Dutch copy.** Afschrijven (€ 6,89)? | De rest van 'Bloembak clips' (€ 6,89) wordt afgeschreven. | Al betaald: € 5,00. Alleen de rest wordt afgeschreven. | Reden | Optioneel. Zichtbaar voor beheerders. | Afschrijven
