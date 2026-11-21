# Feuille de route

**Baseline produit actuelle : 0.2.9** (analysis-only lab)

## Livré

### P0–P3 (fonctionnel)
- [x] **P0** Vehicle Health, VIN, triage, snapshot, OBD-II lab  
- [x] **P1** Status DIDs, remote diagnostics mock, SOVD discover, session timeline, multi-ECU, health diff  
- [x] **P2** Anomaly baseline, data governance, partner packs, fleet offline, DBC, CI watch  
- [x] **P3** OTA correlation (read-only), UN R155 checklist (aide), lab incident pack, EV status  

### Plateforme & docs
- [x] SDLC, CI, bus logs, BPMN, J2534 analysis-only, Runbooks 1–4, TRACEABILITY  
- [x] Transports sim vs live · tests Node · i18n dicts + parité  
- [x] `t()` sur Self-diag / Connect (sim) / J2534 nextSteps  
- [x] **Source de vérité wiki** = `wiki/` sur main · `scripts/sync_wiki.sh` optionnel  

## Sprint A — crédibilité

- [x] CHANGELOG / Roadmap / README · smoke checklist · self-diag · message J2534 AO  

## Planifié 0.3.0

- [ ] Smoke Extension Host automatisé (`@vscode/test-electron`) — docs/TEST_EH.md  
- [ ] Continuer `t()` sur le reste des notifications UI  
- [ ] (Option) UDS-via-J2534 analysis-only — hors flash  

## Hors scope volontaire

| Hors scope | Raison |
|------------|--------|
| VSOC / eCall réel / flash / WriteMsgs / contrôle véhicule | Safety analysis-only |
| Qualification ISO 26262 outil complète | Aide analyse, pas confirmation ASIL |

## Références

- [Plan d’architecte](Plan-Architecte) · Runbooks 1–4 · [Transports](Transports-Sim-vs-Live) · [Smoke](Smoke-Extension-Host)  
- Releases : https://github.com/horizons237-admin/vehicle-debugging-assistant/releases  
