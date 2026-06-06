#!/bin/bash
set -e

echo "==> Step 1: Fetching Prisma query engine binary..."
prisma py fetch 2>&1

echo "==> Step 2: Diagnosing where binary was downloaded..."
echo "HOME=$HOME"
echo "--- Searching /opt/render/.cache/ ---"
find /opt/render/.cache/ -name "*query*engine*" -type f 2>/dev/null || echo "(none found in /opt/render/.cache)"
echo "--- Searching ~/.cache/ ---"
find ~/.cache/ -name "*query*engine*" -type f 2>/dev/null || echo "(none found in ~/.cache)"
echo "--- Searching /opt/render/.cache/prisma-python/ all files ---"
find /opt/render/.cache/prisma-python/ -type f 2>/dev/null || echo "(prisma-python cache dir empty or missing)"
echo "--- Searching ~/.cache/prisma-python/ all files ---"
find ~/.cache/prisma-python/ -type f 2>/dev/null || echo "(~/.cache/prisma-python empty or missing)"

echo "==> Step 3: Copying engine binary to project dir..."
# Copy from /opt/render/.cache
find /opt/render/.cache/ -name "*query*engine*" -type f -exec cp {} /opt/render/project/src/be/ \; 2>/dev/null || true
# Copy from ~/.cache
find ~/.cache/ -name "*query*engine*" -type f -exec cp {} /opt/render/project/src/be/ \; 2>/dev/null || true
# Also try broader pattern
find /opt/render/ -maxdepth 6 -name "*query-engine*" -type f -not -path "*/node_modules/*" -exec cp {} /opt/render/project/src/be/ \; 2>/dev/null || true

# Make executable
chmod +x /opt/render/project/src/be/*engine* 2>/dev/null || true
chmod +x /opt/render/project/src/be/prisma-* 2>/dev/null || true

echo "==> Step 4: Project dir binary check:"
ls -la /opt/render/project/src/be/prisma-* 2>/dev/null || true
ls -la /opt/render/project/src/be/*engine* 2>/dev/null || echo "WARNING: Still no binary found!"

echo "==> Step 5: Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}
