#!/usr/bin/env bash
# One-time setup of the mm API on a fresh Ubuntu 24.04 VM. Run as root:
#   curl -fsSL https://raw.githubusercontent.com/Alexander-Freedman/Swamphacks26-DSI/main/deploy/vultr/setup.sh -o setup.sh
#   sudo bash setup.sh                 # host defaults to <public-ip-with-dashes>.sslip.io
#   sudo MM_HOST=api.example.tech bash setup.sh
# Safe to re-run. Never writes secrets: /etc/mm/env is created with empty values.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Alexander-Freedman/Swamphacks26-DSI.git}"
BRANCH="${BRANCH:-main}"
APP_DIR=/opt/mm
ENV_FILE=/etc/mm/env

if [ "$(id -u)" -ne 0 ]; then
  echo "setup: run as root (sudo bash setup.sh)" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -y -q git curl ca-certificates debian-keyring debian-archive-keyring apt-transport-https gnupg ufw

# Caddy from its official apt repo (https://caddyserver.com/docs/install#debian-ubuntu-raspbian)
if ! command -v caddy >/dev/null; then
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key \
    | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt \
    > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -q
  apt-get install -y -q caddy
fi

# uv, system-wide in /usr/local/bin (https://docs.astral.sh/uv/getting-started/installation/)
if ! [ -x /usr/local/bin/uv ]; then
  curl -LsSf https://astral.sh/uv/install.sh | env UV_INSTALL_DIR=/usr/local/bin UV_NO_MODIFY_PATH=1 sh
fi

id mm >/dev/null 2>&1 || useradd --system --create-home --home-dir /home/mm --shell /usr/sbin/nologin mm

if [ -d "$APP_DIR/.git" ]; then
  sudo -u mm git -C "$APP_DIR" pull --ff-only
else
  install -d -o mm -g mm "$APP_DIR"
  sudo -u mm git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi
(cd "$APP_DIR/api" && sudo -u mm HOME=/home/mm /usr/local/bin/uv sync --locked --no-dev)

install -d -m 755 /etc/mm
if [ ! -f "$ENV_FILE" ]; then
  install -m 600 -o mm -g mm "$APP_DIR/deploy/vultr/env.example" "$ENV_FILE"
  echo "setup: created $ENV_FILE with empty values; fill in GEMINI_API_KEY there"
fi
chown mm:mm "$ENV_FILE"
chmod 600 "$ENV_FILE"

install -m 644 "$APP_DIR/deploy/vultr/mm-api.service" /etc/systemd/system/mm-api.service
systemctl daemon-reload
systemctl enable --now mm-api
systemctl restart mm-api

if [ -z "${MM_HOST:-}" ]; then
  ip="$(curl -fsS4 https://api.ipify.org)"
  MM_HOST="${ip//./-}.sslip.io"
fi
sed "s/__HOST__/${MM_HOST}/" "$APP_DIR/deploy/vultr/Caddyfile" > /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
systemctl reload caddy || systemctl restart caddy

ufw allow OpenSSH >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null

for _ in $(seq 1 20); do
  curl -fsS http://127.0.0.1:8000/api/health >/dev/null 2>&1 && break
  sleep 1
done
curl -fsS http://127.0.0.1:8000/api/health && echo
echo "setup: done. Public URL: https://${MM_HOST}/api/health (the first HTTPS request can take ~30 s while Caddy gets the certificate)"
