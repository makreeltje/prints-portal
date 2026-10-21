Toast and Alert report the result of an action; Toast floats and disappears, Alert stays in the page.

**Anatomy.** `.pp-alert` with icon, bold title, one line of text and optional action. Tones: `paid` (success), `unpaid` (error), `warning`, `info`. Toasts add `.pp-toast`, stack bottom-right (bottom-centre at 480px and below) and live 6 seconds, errors stay until dismissed.

**Tokens.** `*-tint` backgrounds, status colour for border and icon, `text` for copy, `shadow-md` (toast).

**States.** Visible, hovered (timer pauses), dismissed.

**Accessibility.** Toast container is `role="status"` (`role="alert"` for errors). Every tone has an icon and a title, never colour alone. Rolled-back optimistic changes use an error toast with a retry action.

**Dutch copy.** Opgeslagen | Opslaan mislukt, de wijziging is teruggedraaid. [Opnieuw proberen] | Prijs ontbreekt | Spoolman is niet bereikbaar.

**1.9.** (2026-10-07) **Lost connection (GAP-087, resolved).** Losing the connection is announced **once**: by the offline bar (`.pp-alert.warning.banner`, see ScreenSystemStates), which is the state. The toast for the loss is dropped. The toast **"Weer verbonden."** (`paid`, 6 seconds) stays and is the only announcement of the return; the bar disappears at the same moment. Dutch copy: Weer verbonden.
