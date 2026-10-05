# Design-system guardrails: setup

Copy this kit into the root of the new, empty repository **before** Claude Code starts building.

```
CLAUDE.md                          ← merge into your CLAUDE.md ("Design system" section)
.claude/settings.json              ← hook: runs the checker after every Claude Code edit
                                     + blocks Edit/Write on the design-system files
.github/workflows/design-system.yml← same check in CI + guards design-system/ changes
scripts/check-design-tokens.sh     ← the checker (bash; jq recommended)
design-system/README.md            ← import instructions + changelog
design-system/DESIGN_GAPS.md       ← gap log (Claude Code writes here)
design-system/FEEDBACK_PROMPT.md   ← prompt to take gaps back to Claude's Design System
```

## Steps

1. Create the repo and copy the kit in. Run `chmod +x scripts/check-design-tokens.sh`.
2. Export the design system from Claude's Design System into `design-system/` (layout in `design-system/README.md`). Set `VERSION` to `1.0`.
3. Commit with the message `design-system: import v1.0`.
4. Check `DS_SRC_DIR`. The checker scans `frontend/src` by default. If Claude Code proposes a different frontend folder, set `DS_SRC_DIR` in the hook command and the CI step. Don't let Claude Code change it on its own.
5. Start Claude Code with the build prompt (`claude-code-prompt.md`), adding this paragraph at the top:

   > The visual design is fixed. `design-system/` (version in `design-system/VERSION`) is the only allowed source for tokens, components, layouts and Dutch UI copy. Follow the "Design system" section of CLAUDE.md strictly. Where the design system is missing something or is unclear, log a gap in `design-system/DESIGN_GAPS.md`, stop that piece of UI and ask me; never improvise visual values. Section §14 milestone 9 ("implement the design system I will provide") means this folder.

6. Open `/hooks` in Claude Code once to confirm the PostToolUse hook is listed.

## The loop

```
Claude Code hits a gap ──► logs GAP-### [open] in DESIGN_GAPS.md ──► stops that UI, asks you
        ▲                                                                  │
        │                                                                  ▼
Claude Code implements, marks              you paste open gaps into FEEDBACK_PROMPT.md
GAP-### [resolved in v1.1]  ◄── import v1.1 ◄── Claude's Design System updates + changelog
```

## Limits (be aware)

- **Lexical, not visual.** The checker catches raw colours, lengths, fonts, shadows, motion timings, unknown or new tokens, and inline styles. It can't tell whether a layout *looks* like the design. That's why `CLAUDE.md` also requires a screen-by-screen comparison, and why you review screenshots.
- **The checker is written for CSS custom properties.** If the chosen stack uses Tailwind, CSS-in-JS or another styling approach, have Claude Code propose an equivalent rule set (e.g. a Tailwind config generated *only* from `tokens.json`, plus a lint rule against arbitrary values like `p-[13px]`). Review that before approving it.
- **Permission rules aren't a sandbox.** They stop Claude Code's Edit/Write tools, but a shell command could still change files. The CI job is the backstop. Review diffs to `design-system/`, `scripts/` and `.claude/`.
