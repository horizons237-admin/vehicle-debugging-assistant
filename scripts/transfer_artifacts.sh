#!/bin/bash
# transfer_artifacts.sh — Automatise le transfert des livrables VDA
# Modes: library | staging | rsync | scp | list

set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODE="${1:-library}"
DRY="${VDA_TRANSFER_DRY_RUN:-0}"
LIBRARY="${VDA_LIBRARY:-$(dirname "$ROOT")}"
STAGING="${ROOT}/out/transfer"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
VERSION="0.1.1"
if command -v node >/dev/null 2>&1 && [ -f "$ROOT/package.json" ]; then
  VERSION="$(node -p "require('$ROOT/package.json').version" 2>/dev/null || echo "0.1.1")"
fi

log() { printf '[transfer] %s\n' "$*"; }

run() {
  if [ "$DRY" = "1" ]; then
    log "DRY-RUN: $*"
  else
    log "RUN: $*"
    sh -c "$*"
  fi
}

FILELIST="$(mktemp)"
trap 'rm -f "$FILELIST"' EXIT

add_if() {
  if [ -f "$1" ]; then
    echo "$1" >>"$FILELIST"
  fi
}

build_list() {
  : >"$FILELIST"
  for f in "$ROOT"/*.vsix; do
    [ -f "$f" ] && echo "$f" >>"$FILELIST"
  done
  add_if "$ROOT/Vehicle_Debugging_Assistant_Presentation.pptx"
  add_if "$ROOT/resources/sample_cicd_report.json"
  add_if "$ROOT/resources/schemas/vda-cicd-report.schema.json"
  add_if "$ROOT/CHANGELOG.md"
  add_if "$ROOT/README.md"
  if [ "${VDA_INCLUDE_DOCS:-0}" = "1" ]; then
    for f in "$ROOT"/docs/*.md; do
      [ -f "$f" ] && echo "$f" >>"$FILELIST"
    done
  fi
}

copy_to_dir() {
  dest="$1"
  mkdir -p "$dest"
  n=0
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    base="$(basename "$f")"
    if [ "$DRY" = "1" ]; then
      log "DRY-RUN: cp $f → $dest/$base"
    else
      cp -f "$f" "$dest/$base"
      log "copied $base"
    fi
    n=$((n + 1))
  done <"$FILELIST"

  man="$dest/TRANSFER_MANIFEST_${TS}.txt"
  {
    echo "project=vehicle-debugging-assistant"
    echo "version=$VERSION"
    echo "timestamp=$TS"
    echo "mode=$MODE"
    echo "files:"
    while IFS= read -r f; do
      [ -z "$f" ] && continue
      sum="n/a"
      command -v sha256sum >/dev/null 2>&1 && sum="$(sha256sum "$f" | awk '{print $1}')"
      echo "  - $(basename "$f")  sha256=$sum  size=$(wc -c <"$f" | tr -d ' ')"
    done <"$FILELIST"
  } >"$man"
  log "Manifest: $man ($n files)"
}

build_list

case "$MODE" in
  list)
    log "Eligible files (version=$VERSION):"
    while IFS= read -r f; do
      [ -z "$f" ] && continue
      printf '  %s (%s bytes)\n' "$f" "$(wc -c <"$f" | tr -d ' ')"
    done <"$FILELIST"
    ;;
  library)
    DEST="${LIBRARY%/}/vda-library/${VERSION}"
    log "Library target: $DEST"
    copy_to_dir "$DEST"
    LATEST="${LIBRARY%/}/vda-library/latest"
    mkdir -p "$LATEST"
    if [ "$DRY" != "1" ]; then
      while IFS= read -r f; do
        [ -z "$f" ] && continue
        cp -f "$f" "$LATEST/$(basename "$f")"
      done <"$FILELIST"
      echo "$VERSION $TS" >"$LATEST/VERSION.txt"
    fi
    log "Latest alias: $LATEST"
    ;;
  staging)
    DEST="$STAGING/$VERSION-$TS"
    copy_to_dir "$DEST"
    echo "$DEST" >"$STAGING/LAST_TRANSFER.txt"
    log "Staging path in out/transfer/LAST_TRANSFER.txt"
    ;;
  rsync)
    if [ -z "${VDA_REMOTE:-}" ]; then
      log "ERROR: set VDA_REMOTE=user@host:/path"
      exit 2
    fi
    DEST_LOCAL="$STAGING/bundle-$VERSION"
    mkdir -p "$DEST_LOCAL"
    copy_to_dir "$DEST_LOCAL"
    run "rsync -avz --progress '$DEST_LOCAL/' '${VDA_REMOTE%/}/vda/${VERSION}/'"
    ;;
  scp)
    if [ -z "${VDA_REMOTE:-}" ]; then
      log "ERROR: set VDA_REMOTE=user@host:/path"
      exit 2
    fi
    DEST_LOCAL="$STAGING/bundle-$VERSION"
    mkdir -p "$DEST_LOCAL"
    copy_to_dir "$DEST_LOCAL"
    TAR="$STAGING/vda-${VERSION}-${TS}.tar.gz"
    run "tar -czf '$TAR' -C '$DEST_LOCAL' ."
    run "scp '$TAR' '$VDA_REMOTE'"
    ;;
  *)
    echo "Usage: $0 {library|staging|rsync|scp|list}"
    exit 1
    ;;
esac

log "OK mode=$MODE version=$VERSION"
