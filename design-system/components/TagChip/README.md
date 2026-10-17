TagChip labels a print with a user-chosen colour; text colour flips automatically for contrast.

**Anatomy.** 22px chip (`radius-sm`), 12px label. Background is the tag colour; text is `#141a33` or `#ffffff`, whichever has the higher contrast ratio. A tag without a colour uses `surface-2` with a `border-strong` outline. Variants: static, removable (x button, 16px target inside, 24px hit area), "+" add (dashed outline).

**Tokens.** `surface-2`, `border-strong`, `muted`, `radius-sm`; tag colours are user data.

**States.** Default, hover (removable x gets `primary-tint-soft`), focus-visible, selected as filter (2px `focus-ring` outline).

**Accessibility.** Remove button has `aria-label="<tag> verwijderen"`. Tags in a filter explain AND semantics (see FilterBar).

**Dutch copy.** cadeau, prio, herprint, klant-ontwerp, "Tag toevoegen".

**What a tag is for, and what it must never be (2.8, GAP-121).** The owner asked whether the tag system earns its place. **It does, and nothing here changes** — but it earns it as *labels*, and a rule has to be written down because the real library was using it for something else.

A tag is a free label the operator invents. The system never reads it: nothing branches on a tag, no total, badge, filter default, sort or document changes because of one, and a tag has no order and no next step. Every sample tag this component has shown since 1.0 — `cadeau`, `prio`, `herprint`, `klant-ontwerp` — is a thing a print **is**. That was right and the reason was never written: they are properties, not positions.

**A label whose values are mutually exclusive and ordered is state, not a tag.** The owner's five production tags — `waiting`, `abandoned`, `printing`, `done`, `gift` — are four stages of one job plus one real tag (`gift` is a property; the other four are positions in a sequence). They looked like noise because they are a workaround for a lifecycle the app does not model.

The reason a tag cannot carry a stage is mechanical, and it is in this system, not in the backend:

- **TagEditor's rows are checkboxes**, so a print can carry `printing` and `done` at the same time and nothing in the editor, the chip or the filter refuses it.
- **FilterBar's tag filter is AND** and says so in words ("Toont prints met alle gekozen tags (EN)"), so "show me everything that is waiting or printing" cannot be asked at all — the one question a queue exists to answer.
- **Tags have no order.** `ScreenTags` lists them alphabetically in a grid; a chip row on a card has no meaningful sequence. A stage without an order is not a stage.
- **A tag carries no date.** Nothing records when it was put on, and an asserted stage with no date is the fault named in rule 1 of `README.md`.

A state machine's value is that its invalid states cannot be represented. A tag set makes every invalid state representable by construction, and the four facts above are the proof rather than an opinion. So: **state gets a status** — a StatusBadge with an icon and a word, a FilterBar option, a place in a list — and the tag system keeps the job it has always had and is good at.

**Nothing to build from this entry.** No class, token or copy key changes, the chip is unchanged in both themes and all its states, and existing tags are not migrated by the design system. What follows from it is a refusal: a new label that is exclusive and ordered does not become a tag, and a screen does not read a tag to decide what to show.
