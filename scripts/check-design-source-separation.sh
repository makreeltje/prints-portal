#!/usr/bin/env bash
# A pull request changes design-source/ or the rest of the repository, never both.
#
#   git diff --name-only origin/<base>...HEAD | scripts/check-design-source-separation.sh
#
# Reads the changed paths from stdin, one per line. Exits 1 and lists the files
# on both sides when the change touches design-source/ and anything else.
set -euo pipefail

inside=()
outside=()
while IFS= read -r path; do
  [ -z "$path" ] && continue
  case "$path" in
    design-source/*) inside+=("$path") ;;
    *) outside+=("$path") ;;
  esac
done

if [ "${#inside[@]}" -gt 0 ] && [ "${#outside[@]}" -gt 0 ]; then
  echo "This pull request changes design-source/ and other files. Split it in two."
  echo
  echo "Inside design-source/:"
  printf '  %s\n' "${inside[@]}"
  echo
  echo "Outside design-source/:"
  printf '  %s\n' "${outside[@]}"
  exit 1
fi
