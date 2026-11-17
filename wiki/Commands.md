# Commands

## Core
Connect ECU, Read/Clear DTCs, Analyze Log, Read DID, Reports, AI analyze, Tickets, Confluence, CI/CD import, ARXML, DoIP discovery, VIN / Health.

## P2
| Command | Id |
|---------|-----|
| Anomaly Assist (local baseline) | `vehicleDebug.anomalyAssist` |
| Data Governance Panel | `vehicleDebug.openGovernance` |
| Governance: Self-Test Scopes | `vehicleDebug.testGovernance` |
| Export Partner Data Pack | `vehicleDebug.exportPartnerPack` |
| Import Offline Fleet & Rank | `vehicleDebug.importFleetOffline` |

## P3 (wired on main)
| Command | Id |
|---------|-----|
| OTA Correlation (read-only) | `vehicleDebug.otaCorrelation` |
| Open OTA Campaigns File | `vehicleDebug.openOtaCampaigns` |
| UN R155 Checklist (aide) | `vehicleDebug.cyberChecklist` |
| Export Lab Incident Pack | `vehicleDebug.exportIncidentPack` |
| Read EV Status (lab) | `vehicleDebug.readEvStatus` |

**P3 safety:** no eCall, no remote vehicle control, no OTA install trigger — analysis/dev aides only.

Campaigns file (auto-created): `.vehicle-debug/ota-campaigns.json`.

Settings: `vehicleDebug.governance.*`. Remote LLM upload remains opt-in.

## Process diagrams
Show BPMN Viewer — see [BPMN](BPMN).
