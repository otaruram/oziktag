#!/bin/bash
set -e

echo "=== Memperbarui & Menjalankan Oziktag Backend di Docker ==="

# 1. Hentikan & hapus container lama jika ada (mencegah error ContainerConfig)
docker rm -f oziktag-backend 2>/dev/null || true

# 2. Build image backend
echo "Building backend image..."
docker build -t oziktag-backend ./be

# 3. Jalankan container baru
echo "Menjalankan container oziktag-backend di port 8000..."
docker run -d \
  --name oziktag-backend \
  --restart always \
  -p 8000:8000 \
  --env-file ./be/.env \
  -e PORT=8000 \
  oziktag-backend

echo "=== Backend Berhasil Dijalankan! ==="
docker ps --filter "name=oziktag-backend"
