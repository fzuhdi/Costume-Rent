#!/bin/bash
set -euo pipefail

COMPOSE_FILE="docker-compose.dev2.yml"

echo "Starting development services..."

if [[ "${1:-}" == "--reset" ]]; then
  echo "Resetting containers and Docker volumes..."
  docker compose -f "$COMPOSE_FILE" down -v
else
  echo "Keeping existing Docker volumes. Use './run-dev2.sh --reset' to wipe them."
fi

docker compose -f "$COMPOSE_FILE" up -d --build
docker compose -f "$COMPOSE_FILE" ps
