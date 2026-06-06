#!/bin/bash
set -e

echo "==> Fetching Prisma query engine binary..."
prisma py fetch

echo "==> Copying binary to project directory..."
find /opt/render/.cache/prisma-python -name "prisma-query-engine-*" -type f -exec cp {} . \; 2>/dev/null || true
chmod +x prisma-query-engine-* 2>/dev/null || true

echo "==> Binary files in project dir:"
ls -la prisma-query-engine-* 2>/dev/null || echo "WARNING: No binary found!"

echo "==> Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}
