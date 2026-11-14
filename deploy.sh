#!/usr/bin/env bash
#
# deploy.sh — point d'entrée des opérations Profilio (contenu Ghost + site).
#
# Usage : ./deploy.sh {local|home} {diff|pull|update}
#
#   diff    Écart entre src/data.ts et le contenu vivant dans Ghost (code 1 s'il y en a)
#   pull    Sauvegarde le contenu Ghost vivant dans snapshots/ghost/posts/
#   update  Pousse src/data.ts vers Ghost, puis (re)construit le site
#             local → rebuild + redémarrage du conteneur nginx `web` (docker compose)
#             home  → build de dist/ (+ rsync si DEPLOY_RSYNC_TARGET est défini)
#
# L'environnement choisit le fichier dotenv chargé :
#   local → .env        (stack docker-compose sur le poste)
#   home  → .env.home   (serveur ; voir .env.home.example)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<USAGE
Usage: $0 {local|home} {diff|pull|update}

Exemples :
  $0 local diff
  $0 local update
  $0 home  pull
  $0 home  update
USAGE
}

if [[ $# -lt 2 ]]; then usage; exit 2; fi

ENV="$1"
ACTION="$2"

case "$ENV" in
  local|home) ;;
  *) echo "!! Environnement inconnu : $ENV" >&2; usage; exit 2 ;;
esac
case "$ACTION" in
  diff|pull|update) ;;
  *) echo "!! Action inconnue : $ACTION" >&2; usage; exit 2 ;;
esac

ENV_FILE="$SCRIPT_DIR/.env"
[[ "$ENV" == "home" ]] && ENV_FILE="$SCRIPT_DIR/.env.home"

if [[ -f "$ENV_FILE" ]]; then
  # Un .env n'est pas un script shell : on le lit ligne à ligne (pas de `source`),
  # pour ne pas évaluer les métacaractères ni couper les valeurs à espaces.
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" == *=* ]] || continue
    key="${line%%=*}"
    value="${line#*=}"
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"
    if [[ ${#value} -ge 2 && ( "$value" == \"*\" || "$value" == \'*\' ) ]]; then
      value="${value:1:${#value}-2}"
    fi
    export "$key=$value"
  done < "$ENV_FILE"
elif [[ "$ENV" == "home" ]]; then
  echo "!! $ENV_FILE introuvable — copier .env.home.example et renseigner les valeurs" >&2
  exit 2
fi

log() { echo "==> $*"; }
require_admin() {
  : "${GHOST_ADMIN_URL:?GHOST_ADMIN_URL doit être défini dans $(basename "$ENV_FILE")}"
  : "${GHOST_ADMIN_API_KEY:?GHOST_ADMIN_API_KEY doit être défini dans $(basename "$ENV_FILE")}"
}

do_diff() { require_admin; node "$SCRIPT_DIR/scripts/ghost/diff.mjs"; }
do_pull() { require_admin; node "$SCRIPT_DIR/scripts/ghost/pull.mjs"; }

do_update() {
  require_admin
  if ! git -C "$SCRIPT_DIR" diff --quiet 2>/dev/null; then
    echo "!! Attention : des modifications non committées SERONT déployées." >&2
  fi

  log "update : envoi de src/data.ts vers Ghost ($GHOST_ADMIN_URL)"
  node "$SCRIPT_DIR/scripts/ghost/seed.mjs"

  if [[ "$ENV" == "local" ]]; then
    log "update : rebuild + redémarrage du conteneur web"
    ( cd "$SCRIPT_DIR" && docker compose --profile web up -d --build web )
    log "Site disponible sur http://localhost:${WEB_PORT:-8080}"
  else
    log "update : build de dist/"
    ( cd "$SCRIPT_DIR" && npm ci --silent && npm run --silent build )
    if [[ -n "${DEPLOY_RSYNC_TARGET:-}" ]]; then
      log "update : rsync dist/ → $DEPLOY_RSYNC_TARGET"
      rsync -az --delete "$SCRIPT_DIR/dist/" "$DEPLOY_RSYNC_TARGET"
    else
      log "DEPLOY_RSYNC_TARGET non défini : dist/ est construit, à publier à la main."
    fi
  fi
  log "update terminé"
}

case "$ACTION" in
  diff)   do_diff   ;;
  pull)   do_pull   ;;
  update) do_update ;;
esac
