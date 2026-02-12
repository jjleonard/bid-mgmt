#!/bin/sh
set -e

ENV_FILE="deploy/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE. Copy deploy/.env.example first." >&2
  exit 1
fi

echo "Building and starting containers..."
docker compose up -d --build

if [ "$1" = "--bootstrap" ]; then
  echo "Reminder: ensure deploy/.env is updated before bootstrapping admin." >&2
  printf "Proceed with admin bootstrap? (y/N): "
  read -r reply
  case "$reply" in
    y|Y)
      docker compose run --rm app node scripts/bootstrap-admin.js
      ;;
    *)
      echo "Bootstrap cancelled." >&2
      ;;
  esac
else
  echo "If this is a fresh deployment, run:" >&2
  echo "  docker compose run --rm app node scripts/bootstrap-admin.js" >&2
fi
