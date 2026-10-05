# CLAUDE.md

<!-- Merge this section into the repository's CLAUDE.md. Keep it near the top. -->

## Design system (strict: read before touching any UI)

The **only** visual source of truth is the folder `design-system/`. It is an export of the design system made in Claude's Design System, and its version is in `design-system/VERSION`.

### Rules
1. **Use only what is defined in `design-system/`:**
   - tokens from `design-system/tokens.css`;
   - components and their states as specified in `design-system/components/`;
   - screen layouts from `design-system/screens/`;
   - Dutch UI copy from `design-system/copy.*`.
2. **Never invent visual values.** No raw hex/rgb/hsl colours, px/rem lengths (except `0` and `1px` hairlines), font stacks, shadows, radii, z-index scales or animation timings. Every value comes from a token.
3. **Never edit `design-system/`.** It is read-only and is only replaced by a new export. Do not add tokens anywhere else either (no new `--custom-properties` outside `tokens.css`).
4. **Implement components exactly as specified:** anatomy, variants, states (hover, focus-visible, active, disabled, loading, error, empty), accessibility notes and copy. If the spec and these instructions conflict, the spec wins for visuals, and you ask me.
5. **No third-party UI kits or CSS frameworks** that bring their own visual language (Bootstrap, MUI, Chakra, Tailwind presets, …), unless I approve it **and** they are configured to use only our tokens. Icon set: only the one named in the design system.

### When something is missing, unclear or looks wrong: stop and ask
Treat this as a hard stop for that piece of UI, not a reason to improvise.

1. Add an entry to `design-system/DESIGN_GAPS.md`. This is the **only** file in `design-system/` you may edit. Use the template in that file:
   - next free `GAP-###` id, status `[open]`;
   - the type (missing token / missing component / missing state / missing screen / unclear spec / conflict / suspected design bug / improvement idea);
   - where it is needed (screen, component, file);
   - what exactly is missing;
   - what you would propose;
   - what is blocked.
2. **Stop work on that UI element** and tell me, in this format:
   > Design gap GAP-### (type): one-line summary. Blocked: … Proposal: … Shall I wait for an updated design system, or use the proposal temporarily?
3. Carry on with other work that does **not** depend on the gap (backend, other screens), and say what you are doing.
4. If I approve a **temporary** placeholder:
   - build it only from existing tokens;
   - mark the line(s) with a comment `ds-gap: GAP-###`;
   - leave the gap `[open]`.
   The checker accepts such lines only while that gap is open.
5. **Improvements:** if you think the design system could be better (accessibility, consistency, missing edge case), log it as type "improvement idea" and mention it. Don't implement it until the design system is updated.

### After a new export arrives
When I replace `design-system/` with a new version:
1. Read `design-system/VERSION` and the changelog in `design-system/README.md`.
2. For every `[open]` gap that the new version resolves, implement the official solution, remove the `ds-gap: GAP-###` markers, and set the gap to `[resolved in vX.Y]`.
3. Run `scripts/check-design-tokens.sh` and the UI tests.
4. Report which gaps are resolved and which are still open.

### Enforcement (don't disable or work around it)
- `scripts/check-design-tokens.sh` runs automatically after every file edit (Claude Code hook in `.claude/settings.json`) and in CI.
- If it reports violations, fix them with tokens/components, or log a gap and stop. Never weaken the script, the hook or the CI step, and never change `DS_SRC_DIR` to dodge a check.
- Before saying a UI task is done: run the checker over the whole frontend and compare the screen against the matching design in `design-system/screens/` (light and dark, phone and desktop).
