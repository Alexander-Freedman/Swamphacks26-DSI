#!/usr/bin/env bash
# Pull the latest main, sync deps, restart the API. Run as root on the VM: sudo bash /opt/mm/deploy/vultr/update.sh
set -euo pipefail
APP_DIR=/opt/mm
sudo -u mm git -C "$APP_DIR" pull --ff-only
(cd "$APP_DIR/api" && sudo -u mm HOME=/home/mm /usr/local/bin/uv sync --locked --no-dev)
# Pick up unit file changes, if any.
install -m 644 "$APP_DIR/deploy/vultr/mm-api.service" /etc/systemd/system/mm-api.service
systemctl daemon-reload
systemctl restart mm-api
for _ in $(seq 1 20); do
  curl -fsS http://127.0.0.1:8000/api/health >/dev/null 2>&1 && break
  sleep 1
done
curl -fsS http://127.0.0.1:8000/api/health && echo
echo "update: now at $(sudo -u mm git -C "$APP_DIR" rev-parse --short HEAD)"
