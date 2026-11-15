#!/bin/bash
# Prépare un environnement SSH minimal pour transferts VDA (CI ou local).
# Ne log jamais le contenu de la clé.

set -eu

VDA_SSH_DIR="${VDA_SSH_DIR:-${RUNNER_TEMP:-/tmp}/vda-ssh-$$}"
mkdir -p "$VDA_SSH_DIR"
chmod 700 "$VDA_SSH_DIR"

cleanup_ssh() {
  if [ -d "$VDA_SSH_DIR" ]; then
    rm -rf "$VDA_SSH_DIR"
  fi
}

if [ -n "${VDA_SSH_PRIVATE_KEY:-}" ]; then
  IDENTITY="$VDA_SSH_DIR/id_ed25519"
  printf '%s\n' "$VDA_SSH_PRIVATE_KEY" | sed 's/\r$//' >"$IDENTITY"
  if grep -q '\\n' "$IDENTITY" 2>/dev/null; then
    tr -d '\n' <"$IDENTITY" | sed 's/\\n/\n/g' >"$IDENTITY.tmp"
    mv "$IDENTITY.tmp" "$IDENTITY"
  fi
  chmod 600 "$IDENTITY"
  printf '\n' >>"$IDENTITY"
elif [ -n "${VDA_SSH_IDENTITY_FILE:-}" ]; then
  IDENTITY="$VDA_SSH_IDENTITY_FILE"
  if [ ! -f "$IDENTITY" ]; then
    echo "[ssh-secure] identity file not found: $IDENTITY" >&2
    return 1 2>/dev/null || exit 1
  fi
else
  echo "[ssh-secure] Set VDA_SSH_PRIVATE_KEY or VDA_SSH_IDENTITY_FILE" >&2
  return 1 2>/dev/null || exit 1
fi

KNOWN="$VDA_SSH_DIR/known_hosts"
if [ -n "${VDA_SSH_KNOWN_HOSTS:-}" ]; then
  printf '%s\n' "$VDA_SSH_KNOWN_HOSTS" >"$KNOWN"
  chmod 644 "$KNOWN"
elif [ -f "${HOME}/.ssh/known_hosts_vda" ]; then
  cp "${HOME}/.ssh/known_hosts_vda" "$KNOWN"
else
  : >"$KNOWN"
fi

export VDA_SSH_DIR
export VDA_SSH_IDENTITY="$IDENTITY"
export GIT_SSH_COMMAND="ssh -i $IDENTITY -o IdentitiesOnly=yes -o BatchMode=yes -o PreferredAuthentications=publickey -o PasswordAuthentication=no -o StrictHostKeyChecking=yes -o UserKnownHostsFile=$KNOWN"
export RSYNC_RSH="$GIT_SSH_COMMAND"
export SCP_OPTS="-i $IDENTITY -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=$KNOWN"

echo "[ssh-secure] identity ready; RSYNC_RSH configured"
