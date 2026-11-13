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

- CI GitHub Actions (compile + smoke Python)
- Tests automatisés Python (log / ARXML / UDS simulation)
- Opt-in explicite envoi données vers LLM remote
- ESLint / réduction des `any`

## P2 — Produit

- État de session *workspace-scoped*
- Chemin UDS/DoIP réel documenté + checklist `vcan`
- Packaging VSIX vérifié (présence `src/python`)
- Annulation / progress sur analyses longues

## P3 — Maturité

- Qualification outil ISO 26262 (process hors code seul)
- CHANGELOG + SemVer strict
- Multi-ECU
- Support OBD modes dédiés
- i18n FR/EN

## Critères de sortie v0.2.0

- [ ] Manifeste unique sur `main`
- [ ] CI verte
- [ ] Timeout Python validé
- [ ] LICENSE + lockfile
- [ ] Opt-in LLM remote
- [ ] ≥ 3 tests Python automatisés
- [ ] VSIX installable testé en simulation
