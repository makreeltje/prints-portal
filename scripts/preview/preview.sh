#!/usr/bin/env bash
# Preview instance of Prints Portal: runs any branch or pull request directly
# with Node (no Docker) on test data, as a systemd user service, so a feature
# can be tried before it is merged. See docs/DEPLOYMENT.md.
#
#   preview.sh install [ref]  first-time setup: env file, test data, build, service
#   preview.sh deploy <ref>   switch to a branch, PR (pr/25 or #25) or commit, rebuild, restart
#   preview.sh update         pull the newest commit of the current ref, rebuild, restart
#   preview.sh status         show which ref is running
#   preview.sh uninstall      stop and remove the service (keeps the data)
#
# ref defaults to main. A second instance runs next to the first with its own
# PREVIEW_NAME and PORT (see docs/DEPLOYMENT.md).
set -euo pipefail

PREVIEW_NAME="${PREVIEW_NAME:-prints-portal-preview}"
PREVIEW_HOME="${PREVIEW_HOME:-/home/$(id -un)/$PREVIEW_NAME}"
REPO_URL="${REPO_URL:-https://github.com/makreeltje/prints-portal.git}"
PORT="${PORT:-8080}"
APP_DIR="$PREVIEW_HOME/app"
DATA_DIR="$PREVIEW_HOME/data"
PRINTS_DIR="$PREVIEW_HOME/prints"
ENV_FILE="$PREVIEW_HOME/preview.env"
UNIT_DIR="${XDG_CONFIG_HOME:-/home/$(id -un)/.config}/systemd/user"
UNIT=$PREVIEW_NAME.service
REF_FILE="$PREVIEW_HOME/ref"

die() { echo "error: $*" >&2; exit 1; }

user_systemctl() {
  # Needs a user bus; without one (no login session, no linger) fail clearly.
  systemctl --user "$@" 2>/dev/null || die "cannot reach the systemd user bus; run 'loginctl enable-linger $(id -un)' as root, then log in again"
}

# Fetch the ref and check it out detached. A ref is a branch, a PR (pr/25 or
# #25) or a commit hash.
checkout() {
  local ref="$1" target
  if [ ! -d "$APP_DIR/.git" ]; then
    git clone --quiet "$REPO_URL" "$APP_DIR"
  fi
  case "$ref" in
    pr/[0-9]* | \#[0-9]*)
      git -C "$APP_DIR" fetch --quiet origin "+pull/${ref//[^0-9]/}/head"
      ;;
    *)
      git -C "$APP_DIR" fetch --quiet origin "$ref" || die "cannot fetch '$ref' from $REPO_URL"
      ;;
  esac
  target=$(git -C "$APP_DIR" rev-parse FETCH_HEAD)
  git -C "$APP_DIR" checkout --quiet --detach "$target"
  # A branch can carry other database migrations; the data is test data, so
  # start clean when the ref changes.
  if [ -f "$REF_FILE" ] && [ "$(cat "$REF_FILE")" != "$ref" ]; then
    rm -rf "$DATA_DIR" && mkdir -p "$DATA_DIR"
  fi
  echo "$ref" >"$REF_FILE"
  # Keep a copy outside the checkout: an older branch has no such script.
  [ "$(realpath "$0")" = "$PREVIEW_HOME/preview.sh" ] || cp "$0" "$PREVIEW_HOME/preview.sh"
  echo "$ref at $(git -C "$APP_DIR" rev-parse --short HEAD)"
}

build() {
  (cd "$APP_DIR" && npm ci --no-audit --no-fund && npm run build)
}

write_env() {
  [ -f "$ENV_FILE" ] && return 0
  umask 077
  cat >"$ENV_FILE" <<ENV
NODE_ENV=production
PORT=$PORT
HOST=0.0.0.0
DATA_DIR=$DATA_DIR
PRINTS_ROOT=$PRINTS_DIR
TZ=Europe/Amsterdam
SESSION_SECRET=$(openssl rand -base64 48 | tr -d '\n')
ADMIN_EMAIL=admin@preview.local
ADMIN_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=\n')
ENV
  chmod 600 "$ENV_FILE"
  echo "wrote $ENV_FILE (mode 600); the admin sign-in is in that file"
}

# Fictitious customers and projects, built from the gcode files in the repo's
# test fixtures. Never copy real prints here.
seed() {
  [ -d "$PRINTS_DIR" ] && return 0
  local fx="$APP_DIR/backend/test/fixtures/gcode" i=0
  local -a files=("$fx"/*.gcode)
  local entry customer project
  for entry in "Koen/Bloembak clips" "Koen/Plantenstandaard" "Esmee/Telefoonhouder" \
    "Veerle/Kabelgoot" "Anouk/Sleutelhanger" "Bas/Bloembak clips"; do
    customer="${entry%%/*}"
    project="${entry#*/}"
    mkdir -p "$PRINTS_DIR/$customer/$project"
    cp "${files[$((i % ${#files[@]}))]}" "$PRINTS_DIR/$customer/$project/$project.gcode"
    i=$((i + 1))
  done
}

# The unit is written from here, not read from the checkout, so it also works
# for branches that were cut before the preview existed.
install_unit() {
  mkdir -p "$UNIT_DIR"
  cat >"$UNIT_DIR/$UNIT" <<UNITFILE
[Unit]
Description=Prints Portal preview ($PREVIEW_NAME, test data)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$APP_DIR
EnvironmentFile=$ENV_FILE
ExecStart=/usr/bin/env node backend/dist/server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
UNITFILE
  user_systemctl daemon-reload
}

main() {
  case "${1:-}" in
    install)
      mkdir -p "$PREVIEW_HOME" "$DATA_DIR"
      checkout "${2:-main}"
      build
      write_env
      seed
      install_unit
      user_systemctl enable --now "$UNIT"
      ;;
    deploy)
      [ -n "${2:-}" ] || die "usage: $0 deploy <branch|pr/N|commit>"
      [ -d "$APP_DIR/.git" ] || die "not installed yet; run 'install' first"
      checkout "$2"
      build
      install_unit
      user_systemctl restart "$UNIT"
      ;;
    update)
      [ -d "$APP_DIR/.git" ] || die "not installed yet; run 'install' first"
      checkout "$(cat "$REF_FILE" 2>/dev/null || echo main)"
      build
      install_unit
      user_systemctl restart "$UNIT"
      ;;
    status)
      [ -d "$APP_DIR/.git" ] || die "not installed yet"
      echo "$(cat "$REF_FILE" 2>/dev/null || echo '?') at $(git -C "$APP_DIR" rev-parse --short HEAD) on port $PORT"
      ;;
    uninstall)
      user_systemctl disable --now "$UNIT" || true
      rm -f "$UNIT_DIR/$UNIT"
      user_systemctl daemon-reload || true
      echo "service removed; $PREVIEW_HOME is left in place, delete it to remove the data"
      ;;
    *)
      echo "usage: $0 install [ref] | deploy <ref> | update | status | uninstall" >&2
      exit 2
      ;;
  esac
}

# Everything is read before the checkout moves under this file.
main "$@"
exit
