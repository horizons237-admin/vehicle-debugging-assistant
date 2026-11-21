# Feuille de route

**Baseline produit actuelle : 0.2.9** (analysis-only lab)

## Livré

### P0–P3 (fonctionnel)
- [x] **P0** Vehicle Health, VIN, triage, snapshot, OBD-II lab  
- [x] **P1** Status DIDs, remote diagnostics mock, SOVD discover, session timeline, multi-ECU, health diff  
- [x] **P2** Anomaly baseline, data governance, partner packs, fleet offline, DBC, CI watch  
- [x] **P3** OTA correlation (read-only), UN R155 checklist (aide), lab incident pack, EV status  

### Plateforme & docs (0.2.x → suite audit)
- [x] SDLC docs + issue templates (bug / feature / safety)  
- [x] CI GitHub + GitLab + exemples runners K8s  
- [x] Bus logs : ASC, BLF lite, MF4 probe/decode (deps optionnelles)  
- [x] BPMN Level-2 + UML Activity  
- [x] **J2534** registry discover + probe analysis-only (Windows)  
- [x] **Plan d’architecte** + **Runbooks Phase 1–4**  
- [x] Releases VSIX Windows / Linux (`v0.2.9-*`)  
- [x] TRACEABILITY REQ ↔ code ↔ test  
- [x] **Transports sim vs live** (DoIP / J2534 / CAN / stubs)  
- [x] Tests unitaires Node (contracts + triage + redaction + smoke IDs + i18n parity)  
- [x] i18n FR/EN : `src/utils/i18n.dicts.json` + test de parité  

## Sprint A — crédibilité (audit)

- [x] Aligner CHANGELOG / Roadmap / README  
- [x] Smoke Extension Host checklist documentée — exécution manuelle F5 encore à signer  
- [x] Self-diagnostic enrichi  
- [x] Message unique démo J2534 analysis-only  

## Planifié 0.3.0

- [ ] Smoke Extension Host automatisé (`@vscode/test-electron`) — plan docs/TEST_EH.md  
- [ ] Élargir l’usage de `t()` dans toutes les commandes UI  
- [ ] Source de vérité wiki unique (`wiki/` ↔ wiki.git / Pages)  
- [ ] (Option) UDS-via-J2534 analysis-only si besoin lab — hors flash  

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
- [Runbook 1](Runbook-Phase1) · [2](Runbook-Phase2) · [3](Runbook-Phase3) · [4](Runbook-Phase4)  
- [Transports sim vs live](Transports-Sim-vs-Live) · [Smoke](Smoke-Extension-Host) · [Traçabilité](Traceability)  
- [Safety](Safety) · [J2534](J2534)  
- Releases : https://github.com/horizons237-admin/vehicle-debugging-assistant/releases  
