LoadMore appends the next page of a long list; use it instead of numbered pages.

**Anatomy.** Centered secondary button with a count line ("24 van 61 prints"). Loading state shows a spinner inside the button. After loading, focus moves to the first new item.

**Tokens.** Button tokens, `muted` for the count.

**States.** Default, loading, end of list (button disappears, count remains).

**Accessibility.** Count line is `aria-live="polite"`; the button is a real `<button>`.

**Dutch copy.** Meer laden, "24 van 61 prints", "Alle prints geladen".
