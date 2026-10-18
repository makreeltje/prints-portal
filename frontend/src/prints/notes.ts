/**
 * 280 characters, because a note is read in two places with two different
 * budgets: the card shows it whole, a queue row shows one clamped line
 * (PrintNote). A field that could hold a paragraph would mean the row shows a
 * fragment of something the operator thinks he can see.
 */
export const MAX_NOTE_LENGTH = 280;
