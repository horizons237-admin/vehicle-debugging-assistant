# Automatisation du transfert de fichiers

## Script

```bash
bash scripts/transfer_artifacts.sh list
bash scripts/transfer_artifacts.sh library
bash scripts/transfer_artifacts.sh staging
VDA_REMOTE=user@host:/path bash scripts/transfer_artifacts.sh rsync
VDA_REMOTE=user@host:/path bash scripts/transfer_artifacts.sh scp
```

npm: `transfer`, `transfer:list`, `transfer:staging`

## Variables

| Variable | Rôle |
|----------|------|
| `VDA_LIBRARY` | Racine bibliothèque (défaut: parent du repo) |
| `VDA_REMOTE` | Destination rsync/scp |
| `VDA_TRANSFER_DRY_RUN=1` | Simulation |
| `VDA_INCLUDE_DOCS=1` | Inclure docs/*.md |

## CI

Workflow GitHub: `.github/workflows/transfer-artifacts.yml` (tag, release, dispatch).

Secrets optionnels: `VDA_SSH_KEY`, `VDA_REMOTE` pour rsync distant.
