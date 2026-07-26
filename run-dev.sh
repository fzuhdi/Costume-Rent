#!/bin/bash
set -euo pipefail

COMPOSE_FILE="docker-compose.dev.yml"
CLEAR_CACHE=false
RESET=false
DETACHED=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --reset)
      RESET=true
      shift
      ;;
    --clear-cache)
      CLEAR_CACHE=true
      shift
      ;;
    -d|--detach)
      DETACHED=true
      shift
      ;;
  esac
done

echo "🚀 Starting development services..."

if [ "$RESET" = true ]; then
  echo "🧹 Resetting containers and Docker volumes..."
  docker compose -f "$COMPOSE_FILE" down -v
else
  echo "💡 Tip: Use './run-dev.sh --reset' to wipe the database and volumes."
fi

if [ "$CLEAR_CACHE" = true ]; then
  echo "🗑️ Clearing Next.js cache (.next)..."
  rm -rf web/.next
else
  echo "💡 Tip: Use './run-dev.sh --clear-cache' if the frontend UI is stuck on an old cached version."
fi

echo "📦 Building and starting containers..."

if [ "$DETACHED" = true ]; then
  docker compose -f "$COMPOSE_FILE" up -d --build
  docker compose -f "$COMPOSE_FILE" ps
  echo "✅ Services are running in the background."
  echo "👀 Run 'docker compose -f $COMPOSE_FILE logs -f' to view logs."
else
  # Use --watch if available (Docker Compose v2.22+) to automatically sync package.json changes
  # and run in the foreground so you can see Next.js/Go logs live.
  echo "✅ Services starting. Press Ctrl+C to stop."
  docker compose -f "$COMPOSE_FILE" up --build --watch
fi
