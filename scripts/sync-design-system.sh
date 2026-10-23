#!/usr/bin/env bash
#
# Apply the design source to design-system/.
#
# The source is design-source/ in this repo, which only the designer edits.
# Keeping the apply here means the step is reviewable and repeatable instead
# of a pile of ad-hoc copies.
#
#   scripts/sync-design-system.sh design-source
#
# Everything in design-system/ is replaced except the three files the repo owns
# (IMPORTING.md says so): DESIGN_GAPS.md, FEEDBACK_PROMPT.md and IMPORTING.md.
# VERSION is taken from the source's own tokens.json, so it cannot drift.
#
# tokens.css is kept too, as a safety net: it is generated from tokens.json
# (node scripts/generate-tokens-css.mjs) and design-source/ ships it, so the
# copy overwrites it. Were it ever missing from the source, replacing the
# folder without keeping it would delete it and take the token checker down
# with it. The import verifies it still matches tokens.json.
#
# implementation.md is DROPPED, which is the opposite case: it is our own
# outbound half of the feedback round and lives at docs/design-feedback/. A
# copy inside the source would go stale the moment the next round rewrites the
# original, and would put a file we own inside a folder that is read-only.
set -euo pipefail

SRC="${1:-}"
if [[ -z "$SRC" ]]; then
  echo "usage: $0 <dir containing project/>" >&2
  exit 2
fi
[[ -d "$SRC/project" ]] && SRC="$SRC/project"
if [[ ! -f "$SRC/tokens.json" || ! -d "$SRC/components" ]]; then
  echo "not a design-system export: $SRC (expected tokens.json and components/)" >&2
  exit 2
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$ROOT/design-system"
KEEP=(DESIGN_GAPS.md FEEDBACK_PROMPT.md IMPORTING.md tokens.css)
# Ours, not theirs: never copied in (see the note above).
DROP=(implementation.md)

version="$(node -e "process.stdout.write(String(JSON.parse(require('fs').readFileSync('$SRC/tokens.json','utf8')).version))")"
if [[ -z "$version" || "$version" == "undefined" ]]; then
  echo "the export's tokens.json has no version" >&2
  exit 2
fi
before="$(cat "$DEST/VERSION" 2>/dev/null || echo "none")"

keep_args=()
for name in "${KEEP[@]}"; do keep_args+=(! -name "$name"); done
find "$DEST" -mindepth 1 -maxdepth 1 "${keep_args[@]}" -exec rm -rf {} +
cp -R "$SRC/." "$DEST/"
for name in "${DROP[@]}"; do rm -f "$DEST/$name"; done
printf '%s\n' "$version" > "$DEST/VERSION"

echo "design-system: $before -> $version"
echo
git -C "$ROOT" status --short -- design-system | sed 's/^/  /'
echo
echo "next: scripts/check-design-export.mjs"
