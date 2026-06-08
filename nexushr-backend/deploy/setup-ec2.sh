#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# NexusHR — one-time EC2 (Amazon Linux 2023 / Ubuntu 22.04) provisioning script.
# Run this ON THE EC2 INSTANCE after SSHing in. Idempotent-ish; safe to re-run.
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

echo "==> Detecting package manager…"
if command -v dnf >/dev/null 2>&1; then PKG=dnf; elif command -v yum >/dev/null 2>&1; then PKG=yum; else PKG=apt; fi
echo "    using: $PKG"

echo "==> Installing Node.js 20 + git…"
if [ "$PKG" = "apt" ]; then
  sudo apt-get update -y
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs git
else
  curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
  sudo $PKG install -y nodejs git
fi
node -v && npm -v

echo "==> Installing PM2 globally…"
sudo npm install -g pm2

echo "==> Cloning / updating the repo…"
APP_DIR="$HOME/ai_hr_management"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull
else
  # Replace with your repo URL (or scp the folder up instead)
  git clone "${REPO_URL:-https://github.com/your-user/ai_hr_management.git}" "$APP_DIR"
fi

cd "$APP_DIR/nexushr-backend"
echo "==> Installing backend deps (production)…"
npm ci --omit=dev || npm install --omit=dev
mkdir -p logs

if [ ! -f .env ]; then
  echo "!!  No .env found. Copy .env.production.example to .env and fill it in:"
  echo "      cp .env.production.example .env && nano .env"
  echo "    Then run:  node seed.js   (first deploy only)  and  pm2 start ecosystem.config.cjs"
  exit 1
fi

echo "==> Starting with PM2…"
pm2 start ecosystem.config.cjs --update-env
pm2 save
# Make PM2 resurrect on reboot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u "$USER" --hp "$HOME" | tail -1 | bash || true
pm2 save

echo "==> Done. API should be live on port 5000."
echo "    Health:  curl http://localhost:5000/api/v1/health"
echo "    Logs:    pm2 logs nexushr-api"
