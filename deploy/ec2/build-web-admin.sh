#!/usr/bin/env bash
set -euo pipefail
# Build static web-admin on Linux (EC2). Run from repository root (the folder that contains package.json and pnpm-workspace.yaml).
# Install first: corepack enable && pnpm install --frozen-lockfile
# Ensure root `.env` sets VITE_API_BASE_URL to your API origin (e.g. https://nexyyra.com), or export it before this script.

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if command -v corepack >/dev/null 2>&1; then
  corepack enable
fi

pnpm install --frozen-lockfile
pnpm exec turbo run build --filter=@madhuban/web-admin

echo "Output: $ROOT/apps/web-admin/dist"
echo "Copy to nginx root, e.g.: sudo rsync -a --delete $ROOT/apps/web-admin/dist/ /var/www/madhuban360-admin/"
