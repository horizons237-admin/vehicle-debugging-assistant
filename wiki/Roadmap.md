# Feuille de route

**Baseline produit actuelle : 0.2.9** (analysis-only lab)

## Livré

### P0–P3 (fonctionnel)
- [x] **P0** Vehicle Health, VIN, triage, snapshot, OBD-II lab  
- [x] **P1** Status DIDs, remote diagnostics mock, SOVD discover, session timeline, multi-ECU, health diff  
- [x] **P2** Anomaly baseline, data governance, partner packs, fleet offline, DBC, CI watch  
- [x] **P3** OTA correlation (read-only), UN R155 checklist (aide), lab incident pack, EV status  

### Plateforme & docs (0.2.x)
- [x] SDLC docs + issue templates (bug / feature / safety)  
- [x] CI GitHub + GitLab + exemples runners K8s  
- [x] Bus logs : ASC, BLF lite, MF4 probe/decode (deps optionnelles)  
- [x] BPMN Level-2 + UML Activity  
- [x] **J2534** registry discover + probe analysis-only (Windows)  
- [x] **Plan d’architecte** + **Runbook Phase 3** + **Runbook Phase 4**  
- [x] Releases VSIX Windows / Linux (`v0.2.9-*`)  

## En cours / prochain (Sprint A — crédibilité)

Priorité audit 2026-11-18 :

- [x] Aligner CHANGELOG / Roadmap / README  
- [x] Smoke Extension Host checklist documentée ([Smoke-Extension-Host](Smoke-Extension-Host) / docs/SMOKE_EXTENSION_HOST.md) — exécution manuelle F5 encore à signer  
- [x] Self-diagnostic enrichi : platform, python32, buslog scripts, check_deps, safety posture (recompile / F5 pour valider)  
- [x] Message unique démo : J2534 = Open/ReadVersion/Close only (README + Safety self-diag hint)  

## Planifié 0.3.0

- [ ] Tests unitaires TypeScript + smoke Extension Host automatisé  
- [ ] Matrice TRACEABILITY REQ → commande → test élargie  
- [ ] Runbooks Phase 1 (Fondations) et Phase 2 (Exploration)  
- [ ] DoIP / transport : documenter clairement sim vs live  
- [ ] i18n FR / EN cohérent  
- [ ] Marquer ou retirer les stubs restants dans Commands + Self-diag  
- [ ] Source de vérité wiki unique (`wiki/` ↔ wiki.git / Pages)  

## Hors scope volontaire

| Hors scope | Raison |
|------------|--------|
| VSOC production | Pas un centre cyber ops |
| eCall réel | Incident pack = lab uniquement |
| Flash / WriteMsgs / Security Access | Analysis-only |
| Commandes remote de contrôle véhicule | Safety |
| Qualification outil ISO 26262 complète | Aide à l’analyse, pas confirmation ASIL |

## Références

- [Plan d’architecte](Plan-Architecte)  
- [Runbook Phase 3](Runbook-Phase3) · [Runbook Phase 4](Runbook-Phase4)  
- [Smoke Extension Host](Smoke-Extension-Host)  
- [Safety](Safety) · [J2534](J2534)  
- Releases : https://github.com/horizons237-admin/vehicle-debugging-assistant/releases  
