# Vehicle Debugging Assistant

**Version 0.2.9** — lab analysis aid (UDS · OBD-II · bus logs · CI import).

Extension VS Code pour l'**analyse d'erreurs** dans le développement automobile (AUTOSAR, UDS, OBD-II, safety-critical / ISO 26262).

> **Safety:** analysis support only — not ASIL confirmation, not vehicle control, not VSOC.

## Fonctionnalités (aperçu)

| Domaine | Capacité |
|---------|----------|
| UDS / OBD-II | DTC, DID, session, PIDs, Mode 03/09 (lab) |
| Bus logs | ASC, BLF lite, MF4 probe/decode, CAN flow |
| AUTOSAR | ARXML DEM/DCM, DBC, ODX (lab) |
| Health | VIN, triage, timeline, anomaly baseline |
| ALM / AI | Jira, CodeBeamer, Confluence, LLM opt-in |
| CI/CD | Import rapport JSON VDA + folder watch |
| Process | BPMN Level-2 + UML Activity (wiki) |

**Vues latérales** (icône voiture) : DTCs · Errors Analysis · Session & Status · Self-diagnostic

## Prérequis

- VS Code ≥ 1.85
- Node.js 18+ (compile)
- Python 3.8+

### Dépendances Python optionnelles

| Package | Usage |
|---------|--------|
| `python-can` | CAN réel, BLF/MF4 readers |
| `udsoncan` + `can-isotp` | Stack UDS ISO-TP |
| `asammdf` | MF4 complet |

Sans ces libs / sans interface CAN → **mode simulation** automatique.

```bash
pip install python-can udsoncan can-isotp   # bus réel
pip install asammdf                          # MF4 enrichi
```

## Installation (développement)

```bash
git clone https://github.com/horizons237-admin/vehicle-debugging-assistant.git
cd vehicle-debugging-assistant
npm install
npm run compile
```

VS Code : ouvrir le dossier → **F5** (Extension Development Host).

VSIX : `npm run package` puis *Install from VSIX…*

## Catalogue des commandes (77)

Toutes préfixées `Vehicle Debug: …` dans la palette (`Ctrl+Shift+P`).

### Session ECU / UDS

| Commande | Titre |
|----------|-------|
| `vehicleDebug.connectEcu` | Connect to ECU |
| `vehicleDebug.disconnectEcu` | Disconnect ECU |
| `vehicleDebug.readDtcs` | Read DTCs |
| `vehicleDebug.clearDtcs` | Clear DTCs |
| `vehicleDebug.readDid` | Read Data Identifier (DID) |

### OBD-II

| Commande | Titre |
|----------|-------|
| `vehicleDebug.obdConnect` | OBD-II: Connect (lab) |
| `vehicleDebug.obdReadPids` | OBD-II: Read PIDs |
| `vehicleDebug.obdReadDtcs` | OBD-II: Read DTCs |
| `vehicleDebug.obdClearDtcs` | OBD-II: Clear DTCs |
| `vehicleDebug.obdReadiness` | OBD-II: Readiness |
| `vehicleDebug.obdMode09` | OBD-II: Mode 09 Info |

### Bus logs / CAN

| Commande | Titre |
|----------|-------|
| `vehicleDebug.analyzeLog` | Analyze Log File |
| `vehicleDebug.openSampleLog` | Open Sample Trace Log |
| `vehicleDebug.parseAsc` | Parse ASC Log |
| `vehicleDebug.analyzeAsc` | Analyze ASC Log |
| `vehicleDebug.decodeBlfMf4` | Decode BLF/MF4 |
| `vehicleDebug.analyzeCanFlow` | Analyze CAN Bus Flow |
| `vehicleDebug.analyzeBuslog` | Analyze Bus Log (unified) |

### Health / Status / VIN

| Commande | Titre |
|----------|-------|
| `vehicleDebug.setVin` | Set Vehicle VIN / ID |
| `vehicleDebug.readVinFromDid` | Read VIN (DID F190) |
| `vehicleDebug.refreshHealth` | Refresh Vehicle Health |
| `vehicleDebug.exportHealthSnapshot` | Export Health Snapshot |
| `vehicleDebug.openTriageRules` | Open / Create Triage Rules |
| `vehicleDebug.readVehicleStatus` | Read Vehicle Status |

### Remote / SOVD / Timeline

| Commande | Titre |
|----------|-------|
| `vehicleDebug.pullRemoteDiagnostics` | Pull Remote Diagnostics (mock/HTTP) |
| `vehicleDebug.sovdDiscover` | SOVD: Discover Resources |
| `vehicleDebug.showTimeline` | Show Session Timeline |

### ARXML / DBC / ODX / DoIP

| Commande | Titre |
|----------|-------|
| `vehicleDebug.analyzeArxml` | Analyze ARXML (DEM/DCM/DTC) |
| `vehicleDebug.doipDiscover` | DoIP: Vehicle Discovery |
| `vehicleDebug.loadDbc` | Load DBC Symbols |
| `vehicleDebug.annotateLogWithDbc` | Annotate Log with DBC |
| `vehicleDebug.parseOdx` | Parse ODX (lab) |

