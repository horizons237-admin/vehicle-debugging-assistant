# Wiki sync (`wiki/` → GitHub Wiki)

## Source of truth

| Location | Role |
|----------|------|
| **`wiki/` in main branch** | Canonical markdown (reviewed in PR) |
| GitHub Wiki | Optional published mirror for browsing |

## Dry-run

```bash
./scripts/sync_wiki.sh dry-run
```

## Push mirror

1. Enable Wiki on the GitHub repo (Settings → Features → Wikis).  
2. Create an initial page once in the UI (unlocks `*.wiki.git`).  
3. Run:

```bash
./scripts/sync_wiki.sh
```

Uses `rsync` + git. Token: HTTPS credentials or `gh auth`.

## CI (optional 0.3)

Nightly job: checkout → `sync_wiki.sh` with `GITHUB_TOKEN` (contents: write on wiki repo).

Until then, **`wiki/` on `main` is the source of truth**.
