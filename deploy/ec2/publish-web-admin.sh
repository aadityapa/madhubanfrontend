#!/usr/bin/env bash
set -euo pipefail
# Copy Vite build to nginx docroot. Run from repo root or via path to this script.
# Usage: sudo ./deploy/ec2/publish-web-admin.sh
# Default docroot: /var/www/madhuban360-admin

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEST="${1:-/var/www/madhuban360-admin}"
SRC="$ROOT/apps/web-admin/dist"

if [[ ! -f "$SRC/index.html" ]]; then
  echo "Missing $SRC/index.html — run: pnpm run build:web-admin" >&2
  exit 1
fi

mkdir -p "$DEST"
rsync -a --delete "$SRC/" "$DEST/"
echo "Published $(realpath "$SRC") -> $DEST"
echo "Next: install nginx site (see deploy/ec2/nginx-web-admin-external-api.conf), then: sudo nginx -t && sudo systemctl reload nginx"
