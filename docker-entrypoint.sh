#!/bin/sh
set -e

mkdir -p /data
mkdir -p /app/public/branding

if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:/data/dev.db"
fi

npx prisma migrate deploy

exec "$@"
