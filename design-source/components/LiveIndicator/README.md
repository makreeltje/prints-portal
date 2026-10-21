LiveIndicator shows whether live updates are connected; it is subtle while connected and clear when not.

**Anatomy.** Dot plus 12px text. Connected: green `paid` dot and "Live". Disconnected: a spinning ring in `warning` and "Verbinding verbroken — opnieuw verbinden…". Sits in the app shell footer or header; it has no click action.

**Tokens.** `paid`, `warning`, `muted`.

**States.** Connected, reconnecting. Under `prefers-reduced-motion` the ring does not spin.

**Accessibility.** Container is `role="status"`; changes are announced politely, only for the disconnected state.

**Dutch copy.** Live | Verbinding verbroken — opnieuw verbinden…

**1.9.** (2026-10-07) **Offline.** The loss of connection is now announced once, by the offline bar; this indicator keeps showing the state quietly in the shell and no longer has a toast beside it (GAP-087).
