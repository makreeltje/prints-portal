TagChip labels a print with a user-chosen colour; text colour flips automatically for contrast.

**Anatomy.** 22px chip (`radius-sm`), 12px label. Background is the tag colour; text is `#141a33` or `#ffffff`, whichever has the higher contrast ratio. A tag without a colour uses `surface-2` with a `border-strong` outline. Variants: static, removable (x button, 16px target inside, 24px hit area), "+" add (dashed outline).

**Tokens.** `surface-2`, `border-strong`, `muted`, `radius-sm`; tag colours are user data.

**States.** Default, hover (removable x gets `primary-tint-soft`), focus-visible, selected as filter (2px `focus-ring` outline).

**Accessibility.** Remove button has `aria-label="<tag> verwijderen"`. Tags in a filter explain AND semantics (see FilterBar).

**Dutch copy.** cadeau, prio, herprint, klant-ontwerp, "Tag toevoegen".
