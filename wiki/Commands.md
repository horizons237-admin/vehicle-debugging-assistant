# Commands

## Core
Connect ECU, Read/Clear DTCs, Analyze Log, Read DID, Reports, AI analyze, Tickets, Confluence, CI/CD import, ARXML, DoIP discovery, VIN / Health.

## P2 (wired on main)
| Command | Id |
|---------|-----|
| Anomaly Assist (local baseline) | `vehicleDebug.anomalyAssist` |
| Data Governance Panel | `vehicleDebug.openGovernance` |
| Governance: Self-Test Scopes | `vehicleDebug.testGovernance` |
| Export Partner Data Pack | `vehicleDebug.exportPartnerPack` |
| Import Offline Fleet & Rank | `vehicleDebug.importFleetOffline` |

Settings: `vehicleDebug.governance.*` (ALM / partner export, redact VIN / location). Remote LLM upload stays **opt-in** (`llm.allowRemoteDataUpload`, default false).

Sample fleet: `resources/sample_fleet.json`.

## P1 / P0 helpers
Multi-ECU, DoIP E2E, health diff, audit/redaction, OBD-II lab, unit tests.

## P3 (lab aides — modules present)
OTA Correlation, UN R155 checklist, Lab Incident Pack, EV status.

## Process diagrams
Show BPMN Viewer — see [BPMN](BPMN).
