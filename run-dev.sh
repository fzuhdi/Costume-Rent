#!/bin/bash
set -e

echo "Starting Docker Desktop..."
cmd /c "start \"\" \"C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe\""
# Alternatively, try starting from Start Menu
# cmd /c "start shell:AppsFolder\\Docker.DockerDesktopDockerDesktop"

echo "Waiting for Docker to be ready..."
for i in {1..30}; do
    if docker info > /dev/null 2>&1; then
        echo ""
        echo "Docker is ready!"
        break
    fi
    echo -n "."
    sleep 2
done

if ! docker info > /dev/null 2>&1; then
    echo ""
    echo "Docker did not start in time. Please start Docker Desktop manually."
    echo "Then run this script again or run: docker compose -f docker-compose.dev.yml up"
    exit 1
fi

echo "Starting services..."
docker compose -f docker-compose.dev.yml up