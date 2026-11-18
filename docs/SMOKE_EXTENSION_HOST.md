# Smoke Extension Host — Sprint A.2

**Objectif :** valider en ≤15 min que les 10 commandes critiques répondent après **F5**, sans hardware.

**Prérequis :** `npm install` · `npm run compile` · Extension Development Host (**F5**) · Python 3.8+

**Posture :** simulation / log only · analysis-only

---

## Checklist (cocher)

```
[ ] 0  F5 — Extension Development Host démarre sans erreur console critique
[ ] 1  Vehicle Debug: Run Self Diagnostic
        → Overall ok|warn|info ; backends present ; Safety analysis-only visible
[ ] 2  Vehicle Debug: Connect to ECU (simulation)
        → Session connected / simulation
[ ] 3  Vehicle Debug: Read DTCs
        → Liste (même vide) sans crash
[ ] 4  Vehicle Debug: Read Vehicle Status  (ou Read DID)
        → Status / DID sans crash
[ ] 5  Vehicle Debug: Refresh Vehicle Health
        → Vue Health se met à jour
[ ] 6  Vehicle Debug: Show Session Timeline
        → Webview / vue timeline s’ouvre
[ ] 7  Vehicle Debug: Parse ASC Log  (resources/sample.asc si dispo)
        → Parse OK ou message d’erreur contrôlé
[ ] 8  Vehicle Debug: Export Health Snapshot
        → Fichier MD/JSON produit
[ ] 9  Vehicle Debug: J2534 Discover Drivers (registry)
        → Windows: drivers ou liste vide · Linux/macOS: unsupported_os / skip
[ ]10  Vehicle Debug: Data Governance Panel  (ou Self-Test Scopes)
        → Panneau / audit sans crash
```

**Résultat attendu :** 10/10 sans exception non gérée.  
Tout `error` Self-diag sur script **missing** = bloquant packaging.

---

## Commandes IDs (référence)

| # | Command ID |
|---|------------|
| 1 | `vehicleDebug.runSelfDiagnostic` |
| 2 | `vehicleDebug.connectEcu` |
| 3 | `vehicleDebug.readDtcs` |
| 4 | `vehicleDebug.readVehicleStatus` / `vehicleDebug.readDid` |
| 5 | `vehicleDebug.refreshHealth` |
| 6 | `vehicleDebug.showTimeline` |
| 7 | `vehicleDebug.parseAsc` |
| 8 | `vehicleDebug.exportHealthSnapshot` |
| 9 | `vehicleDebug.j2534Discover` |
| 10 | `vehicleDebug.openGovernance` / `vehicleDebug.testGovernance` |

---

## Critères pass / fail

| Pass | Fail |
|------|------|
| Commande s’exécute, UI réagit | Exception non catchée dans Debug Console |
| Message d’erreur métier clair | Hang > 30 s sans timeout |
| Self-diag scripts `present` | Script backend `missing` |

---

## Après le smoke

1. Noter OS, VS Code version, Python path  
2. Exporter Self Diagnostic Report si warn/error  
3. Cocher Sprint A.2 dans [Roadmap](../wiki/Roadmap.md)  

## Hors smoke (volontaire)

Hardware CAN, J2534 probe DLL réelle, Confluence/Jira live, LLM remote.
