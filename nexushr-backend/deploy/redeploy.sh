#!/usr/bin/env bash
# Pull latest code + restart the API. Run ON THE EC2 box from nexushr-backend/.
set -euo pipefail
cd "$(dirname "$0")/.."
echo "==> Pulling latest…"; git pull
echo "==> Installing deps…"; npm ci --omit=dev || npm install --omit=dev
echo "==> Reloading PM2 (zero-downtime)…"; pm2 reload nexushr-api --update-env
pm2 save
echo "==> Done.  Health: curl http://localhost:5000/api/v1/health"
