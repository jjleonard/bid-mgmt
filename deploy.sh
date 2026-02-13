#!/bin/sh
set -e

ENV_FILE="deploy/.env"

DO_PULL=true
DO_DOWN=true
DO_BOOTSTRAP=false

for arg in "$@"; do
  case "$arg" in
    --no-pull)
      DO_PULL=false
      ;;
    --no-down)
      DO_DOWN=false
      ;;
    --bootstrap)
      DO_BOOTSTRAP=true
      ;;
  esac
done

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE. Copy deploy/.env.example first." >&2
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

if [ "$DO_PULL" = true ]; then
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Updating repo..."
    git pull --ff-only
  else
    echo "Not a git repo. Skipping git pull." >&2
  fi
fi

echo "Building and starting containers..."
if [ "$DO_DOWN" = true ]; then
  docker compose down
fi
docker compose up -d --build

if [ "$DO_BOOTSTRAP" = true ]; then
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
