# Sécurisation des clés SSH (transferts VDA)

## Principes

1. **Jamais** de clé privée dans le dépôt Git.
2. Préférer **Ed25519** (`ssh-keygen -t ed25519 -a 100`).
3. Clé **dédiée** au transfert VDA + passphrase en local.
4. Compte distant least privilege (`rrsync`, `from=`, no-pty).
5. **known_hosts** figé — pas de `StrictHostKeyChecking=no` en prod.

## Génération

```bash
ssh-keygen -t ed25519 -a 100 -f ~/.ssh/vda_transfer_ed25519 -C "vda-transfer"
chmod 600 ~/.ssh/vda_transfer_ed25519
```

Installer **uniquement** la clé publique sur le serveur (`authorized_keys`).

## Restriction serveur

```text
from="CI_SUBNET",no-agent-forwarding,no-port-forwarding,no-X11-forwarding,no-pty,command="rrsync -wo /data/vda" ssh-ed25519 AAAA…
```

## Client

```sshconfig
Host vda-drop
  HostName drop.example.com
  User vda-drop
  IdentityFile ~/.ssh/vda_transfer_ed25519
  IdentitiesOnly yes
  BatchMode yes
  StrictHostKeyChecking yes
  UserKnownHostsFile ~/.ssh/known_hosts_vda
```

```bash
ssh-keyscan -t ed25519 drop.example.com >> ~/.ssh/known_hosts_vda
export VDA_REMOTE=vda-drop:/data/vda
bash scripts/transfer_artifacts.sh rsync
```

## CI secrets

| Secret | Contenu |
|--------|--------|
| `VDA_SSH_PRIVATE_KEY` | Clé privée OpenSSH |
| `VDA_SSH_KNOWN_HOSTS` | `ssh-keyscan -t ed25519 host` |
| `VDA_REMOTE` | `user@host:/path` |

Helper: `scripts/ssh_secure_env.sh` (clé en `$RUNNER_TEMP`, chmod 600, cleanup).

## Rotation

Révoquer la pub à chaque départ / suspicion ; rotation périodique des secrets CI.

## Audit

```bash
rg -l 'BEGIN (OPENSSH|RSA|EC) PRIVATE KEY' --glob '!node_modules/**' || echo OK
```
