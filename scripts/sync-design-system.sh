#!/usr/bin/env bash
#
# Apply a design-system export to design-system/.
#
# The export now comes from the design system's own Artifact rather than a zip:
# Claude Code fetches the artifact's "project/" tree with the Artifact tool, then
# this script applies it. Keeping the apply here means the step is reviewable and
# repeatable instead of a pile of ad-hoc copies.
#
#   scripts/sync-design-system.sh <dir containing project/>
#
# Everything in design-system/ is replaced except the three files the repo owns
# (IMPORTING.md says so): DESIGN_GAPS.md, FEEDBACK_PROMPT.md and IMPORTING.md.
# VERSION is taken from the export's own tokens.json, so it cannot drift.
#
# tokens.css is kept too, for a different reason: the design system's page
# GENERATES it from tokens.json and never publishes it as a file, so it is not
# in an export at all. Replacing the folder without keeping it deleted it and
# took the token checker down with it. When tokens change, the new tokens.css
# has to come from the design system's page; this script only stops it being
# lost, and the import verifies it still matches tokens.json.
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
printf '%s\n' "$version" > "$DEST/VERSION"

echo "design-system: $before -> $version"
echo
git -C "$ROOT" status --short -- design-system | sed 's/^/  /'
echo
echo "next: scripts/check-design-export.mjs"
