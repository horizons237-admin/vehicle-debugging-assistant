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

- VS Code ≥ 1.85 · Node.js 18+ · Python 3.8+

### Dépendances Python optionnelles

| Package | Usage |
|---------|--------|
| `python-can` | CAN réel, BLF/MF4 readers |
| `udsoncan` + `can-isotp` | Stack UDS ISO-TP |
| `asammdf` | MF4 complet |

Sans ces libs → **mode simulation** automatique.

```bash
pip install python-can udsoncan can-isotp
pip install asammdf
```

## Installation (développement)

```bash
git clone https://github.com/horizons237-admin/vehicle-debugging-assistant.git
cd vehicle-debugging-assistant
npm install && npm run compile
```

VS Code : **F5**. VSIX : `npm run package`.

## Catalogue des commandes (77)

Palette : `Ctrl+Shift+P` → **Vehicle Debug:**

### Session ECU / UDS

| Commande | Titre |
|----------|-------|
| `vehicleDebug.connectEcu` | Connect to ECU |
| `vehicleDebug.disconnectEcu` | Disconnect ECU |
| `vehicleDebug.readDtcs` | Read DTCs |
| `vehicleDebug.clearDtcs` | Clear DTCs |
| `vehicleDebug.readDid` | Read Data Identifier (DID) |
| `vehicleDebug.readDtcExtended` | UDS 0x19 Read DTC Extended |
| `vehicleDebug.udsTesterPresent` | UDS: Tester Present |
| `vehicleDebug.udsReadMemory` | UDS: Read Memory (simulation read-only) |
| `vehicleDebug.selectActiveEcu` | Select Active ECU |
| `vehicleDebug.addEcuTarget` | Add ECU Target |
| `vehicleDebug.removeEcuTarget` | Remove ECU Target |
| `vehicleDebug.showActiveEcu` | Show Active ECU |

### OBD-II

| Commande | Titre |
|----------|-------|
| `vehicleDebug.obdConnect` | OBD-II: Connect (lab) |
| `vehicleDebug.obdReadPids` | OBD-II: Read PIDs |
| `vehicleDebug.obdReadDtcs` | OBD-II: Read DTCs (Mode 03) |
| `vehicleDebug.obdClearDtcs` | OBD-II: Clear DTCs (Mode 04) |
| `vehicleDebug.obdReadVin` | OBD-II: Read VIN (Mode 09) |
| `vehicleDebug.readObdReadiness` | OBD-II Readiness Monitors |
| `vehicleDebug.readObdMode09` | OBD-II Mode 09 Vehicle Info |

### Bus logs / CAN

| Commande | Titre |
|----------|-------|
| `vehicleDebug.analyzeLog` | Analyze Log File |
| `vehicleDebug.openSampleLog` | Open Sample Trace Log |
| `vehicleDebug.parseAsc` | Parse ASC Log |
| `vehicleDebug.analyzeAsc` | Analyze ASC Log |
| `vehicleDebug.probeBuslog` | Probe BLF/MF4 Header |
| `vehicleDebug.decodeBuslog` | Decode BLF/MF4 |
| `vehicleDebug.analyzeBuslogBinary` | Analyze BLF/MF4 Bus Log |
| `vehicleDebug.analyzeCanFlow` | Analyze CAN Bus Flow |

### Health / Status / VIN

| Commande | Titre |
|----------|-------|
| `vehicleDebug.setVin` | Set Vehicle VIN / ID |
| `vehicleDebug.readVinFromDid` | Read VIN (DID F190) |
| `vehicleDebug.refreshHealth` | Refresh Vehicle Health |
| `vehicleDebug.exportHealthSnapshot` | Export Health Snapshot |
| `vehicleDebug.diffHealthSnapshots` | Diff Health Snapshots |
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
| `vehicleDebug.doipDiagnosticSession` | DoIP: Diagnostic Session (lab) |
| `vehicleDebug.doipReadDtcs` | DoIP: Read DTCs (lab E2E) |
| `vehicleDebug.loadDbc` | Load DBC Symbols |
| `vehicleDebug.annotateLogWithDbc` | Annotate Log with DBC |
| `vehicleDebug.loadOdx` | Load ODX Description (lab) |
| `vehicleDebug.applyOdxDtcs` | Apply ODX DTCs to View |
| `vehicleDebug.lookupJ2012` | Lookup DTC (J2012 lab catalog) |
| `vehicleDebug.dpduStatus` | D-PDU API Status (stub) |
| `vehicleDebug.j2534Status` | J2534 Pass-Thru Status (stub) |

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
| `vehicleDebug.stopCiWatch` | Stop CI Report Watch |

### Governance / Fleet / Partner

| Commande | Titre |
|----------|-------|
| `vehicleDebug.anomalyAssist` | Anomaly Assist (local baseline) |
| `vehicleDebug.openGovernance` | Data Governance Panel |
| `vehicleDebug.testGovernance` | Governance: Self-Test Scopes |
| `vehicleDebug.exportPartnerPack` | Export Partner Data Pack |
| `vehicleDebug.importFleetOffline` | Import Offline Fleet & Rank |
| `vehicleDebug.openAuditLog` | Open Audit Log |

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
| `vehicleDebug.exportSelfDiagnostic` | Export Self Diagnostic Report |
| `vehicleDebug.showDashboard` | Show Dashboard |

## Configuration

| Setting | Défaut | Description |
|---------|--------|-------------|
| `vehicleDebug.pythonPath` | `python3` | Interpréteur Python |
| `vehicleDebug.canInterface` | `socketcan` | socketcan / vector / pcan / virtual |
| `vehicleDebug.canChannel` | `can0` | Canal CAN |
| `vehicleDebug.txId` / `rxId` | `0x7E0` / `0x7E8` | IDs diagnostiques |
| `vehicleDebug.enableSafetyClassification` | `true` | Scoring ASIL indicatif |

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

MIT — [LICENSE](LICENSE).
