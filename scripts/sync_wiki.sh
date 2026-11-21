#!/usr/bin/env bash
# Sync repo wiki/ → GitHub Wiki git repo (optional, 0.3)
# Usage:
#   GITHUB_TOKEN=… ./scripts/sync_wiki.sh
#   or: ./scripts/sync_wiki.sh dry-run
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/wiki"
OWNER="${GITHUB_OWNER:-horizons237-admin}"
REPO="${GITHUB_REPO:-vehicle-debugging-assistant}"
WIKI_URL="https://github.com/${OWNER}/${REPO}.wiki.git"
TMP="${TMPDIR:-/tmp}/vda-wiki-sync-$$"

if [[ "${1:-}" == "dry-run" ]]; then
  echo "Would sync $SRC → $WIKI_URL"
  ls -1 "$SRC"/*.md 2>/dev/null | head -40
  echo "Pages: $(ls -1 "$SRC"/*.md 2>/dev/null | wc -l)"
  exit 0
fi

if [[ ! -d "$SRC" ]]; then
  echo "Missing $SRC" >&2
  exit 1
fi

echo "Cloning wiki (may fail if wiki not yet initialized on GitHub)…"
git clone --depth 1 "$WIKI_URL" "$TMP" || {
  echo "Init wiki once via GitHub UI (create Home page), then re-run." >&2
  exit 2
}

rsync -a --delete --exclude='.git' "$SRC/" "$TMP/"
cd "$TMP"
git add -A
if git diff --cached --quiet; then
  echo "No wiki changes"
else
  git config user.email "${GIT_EMAIL:-vda-bot@users.noreply.github.com}"
  git config user.name "${GIT_NAME:-VDA Wiki Sync}"
  git commit -m "sync wiki from main $(date -u +%Y-%m-%d)"
  git push origin HEAD:master || git push origin HEAD:main
  echo "Wiki pushed"
fi
rm -rf "$TMP"
