#!/usr/bin/env bash
# Preview instance of Prints Portal: runs `main` directly with Node (no Docker)
# on test data, as a systemd user service. See docs/DEPLOYMENT.md.
#
#   preview.sh install   first-time setup: env file, test data, build, service
#   preview.sh update    pull the newest main, rebuild, restart
#   preview.sh uninstall stop and remove the service (keeps the data)
set -euo pipefail

PREVIEW_HOME="${PREVIEW_HOME:-/home/$(id -un)/prints-portal-preview}"
REPO_URL="${REPO_URL:-https://github.com/makreeltje/prints-portal.git}"
PORT="${PORT:-8080}"
APP_DIR="$PREVIEW_HOME/app"
DATA_DIR="$PREVIEW_HOME/data"
PRINTS_DIR="$PREVIEW_HOME/prints"
ENV_FILE="$PREVIEW_HOME/preview.env"
UNIT_DIR="${XDG_CONFIG_HOME:-/home/$(id -un)/.config}/systemd/user"
UNIT=prints-portal-preview.service

die() { echo "error: $*" >&2; exit 1; }

user_systemctl() {
  # Needs a user bus; without one (no login session, no linger) fail clearly.
  systemctl --user "$@" 2>/dev/null || die "cannot reach the systemd user bus; run 'loginctl enable-linger $(id -un)' as root, then log in again"
}

checkout() {
  if [ ! -d "$APP_DIR/.git" ]; then
    git clone --quiet "$REPO_URL" "$APP_DIR"
  fi
  git -C "$APP_DIR" fetch --quiet origin main
  git -C "$APP_DIR" checkout --quiet --detach origin/main
  echo "main at $(git -C "$APP_DIR" rev-parse --short HEAD)"
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

install_unit() {
  mkdir -p "$UNIT_DIR"
  sed -e "s|@APP_DIR@|$APP_DIR|g" -e "s|@ENV_FILE@|$ENV_FILE|g" \
    "$APP_DIR/scripts/preview/prints-portal-preview.service" >"$UNIT_DIR/$UNIT"
  user_systemctl daemon-reload
}

case "${1:-}" in
  install)
    mkdir -p "$PREVIEW_HOME" "$DATA_DIR"
    checkout
    build
    write_env
    seed
    install_unit
    user_systemctl enable --now "$UNIT"
    ;;
  update)
    [ -d "$APP_DIR/.git" ] || die "not installed yet; run 'install' first"
    checkout
    build
    install_unit
    user_systemctl restart "$UNIT"
    ;;
  uninstall)
    user_systemctl disable --now "$UNIT" || true
    rm -f "$UNIT_DIR/$UNIT"
    user_systemctl daemon-reload || true
    echo "service removed; $PREVIEW_HOME is left in place, delete it to remove the data"
    ;;
  *)
    echo "usage: $0 install|update|uninstall" >&2
    exit 2
    ;;
esac
