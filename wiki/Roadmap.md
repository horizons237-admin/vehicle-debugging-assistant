# Feuille de route

Basée sur l’audit et le plan de remédiation du projet.

## Statut P0 (stabilization)

| Item | Statut |
|------|--------|
| Alignement `package.json` | En cours / partiel |
| Timeout `PythonRunner` + limite stdout | **Fait** (v0.1.1) |
| Setting `pythonTimeoutMs` | **Fait** |
| Fichier LICENSE | **Fait** |
| `package-lock.json` | À finaliser |

## P1 — Qualité

- CI GitHub Actions (compile + smoke Python) — **Fait** (`.github/workflows/ci.yml`)
- Tests automatisés Python (log / ARXML / UDS / DoIP) — **Fait** (`tests/`, 5 tests)
- Opt-in explicite envoi données vers LLM remote — **Fait** (`llm.allowRemoteDataUpload`)
- ESLint de base — **Fait** (`.eslintrc.cjs`, `npm run lint`)

## P2 — Produit

- État de session *workspace-scoped* — **Fait** (`sessionStore` + workspaceState)
- Chemin UDS/DoIP réel documenté + checklist `vcan` — **Fait** (`docs/VCAN_CHECKLIST.md`)
- Packaging VSIX — **Fait** (`.vscodeignore` + `docs/PACKAGING.md`)
- Annulation / progress analyses — **Fait** (CancellationToken + progress log/ARXML)

## P3 — Maturité

- Qualification outil ISO 26262 (process hors code seul)
- CHANGELOG + SemVer strict
- Multi-ECU
- Support OBD modes dédiés
- i18n FR/EN

## Critères de sortie v0.2.0

- [ ] Manifeste unique sur `main`
- [ ] CI verte (workflow ajouté)
- [x] Timeout Python validé
- [x] LICENSE
- [x] Opt-in LLM remote
- [x] ≥ 3 tests Python automatisés (5)
- [x] Session workspace-scoped
- [x] Doc vcan / packaging
- [x] Cancel analyses
- [ ] VSIX installable testé en simulation (manuel)
