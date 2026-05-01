#!/bin/bash
echo "Starting services..."
# Build services defined in docker-compose.dev.yml
docker compose down && docker compose -f docker-compose.dev.yml build
docker compose -f docker-compose.dev.yml up