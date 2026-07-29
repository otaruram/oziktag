#!/bin/bash
set -e

echo "==> Step 1: Generating Prisma client and fetching engines..."
MAX_RETRIES=3
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    prisma generate && break
    RETRY_COUNT=$((RETRY_COUNT+1))
    echo "==> prisma generate failed, retrying ($RETRY_COUNT/$MAX_RETRIES)..."
    sleep 5
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "==> prisma generate failed after $MAX_RETRIES attempts"
    exit 1
fi

echo "==> Step 2: Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}
