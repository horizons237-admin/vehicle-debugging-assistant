# Vehicle Debugging Assistant

**Version 0.2.9** — lab analysis aid (UDS · OBD-II · bus logs · J2534 probe · CI import).

Extension VS Code pour l'**analyse d'erreurs** dans le développement automobile (AUTOSAR, UDS, OBD-II, safety-critical / ISO 26262).

> **Safety:** analysis support only — not ASIL confirmation, not vehicle control, not VSOC.  
> **J2534:** registry discovery + Open/ReadVersion/Close only — no WriteMsgs / programming.

## Fonctionnalités (aperçu)

| Domaine | Capacité | Limite |
|---------|----------|--------|
| UDS / OBD-II | DTC, DID, session, PIDs, Mode 03/09 (lab) | Sim ou transport lab |
| Bus logs | ASC, BLF lite, MF4 probe/decode, CAN flow | MF4/BLF selon deps optionnelles |
| AUTOSAR | ARXML DEM/DCM, DBC, ODX (lab) | — |
| Health | VIN, triage, timeline, anomaly baseline | Indicatif |
| J2534 | Discover drivers (registry), probe version | Analysis-only, Windows |
| Gouvernance | Scopes, VIN redact, partner / incident packs | Pas eCall / VSOC |
| ALM / CI | Jira, CodeBeamer, Confluence, LLM opt-in, import JSON VDA | SecretStorage |
| Process | BPMN L2, UML, Plan d’architecte, Runbooks P3/P4 | — |

**Vues latérales** (icône voiture) : DTCs · Errors Analysis · Session & Status · Self-diagnostic

## Démarrage rapide

1. `npm install` && `npm run compile` → **F5** (Extension Development Host)  
2. Activity Bar → **Vehicle Debug**  
3. **Connect to ECU** (simulation) → **Read DTCs** → **Vehicle Health**  
4. Dossier MOS : [Runbook Phase 3](wiki/Runbook-Phase3.md) → [Runbook Phase 4](wiki/Runbook-Phase4.md)  

