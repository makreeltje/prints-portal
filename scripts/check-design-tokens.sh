#!/usr/bin/env bash
# Enforces that frontend code only uses the committed design system.
#
# Usage:
#   scripts/check-design-tokens.sh                 # scan the whole frontend (CI)
#   scripts/check-design-tokens.sh path/to/file    # scan specific files
#   scripts/check-design-tokens.sh --hook          # Claude Code PostToolUse hook (reads JSON on stdin)
#
# Configuration (environment variables):
#   DS_TOKENS_FILE  token source of truth      (default: design-system/tokens.css)
#   DS_COMPONENT_CSS component stylesheet whose variables also count as known
#                    (default: design-system/components/bundle.css)
#   DS_GAPS_FILE    gap log                     (default: design-system/DESIGN_GAPS.md)
#   DS_SRC_DIR      frontend source to scan     (default: frontend/src)
#
# Rules (a violation fails the check):
#   1. No raw colours: hex (#abc, #aabbcc, #aabbccdd), rgb()/rgba()/hsl()/hsla().
#   2. No raw lengths in stylesheets: px/rem/em values other than 0 and 1px
#      (hairline borders). Use spacing/radius/type tokens.
#   3. No unknown tokens: every var(--x) must be defined in the tokens file or the
#      design-system component stylesheet.
#   4. No new tokens: custom properties (--x: …) may only be defined in the tokens file.
#   5. No literal font-family, box-shadow or transition timing values; use tokens.
#   6. No inline style objects in JSX/TSX (style={{ … }}), except a single-line
#      object that only sets the per-instance colour variables the components
#      expect for user-chosen colours: --tag, --tag-ink, --c1, --c2 (GAP-002),
#      and the three measurements 2.2 added for floating panels: --pp-pop-max,
#      --pp-tip-x, --pp-tip-y (GAP-110, GAP-112). The app passes numbers it
#      measured in the browser, never lengths it chose.
#
# Escape hatch: a line may carry `ds-gap: GAP-123` (in a comment) if GAP-123 is an
# entry marked [open] in the gap log. That makes every exception visible and traceable.

set -uo pipefail

TOKENS_FILE="${DS_TOKENS_FILE:-design-system/tokens.css}"
GAPS_FILE="${DS_GAPS_FILE:-design-system/DESIGN_GAPS.md}"
SRC_DIR="${DS_SRC_DIR:-frontend/src}"
COMPONENT_CSS="${DS_COMPONENT_CSS:-design-system/components/bundle.css}"
# Variables components read for user-chosen (data-driven) colours; the only
# custom properties app code may set, and only through an inline style object.
INSTANCE_VARS=" --tag --tag-ink --c1 --c2 --pp-pop-max --pp-tip-x --pp-tip-y "

hook_mode=false
files=()

if [[ "${1:-}" == "--hook" ]]; then
  hook_mode=true
  input="$(cat)"
  if command -v jq >/dev/null 2>&1; then
    f="$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_response.filePath // empty')"
  else
    f="$(printf '%s' "$input" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)"
  fi
  [[ -z "$f" ]] && exit 0
  files=("$f")
