#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/.env}"
ENV_EXAMPLE="$SCRIPT_DIR/.env.example"
DOCKER_BIN="${DOCKER_BIN:-docker}"
GIT_BIN="${GIT_BIN:-git}"

usage() {
  cat <<'EOF'
Usage: sh docker/deploy.sh <command> [args]

Commands:
  start       Build images and start services
  update      Pull latest code, rebuild images, and restart services
  build       Build images
  restart     Restart running services
  stop        Stop running services
  down        Stop and remove containers
  status      Show service status
  logs        Follow service logs
  help        Show this help

Environment:
  ENV_FILE=/path/to/.env       Use a custom env file
  SKIP_GIT_PULL=1              Skip git pull during update
  TAIL=200                     Log tail line count
EOF
}

ensure_env() {
  if [ -f "$ENV_FILE" ]; then
    return
  fi

  if [ -f "$ENV_EXAMPLE" ]; then
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    echo "Created $ENV_FILE from $ENV_EXAMPLE."
    echo "Edit BACKEND_URL in $ENV_FILE, then run this command again."
    exit 1
  fi

  echo "Missing env file: $ENV_FILE" >&2
  exit 1
}

compose() {
  "$DOCKER_BIN" compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

pull_latest_code() {
  if [ "${SKIP_GIT_PULL:-0}" = "1" ]; then
    echo "Skipping git pull."
    return
  fi

  if [ -d "$ROOT_DIR/.git" ]; then
    (cd "$ROOT_DIR" && "$GIT_BIN" pull --ff-only)
  fi
}

COMMAND="${1:-help}"
if [ "$#" -gt 0 ]; then
  shift
fi

case "$COMMAND" in
  start)
    ensure_env
    compose up -d --build "$@"
    compose ps
    ;;
  update)
    ensure_env
    pull_latest_code
    compose build --pull "$@"
    compose up -d
    compose ps
    ;;
  build)
    ensure_env
    compose build "$@"
    ;;
  restart)
    ensure_env
    compose restart "$@"
    ;;
  stop)
    ensure_env
    compose stop "$@"
    ;;
  down)
    ensure_env
    compose down "$@"
    ;;
  status)
    ensure_env
    compose ps "$@"
    ;;
  logs)
    ensure_env
    compose logs -f --tail="${TAIL:-200}" "$@"
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    echo "Unknown command: $COMMAND" >&2
    usage >&2
    exit 2
    ;;
esac
