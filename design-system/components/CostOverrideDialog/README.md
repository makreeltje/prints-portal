CostOverrideDialog lets an editor enter a price per kg, a weight and a print time by hand for a print, a file or a slot whose data is incomplete.

**Anatomy.** Opened by "Aanpassen" in CostBreakdown (print level) or from the slot/file row menu. Dialog "Kosten aanpassen" with the target in the subtitle (print, bestand or slot), NumberInputs "Prijs per kg" (`€` prefix), "Gewicht" (`g`), and "Printtijd" as two inputs (`u` and `min`), a short source line ("Waarden die je invult krijgen de bron Handmatig."), and the footer: ghost "Terug naar berekend" on the left, then Annuleren and Opslaan. Empty fields mean "niet overschrijven". When a spool from Spoolman supplies the price per kg the price field is disabled with the help text "Prijs komt uit Spoolman." and only weight and time can be changed. Saved values show the Handmatig badge in CostBreakdown; "Terug naar berekend" asks no confirmation and clears all three.

**Tokens.** Dialog and NumberInput tokens, `info` (source line), `muted`.

**States.** Default, price disabled (Spoolman), error (invalid number), saving.

**Accessibility.** Each input has a label with its unit; the disabled field keeps its help text linked with `aria-describedby`; Enter submits, Esc closes.

**Dutch copy.** Kosten aanpassen | Prijs per kg | Gewicht | Printtijd | Waarden die je invult krijgen de bron Handmatig. | Prijs komt uit Spoolman. | Terug naar berekend | Opslaan | Annuleren

**Inline values (1.4).** The two print-time inputs use `.pp-time` (120px); the "voorgesteld" hint is `.pp-hint`; the disabled suggestion button is `aria-disabled` (`opacity-disabled`).
