# Guide utilisateur

## Démarrage rapide

1. Ouvrir le dossier extension → `npm install` → `npm run compile` → **F5**  
2. Activity Bar → icône **Vehicle Debug**  
3. **Connect to ECU** (simulation)  
4. **Read DTCs** puis **Read Vehicle Status**  
5. Consulter **Vehicle Health**  

## Workflows recommandés


### Phase 3 — Déchiffrage (runbook)
Séquence lab Trace → preuves MOS : [Runbook Phase 3](Runbook-Phase3)  
Checklist 1 page + commandes (Health, Triage, Timeline, Anomaly, Export).

### Analyse lab
Connect → Read DTCs / Status → Analyze Log → Health → Export Health Snapshot  

### CI/CD
Télécharger artefact `vda-cicd-report.json` → **Import CI/CD Analysis Report** → Health  

### Flotte offline
**Import Offline Fleet & Rank** avec `resources/sample_fleet.json`  

### Gouvernance
**Data Governance Panel** avant tout export ALM / partner pack  

### OTA / cyber
**OTA Campaign Correlation** · **Cyber / UN R155 Checklist (aide)**  

## Mode simulation

Sans hardware CAN : transport simulation, DIDs et DTC d’exemple, DoIP mock.
