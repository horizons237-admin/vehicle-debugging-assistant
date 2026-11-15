# Automatisation du transfert de fichiers

## Script

```bash
bash scripts/transfer_artifacts.sh list
bash scripts/transfer_artifacts.sh library
bash scripts/transfer_artifacts.sh staging
VDA_REMOTE=user@host:/path bash scripts/transfer_artifacts.sh rsync
```

npm: `transfer`, `transfer:list`, `transfer:staging`

## Variables

| Variable | Rôle |
|----------|------|
| `VDA_LIBRARY` | Racine bibliothèque |
| `VDA_REMOTE` | Destination rsync/scp |
| `VDA_TRANSFER_DRY_RUN=1` | Simulation |
| `VDA_INCLUDE_DOCS=1` | Inclure docs/*.md |

## CI

Workflow: `.github/workflows/transfer-artifacts.yml`

## Sécurité SSH

Voir [SSH_SECURITY.md](./SSH_SECURITY.md).

| Secret GitHub | Contenu |
|---------------|--------|
| `VDA_SSH_PRIVATE_KEY` | Clé privée OpenSSH (ed25519) |
| `VDA_SSH_KNOWN_HOSTS` | `ssh-keyscan -t ed25519 host` |
| `VDA_REMOTE` | `user@host:/path` |

Helper: `scripts/ssh_secure_env.sh`
