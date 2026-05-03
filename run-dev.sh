#!/bin/bash
echo "Starting services..."
# Build services defined in docker-compose.dev.yml
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml build
docker compose -f docker-compose.dev.yml up -d