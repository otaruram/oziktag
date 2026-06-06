#!/bin/bash
set -e

echo "==> Step 1: Generating Prisma client and fetching engines..."
prisma generate

echo "==> Step 2: Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}
