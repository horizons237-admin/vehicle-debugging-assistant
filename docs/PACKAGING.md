# Packaging VSIX (P2)

## Contenu requis

- `out/**/*.js`
- `src/python/**/*.py` (ne pas exclure)
- `resources/**`, `media/**`
- `package.json`, `README.md`, `LICENSE`

## Build

```bash
npm ci && npm run compile && npm run package
```

## Vérification

```bash
unzip -l vehicle-debugging-assistant-*.vsix | grep -E 'python/|resources/'
```

Attendu : `extension/src/python/uds_client.py`, etc.

## Smoke test

Install from VSIX → Connect (simulation OK) → Read DTCs → Analyze sample log.
