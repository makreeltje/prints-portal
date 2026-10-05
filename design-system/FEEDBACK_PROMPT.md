# Prompt: take design gaps back to Claude's Design System

Paste this into the same Claude's Design System conversation or project that made the design system. Paste the current `[open]` entries from `DESIGN_GAPS.md` where indicated.

---

The 3D Prints Portal design system (version **<VERSION>**) is now being implemented. The developer found the gaps below while building it. Please update the design system to resolve them.

For each gap:

1. **Decide.** Resolve it, merge it with another gap, or reject it with a reason. Ask me if a gap needs a product decision.
2. **Resolve within the system.** Prefer existing tokens and components. Add a new token or component only if it is genuinely needed, and name it consistently with the existing scheme. Don't rename or remove existing tokens unless the gap requires it. If you must, list every breaking change.
3. **Deliver completely.** Give values for both light and dark themes, all states, phone and desktop layouts where relevant, Dutch copy, and contrast ratios for any new colour pair (WCAG 2.2 AA).
4. **Update the hand-off deliverables:** `tokens.css` (and JSON), the affected component specs and screens, the copy deck and the contrast report.

Finish with a **changelog for the new version (<NEXT VERSION>)**:
- a table `GAP-### → resolved / merged into GAP-### / rejected (reason)`;
- new tokens, changed tokens, new or changed components, new or changed screens;
- breaking changes, if any.

Open gaps:

```
<paste the [open] entries from DESIGN_GAPS.md here>
```