### AI / ALM / Export

| Commande | Titre |
|----------|-------|
| `vehicleDebug.configureConnections` | Configure Connections… |
| `vehicleDebug.testConnection` | Test Selected Connection |
| `vehicleDebug.setConnectionSecret` | Set Connection Token / Password |
| `vehicleDebug.aiAnalyzeSelection` | AI: Analyze Selection / Log |
| `vehicleDebug.aiAnalyzeAll` | AI: Analyze All Errors & DTCs |
| `vehicleDebug.aiAnalyzeError` | AI: Analyze This Error |
| `vehicleDebug.aiAnalyzeDtc` | AI: Analyze This DTC |
| `vehicleDebug.createTicketFromError` | Create Ticket from Error |
| `vehicleDebug.createTicketFromDtc` | Create Ticket from DTC |
| `vehicleDebug.exportConfluence` | Export Report to Confluence |

### CI/CD

| Commande | Titre |
|----------|-------|
| `vehicleDebug.importCicdReport` | Import CI/CD Analysis Report |
| `vehicleDebug.startCiWatch` | Start CI Report Folder Watch |
| `vehicleDebug.stopCiWatch` | Stop CI Report Folder Watch |

### Governance / Fleet / Partner

| Commande | Titre |
|----------|-------|
| `vehicleDebug.anomalyAssist` | Anomaly Assist (local baseline) |
| `vehicleDebug.openGovernance` | Data Governance Panel |
| `vehicleDebug.testGovernance` | Governance: Self-Test Scopes |
| `vehicleDebug.exportPartnerPack` | Export Partner Data Pack |
| `vehicleDebug.importFleetOffline` | Import Offline Fleet & Rank |

### OTA / Cyber / EV / Incident

| Commande | Titre |
|----------|-------|
| `vehicleDebug.otaCorrelation` | OTA Campaign Correlation |
| `vehicleDebug.openOtaCampaigns` | Open OTA Campaigns File |
| `vehicleDebug.cyberChecklist` | Cyber / UN R155 Checklist (aide) |
| `vehicleDebug.exportIncidentPack` | Export Lab Incident Pack |
| `vehicleDebug.readEvStatus` | Read EV / Charging Status |

### Self-diagnostic / Views

| Commande | Titre |
|----------|-------|
| `vehicleDebug.showReport` | Show Analysis Report |
| `vehicleDebug.refreshViews` | Refresh Views |
| `vehicleDebug.runSelfDiagnostic` | Run Self Diagnostic |
| `vehicleDebug.showSelfDiagnostic` | Show Self Diagnostic Panel |

### Other (standards lab / extras)

Commandes additionnelles enregistrées dans `package.json` (J2012, Mode09 helpers, D-PDU stub, multi-ECU) — voir palette **Vehicle Debug**.

## Configuration

`Ctrl+,` → **Vehicle Debug**

| Setting | Défaut | Description |
|---------|--------|-------------|
| `vehicleDebug.pythonPath` | `python3` | Interpréteur Python |
| `vehicleDebug.canInterface` | `socketcan` | socketcan / vector / pcan / virtual |
| `vehicleDebug.canChannel` | `can0` | Canal CAN |
| `vehicleDebug.txId` / `rxId` | `0x7E0` / `0x7E8` | IDs diagnostiques |
| `vehicleDebug.defaultSession` | `extended` | Session UDS |
| `vehicleDebug.enableSafetyClassification` | `true` | Scoring ASIL indicatif |

## Workflow typique

1. **Connect to ECU** (simulation si pas de hardware)
2. **Read DTCs** → codes + freeze frames
3. **Open Sample Trace Log** / **Parse ASC** / **Decode BLF/MF4** → **Analyze CAN Bus Flow**
4. **Show Analysis Report** · tickets ALM · export Confluence (opt-in)
5. **Self Diagnostic** pour l'état des backends

## Architecture

```text
VS Code Extension (TypeScript)
  commands / providers / session / audit / governance
        │ spawn + JSON
Python backends (src/python/)
  uds · obd · doip · arxml · dbc · odx
  asc · blf_* · mf4_* · buslog_* · can_flow
```

## Documentation

| Ressource | Lien |
|-----------|------|
| Wiki | https://github.com/horizons237-admin/vehicle-debugging-assistant/wiki |
| BPMN / UML | [docs/PROCESS_DIAGRAMS.md](docs/PROCESS_DIAGRAMS.md) |
| BLF / MDF4 | [docs/BLF.md](docs/BLF.md) · [docs/MDF4.md](docs/MDF4.md) |
| CI/CD | [docs/CICD.md](docs/CICD.md) |
| Changelog | [CHANGELOG.md](CHANGELOG.md) |

## Licence

MIT — voir [LICENSE](LICENSE).
