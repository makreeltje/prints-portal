Tabs switch between sibling views of the same page, for example the sections of Instellingen.

**Anatomy.** Tab list with a 2px `primary` underline on the selected tab; selected text is `primary`, others `muted`. Scrolls horizontally inside its own container when it overflows.

**Tokens.** `primary`, `muted`, `text-strong`, `border`.

**States.** Default, hover, selected, focus-visible, disabled.

**Accessibility.** `role="tablist"`/`tab`/`tabpanel`, `aria-selected`, left/right arrows move focus, Home/End jump.

**Dutch copy.** Algemeen, Prijzen, Bedrijfsgegevens, Spoolman.

**2.15. The tab rail stays `border`, and that is a decision (GAP-169's system half).** When
`.pp-seg`'s track went to `border-strong` the obvious question was whether this component's
`border-bottom` should follow. It should not. The rail is a divider between the tab row and the
panel under it — content against content — and **it carries no state**: a selected tab is `primary`
text with a 2px `primary` underline (6.79 dark / 5.66 light on `surface`), and an unselected one is
`muted` text, both well past what they need. Nothing about the control's identity or its selection
is drawn in that hairline, so it is decorative and `border` is the right token. The rule, in one
line: **`border-strong` when a boundary is the information; `border` when the information is beside
it.**

**Tabs are not navigation.** `role="tablist"` with `aria-selected` is for sibling views of one page
(Instellingen's sections). Two destinations with their own URLs are links with `aria-current="page"`
— see AppShell 2.15 — and a tab strip is not an alternative to that, whatever it looks like.
