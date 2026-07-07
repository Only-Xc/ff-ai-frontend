#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
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
  SKIP_GIT_PULL=1              Skip git pull during update
  TAIL=200                     Log tail line count
EOF
}

compose() {
  "$DOCKER_BIN" compose -f "$COMPOSE_FILE" "$@"
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
    compose up -d --build "$@"
    compose ps
    ;;
  update)
    pull_latest_code
    compose build "$@"
    compose up -d
    compose ps
    ;;
  build)
    compose build "$@"
    ;;
  restart)
    compose restart "$@"
    ;;
  stop)
    compose stop "$@"
    ;;
  down)
    compose down "$@"
    ;;
  status)
    compose ps "$@"
    ;;
  logs)
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