VSIX : [Releases](https://github.com/horizons237-admin/vehicle-debugging-assistant/releases) (`v0.2.9-linux` / `v0.2.9-windows`).

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

Pour J2534 OEM (Windows), préférer un **Python 32-bit** via `vehicleDebug.j2534.pythonPath32`.

## Installation (développement)

```bash
git clone https://github.com/horizons237-admin/vehicle-debugging-assistant.git
cd vehicle-debugging-assistant
npm install && npm run compile
```

VS Code : **F5**. VSIX : `npm run package`.

## Catalogue des commandes (~80)

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
| `vehicleDebug.showTimeline` | Show Session Timeline |

### Remote / SOVD / DoIP

| Commande | Titre |
|----------|-------|
| `vehicleDebug.pullRemoteDiagnostics` | Pull Remote Diagnostics (mock/HTTP) |
| `vehicleDebug.sovdDiscover` | SOVD: Discover Resources |
| `vehicleDebug.doipDiscover` | DoIP: Vehicle Discovery |
| `vehicleDebug.doipDiagnosticSession` | DoIP: Diagnostic Session (lab) |
| `vehicleDebug.doipReadDtcs` | DoIP: Read DTCs (lab E2E) |

### ARXML / DBC / ODX / Standards

| Commande | Titre |
|----------|-------|
| `vehicleDebug.analyzeArxml` | Analyze ARXML (DEM/DCM/DTC) |
| `vehicleDebug.loadDbc` | Load DBC Symbols |
| `vehicleDebug.annotateLogWithDbc` | Annotate Log with DBC |
| `vehicleDebug.loadOdx` | Load ODX Description (lab) |
| `vehicleDebug.applyOdxDtcs` | Apply ODX DTCs to View |
| `vehicleDebug.lookupJ2012` | Lookup DTC (J2012 lab catalog) |
| `vehicleDebug.dpduStatus` | D-PDU API Status (stub) |

### J2534 (analysis-only)

| Commande | Titre |
|----------|-------|
| `vehicleDebug.j2534Discover` | J2534: Discover Drivers (registry) |
| `vehicleDebug.j2534Probe` | J2534: Probe Library (analysis-only) |
| `vehicleDebug.j2534Status` | J2534 Pass-Thru Status (stub) |

### AI / ALM / Export

| Commande | Titre |
|----------|-------|
| `vehicleDebug.configureConnections` | Configure Connections… |
| `vehicleDebug.testConnection` | Test Selected Connection |
| `vehicleDebug.setConnectionSecret` | Set Connection Token / Password |
| `vehicleDebug.aiAnalyzeSelection` | AI: Analyze Selection / Log |
| `vehicleDebug.aiAnalyzeAll` | AI: Analyze All Errors & DTCs |
| `vehicleDebug.createTicketFromError` | Create Ticket from Error |
| `vehicleDebug.createTicketFromDtc` | Create Ticket from DTC |
| `vehicleDebug.exportConfluence` | Export Report to Confluence |

### CI/CD

| Commande | Titre |
|----------|-------|
| `vehicleDebug.importCicdReport` | Import CI/CD Analysis Report |
| `vehicleDebug.startCiWatch` | Start CI Report Folder Watch |
| `vehicleDebug.stopCiWatch` | Stop CI Report Watch |

### Governance / Fleet / Partner / OTA / Cyber / EV

| Commande | Titre |
|----------|-------|
| `vehicleDebug.anomalyAssist` | Anomaly Assist (local baseline) |
| `vehicleDebug.openGovernance` | Data Governance Panel |
| `vehicleDebug.testGovernance` | Governance: Self-Test Scopes |
| `vehicleDebug.exportPartnerPack` | Export Partner Data Pack |
| `vehicleDebug.importFleetOffline` | Import Offline Fleet & Rank |
| `vehicleDebug.exportIncidentPack` | Export Lab Incident Pack |
| `vehicleDebug.otaCorrelation` | OTA Campaign Correlation |
| `vehicleDebug.cyberChecklist` | Cyber / UN R155 Checklist (aide) |
| `vehicleDebug.readEvStatus` | Read EV / Charging Status |

### Self-diagnostic / Views

| Commande | Titre |
|----------|-------|
| `vehicleDebug.showReport` | Show Analysis Report |
| `vehicleDebug.refreshViews` | Refresh Views |
| `vehicleDebug.runSelfDiagnostic` | Run Self Diagnostic |
| `vehicleDebug.exportSelfDiagnostic` | Export Self Diagnostic Report |
| `vehicleDebug.showDashboard` | Show Dashboard |
| `vehicleDebug.showBpmnViewer` | Show BPMN Viewer |

## Configuration (extrait)

| Setting | Défaut | Description |
|---------|--------|-------------|
| `vehicleDebug.pythonPath` | `python3` | Interpréteur Python |
| `vehicleDebug.j2534.libraryPath` | — | DLL PassThru |
| `vehicleDebug.j2534.pythonPath32` | — | Python 32-bit pour DLL OEM |
| `vehicleDebug.canInterface` | `socketcan` | socketcan / vector / pcan / virtual |
| `vehicleDebug.enableSafetyClassification` | `true` | Scoring ASIL **indicatif** |

## Architecture

```text
VS Code Extension (TypeScript)
  commands / providers / session / audit / governance
        │ spawn + JSON
Python backends (src/python/)
  uds · obd · doip · arxml · dbc · odx
  asc · blf_* · mf4_* · buslog_* · can_flow · j2534_probe
```

## Documentation

| Ressource | Lien |
|-----------|------|
| Wiki | https://github.com/horizons237-admin/vehicle-debugging-assistant/wiki |
| Plan d’architecte | [wiki/Plan-Architecte.md](wiki/Plan-Architecte.md) |
| Runbook Phase 3 / 4 | [Runbook-Phase3](wiki/Runbook-Phase3.md) · [Runbook-Phase4](wiki/Runbook-Phase4.md) |
| J2534 / Safety | [wiki/J2534.md](wiki/J2534.md) · [wiki/Safety.md](wiki/Safety.md) |
| Roadmap | [wiki/Roadmap.md](wiki/Roadmap.md) |
| BPMN / UML | [docs/PROCESS_DIAGRAMS.md](docs/PROCESS_DIAGRAMS.md) |
| Changelog | [CHANGELOG.md](CHANGELOG.md) |

## Licence

MIT — [LICENSE](LICENSE).