elif [[ $# -gt 0 ]]; then
  files=("$@")
else
  if [[ ! -d "$SRC_DIR" ]]; then
    echo "check-design-tokens: source dir '$SRC_DIR' not found (set DS_SRC_DIR)" >&2
    exit 2
  fi
  while IFS= read -r -d '' p; do files+=("$p"); done < <(
    find "$SRC_DIR" -type f \
      \( -name '*.css' -o -name '*.scss' -o -name '*.less' -o -name '*.ts' -o -name '*.tsx' \
         -o -name '*.js' -o -name '*.jsx' -o -name '*.vue' -o -name '*.svelte' -o -name '*.html' \) \
      -not -path '*/node_modules/*' -not -name '*.test.*' -not -name '*.spec.*' -print0)
fi

if [[ ! -f "$TOKENS_FILE" ]]; then
  msg="Design system tokens file '$TOKENS_FILE' is missing. Import the design system first (see design-system/IMPORTING.md); do not invent tokens."
  if $hook_mode; then
    jq -n --arg r "$msg" '{decision:"block", reason:$r}' 2>/dev/null || echo "$msg" >&2
    exit 0
  fi
  echo "$msg" >&2
  exit 1
fi

# Known tokens and open gap IDs.
token_sources=("$TOKENS_FILE")
[[ -f "$COMPONENT_CSS" ]] && token_sources+=("$COMPONENT_CSS")
known_tokens="$( { grep -ohE -- '--[A-Za-z0-9_-]+[[:space:]]*:' "${token_sources[@]}" | sed -E 's/[[:space:]]*:$//'; for v in $INSTANCE_VARS; do echo "$v"; done; } | sort -u)"
open_gaps=""
# Only gaps whose heading is marked [open] may be referenced; resolved gaps must be fixed.
[[ -f "$GAPS_FILE" ]] && open_gaps="$(grep -E '^#+[[:space:]]*GAP-[0-9]+.*\[open\]' "$GAPS_FILE" | grep -oE 'GAP-[0-9]+' | sort -u)"

tokens_abs="$(cd "$(dirname "$TOKENS_FILE")" && pwd)/$(basename "$TOKENS_FILE")"
violations=()

add() { violations+=("$1:$2: $3"); }

for file in "${files[@]}"; do
  [[ -f "$file" ]] || continue
  case "$file" in
    *.css|*.scss|*.less|*.ts|*.tsx|*.js|*.jsx|*.vue|*.svelte|*.html) ;;
    *) continue ;;
  esac
  file_abs="$(cd "$(dirname "$file")" && pwd)/$(basename "$file")"
  # The design system folder itself is the source of truth; never scan it.
  [[ "$file_abs" == "$tokens_abs" ]] && continue
  [[ "$file_abs" == */design-system/* ]] && continue
  # Only enforce inside the frontend source tree.
  src_abs="$(cd "$SRC_DIR" 2>/dev/null && pwd)" || src_abs=""
  if [[ -n "$src_abs" && "$file_abs" != "$src_abs"/* ]]; then continue; fi
  case "$file" in *.test.*|*.spec.*) continue ;; esac

  is_style=false
  case "$file" in *.css|*.scss|*.less|*.vue|*.svelte) is_style=true ;; esac

  n=0
  while IFS= read -r line || [[ -n "$line" ]]; do
    n=$((n + 1))
    # Escape hatch tied to an open gap.
    if [[ "$line" =~ ds-gap:[[:space:]]*(GAP-[0-9]+) ]]; then
      gap="${BASH_REMATCH[1]}"
      if grep -qx "$gap" <<<"$open_gaps"; then continue; fi
      add "$file" "$n" "references $gap, which is not an [open] entry in $GAPS_FILE"
      continue
    fi

    # Ignore in-page anchors such as href="#main" or to="#add".
    scan="$(sed -E 's/(href|to|hash)=["'"'"'{]*#[A-Za-z0-9_-]*//g' <<<"$line")"

    # 1. Raw colours (report every occurrence).
    rest="$scan"
    while [[ "$rest" =~ (^|[^A-Za-z0-9_\&/-])#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})([^0-9A-Za-z_-]|$) ]]; do
      add "$file" "$n" "raw hex colour '#${BASH_REMATCH[2]}'; use a colour token"
      rest="${rest#*"#${BASH_REMATCH[2]}"}"
    done
    if [[ "$scan" =~ (rgba?|hsla?)\( ]]; then
      add "$file" "$n" "raw ${BASH_REMATCH[1]}() colour; use a colour token"
    fi

    # 4. Token definitions outside the tokens file.
    rest="$scan"
    while [[ "$rest" =~ (^|[[:space:]{;])(--[A-Za-z0-9_-]+)[[:space:]]*: ]]; do
      add "$file" "$n" "defines custom property '${BASH_REMATCH[2]}' outside $TOKENS_FILE; request it as a gap instead"
      rest="${rest#*"${BASH_REMATCH[2]}"}"
    done

    # 3. Unknown tokens.
    rest="$scan"
    while [[ "$rest" =~ var\([[:space:]]*(--[A-Za-z0-9_-]+) ]]; do
      tok="${BASH_REMATCH[1]}"
      if ! grep -qx -- "$tok" <<<"$known_tokens"; then
        add "$file" "$n" "unknown token '$tok' (not defined in $TOKENS_FILE or $COMPONENT_CSS)"
      fi
      rest="${rest#*"${BASH_REMATCH[0]}"}"
    done

    if $is_style; then
      # Check each declaration on the line separately.
      IFS=$'\n' read -r -d '' -a decls < <(tr ';{}' '\n\n\n' <<<"$scan" && printf '\0')
      for decl in ${decls[@]+"${decls[@]}"}; do
        [[ "$decl" =~ ^[[:space:]]*--[A-Za-z0-9_-]+[[:space:]]*: ]] && continue  # already reported (rule 4)
        # 2. Raw lengths (allow 0 and 1px hairlines; ignore url()).
        stripped="$(sed -E 's/url\([^)]*\)//g; s/(^|[^0-9.])1px/\1/g; s/(^|[^0-9.])0(px|rem|em)?([^0-9.]|$)/\1\3/g' <<<"$decl")"
        rest="$stripped"
        while [[ "$rest" =~ ([0-9]*\.?[0-9]+)(px|rem|em)([^A-Za-z]|$) ]]; do
          add "$file" "$n" "raw length '${BASH_REMATCH[1]}${BASH_REMATCH[2]}'; use a spacing/radius/type token"
          rest="${rest#*"${BASH_REMATCH[1]}${BASH_REMATCH[2]}"}"
        done
        # 5. Literal fonts, shadows, motion.
        if [[ "$decl" =~ font-family[[:space:]]*: ]] && [[ ! "$decl" =~ var\(-- ]] && [[ ! "$decl" =~ :[[:space:]]*inherit ]]; then
          add "$file" "$n" "literal font-family; use a type token"
        fi
        if [[ "$decl" =~ box-shadow[[:space:]]*: ]] && [[ ! "$decl" =~ var\(-- ]] && [[ ! "$decl" =~ :[[:space:]]*none ]]; then
          add "$file" "$n" "literal box-shadow; use an elevation token"
        fi
        if [[ "$decl" =~ (transition|animation)[^:]*: ]] && [[ "$decl" =~ [0-9]+m?s ]] && [[ ! "$decl" =~ var\(-- ]]; then
          add "$file" "$n" "literal motion timing; use a motion token"
        fi
      done
    fi

    # 6. Inline style objects in JSX/TSX.
    case "$file" in
      *.tsx|*.jsx)
        if [[ "$line" =~ style=\{\{ ]]; then
          if [[ "$line" =~ style=\{\{([^}]*)\}[^}]*\} ]]; then
            body="${BASH_REMATCH[1]}"
            bad=""
            keys=0
            rest="$body"
            # Every key must be a quoted instance variable, e.g. { '--tag': tag.color }.
            while [[ "$rest" =~ ([\"\'A-Za-z0-9_-]+)[[:space:]]*: ]]; do
              key="${BASH_REMATCH[1]}"; key="${key//\"/}"; key="${key//\'/}"
              keys=$((keys + 1))
              [[ "$INSTANCE_VARS" == *" $key "* ]] || bad+=" $key"
              rest="${rest#*"${BASH_REMATCH[0]}"}"
            done
            if [[ $keys -eq 0 || -n "$bad" ]]; then
              add "$file" "$n" "inline style object; only${INSTANCE_VARS}may be set inline (found:${bad:- none})"
            fi
          else
            add "$file" "$n" "inline style object must fit on one line and only set${INSTANCE_VARS}"
          fi
        fi ;;
    esac
  done < "$file"
done

if [[ ${#violations[@]} -eq 0 ]]; then
  exit 0
fi

report="Design-system violations (only the committed design system may be used):"
for v in "${violations[@]}"; do report+=$'\n'"  - $v"; done
report+=$'\n\n'"Fix by using existing tokens/components from design-system/. If what you need does not exist, do NOT invent it: add an entry to $GAPS_FILE, stop work on that piece of UI and ask the user (see CLAUDE.md, 'Design system')."

if $hook_mode; then
  if command -v jq >/dev/null 2>&1; then
    jq -n --arg r "$report" '{decision:"block", reason:$r}'
  else
    echo "$report" >&2
    exit 2
  fi
  exit 0
fi

echo "$report" >&2
exit 1
