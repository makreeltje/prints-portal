Facturen (`/invoices`) lists the final invoices and credit notes so they can be found, downloaded again and credited. It is new in v1.1.

**Anatomy.** Visible to Admin and Editor. Filter row (Klant, Type, search on number or klant) above a table: Nummer (`font-mono`), Klant, Datum, Bedrag (right-aligned, tabular; credit notes negative as `€ -56,67`), Type (badge Factuur or Creditnota, with "betreft {nummer}" under a credit note) and Acties (download; Admins also "Creditnota maken" on invoices). Invoices and credit notes share one yearly sequence YYYY-NNN. Concept PDFs are not listed because they are not stored. **Definitief maken** (from the export dialog) opens the ConfirmDialog that names klant, number of prints and amount; afterwards the lines show the badge "Op factuur {nummer}" on their prints and their price is locked. **Creditnota maken** (Admin) opens a dialog listing the invoice lines as checkboxes (all selected), a summary with the negative total, the new number and "Betreft factuur {nummer}"; confirm creates the credit note. **Phone:** cards with download below. **Empty:** "Nog geen facturen" with the sentence "Maak een factuur vanaf het dashboard."

**Tokens.** Table, Badge, Dialog, Checkbox, FilterBar tokens.

**States.** Loading, default, filtered, empty, downloading (spinner on icon), creating credit note, error.

**Accessibility.** Table with scope headers; download buttons have labels with the number; credit note dialog is a modal with a live total.

**Dutch copy.** Facturen | Nummer | Klant | Datum | Bedrag | Type | Factuur | Creditnota | betreft {nummer} | Creditnota maken | Creditnota maken voor factuur {nummer} | Kies de regels die je wilt crediteren. | Definitief maken | Nog geen facturen | Maak een factuur vanaf het dashboard.

**Inline values (1.4).** The preview no longer uses `style` attributes for layout: widths, gaps, alignment and weights come from `pp-w-*`, `pp-gap-*`, `pp-between`, `pp-end`, `pp-nowrap`, `pp-setrow`, `pp-kv tight`, `pp-bg-2`, `pp-sheetframe` and the other helpers listed in `changelog.md`. Spool and print colours remain the data properties `--c1` and `--c2`.

**1.5.** "Definitief maken" is refused while Bedrijfsgegevens lacks a name or IBAN (see ScreenInvoiceExport). Finalising fixes each order's price and locks price, cost adjustments and "Aantal keer geprint". A credit note (Admin) writes off the credited amount only up to what is still open; what was paid stays paid.
