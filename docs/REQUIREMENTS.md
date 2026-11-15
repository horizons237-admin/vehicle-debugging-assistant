# Requirements — Vehicle Debugging Assistant

**Version:** 0.1.1  
**Status:** Baseline for lab tool (not ISO 26262 work product)

IDs use `REQ-<AREA>-<nnn>`. Priority: **M** must / **S** should / **C** could.

## Functional

| ID | Priority | Statement | Implemented by |
|----|----------|-----------|----------------|
| REQ-DIAG-001 | M | Connect to ECU in simulation or real transport | `connectEcu`, sessionStore |
| REQ-DIAG-002 | M | Read and display DTCs | `readDtcs`, dtcTreeProvider |
| REQ-DIAG-003 | M | Analyze diagnostic log files | `analyzeLog` |
| REQ-DIAG-004 | S | Analyze ARXML DEM/DCM DTC definitions | `analyzeArxml` |
| REQ-DIAG-005 | S | DoIP vehicle discovery (lab) | `doipDiscover` |
| REQ-DIAG-006 | S | Read vehicle status DIDs (normalized) | `readVehicleStatus`, statusCatalog |
| REQ-DIAG-007 | C | Read EV/charging focused DIDs | `readEvStatus` |
| REQ-HEALTH-001 | M | Unified health view with priority ranking | healthTreeProvider, triageRules |
| REQ-HEALTH-002 | M | Configurable triage rules in workspace | `.vehicle-debug/triage-rules.json` |
| REQ-HEALTH-003 | S | Export health snapshot MD/JSON | `exportHealthSnapshot` |
| REQ-ID-001 | M | Associate session with VIN or lab vehicle id | `setVin`, `readVinFromDid` |
| REQ-ALM-001 | S | Create tickets from errors/DTCs | createTicket, Jira/CodeBeamer config |
| REQ-ALM-002 | S | Export report to Confluence | `exportConfluence` |
| REQ-AI-001 | S | LLM analysis local and/or remote | llmClient |
| REQ-AI-002 | M | Remote LLM data upload disabled by default | `llm.allowRemoteDataUpload` |
| REQ-CI-001 | S | Import CI/CD analysis JSON | `importCicdReport` |
| REQ-REM-001 | S | Remote diagnostics mock/HTTP by VIN | remoteDiagnostics |
| REQ-SOVD-001 | C | SOVD-like resource discovery (lab) | sovdClient |
| REQ-TIME-001 | S | Session timeline correlating DTC/errors/status | `showTimeline` |
| REQ-ANOM-001 | S | Local anomaly assist vs baseline | anomalyAssist |
| REQ-GOV-001 | M | Data governance scopes + audit log | dataGovernance |
| REQ-PACK-001 | S | Partner export packs (quality/aftersales/safety) | partnerPacks |
| REQ-FLEET-001 | S | Offline fleet import and ranking | fleetOffline |
| REQ-OTA-001 | S | Correlate findings with OTA campaign metadata | otaCorrelation |
| REQ-CYBER-001 | C | UN R155 process checklist *aide* | cyberChecklist |
| REQ-INC-001 | S | Lab incident pack export (not eCall) | incidentPack |

## Non-functional

| ID | Priority | Statement |
|----|----------|-----------|
| REQ-NFR-001 | M | No remote vehicle control commands |
| REQ-NFR-002 | M | Python backend calls time-bounded and cancellable |
| REQ-NFR-003 | S | CI runs Python tests and lint on push |
| REQ-NFR-004 | S | Distributable as `.vsix` |
| REQ-NFR-005 | M | Safety disclaimers visible in docs/exports |
| REQ-NFR-006 | S | Workspace-scoped session state |

## Explicit non-requirements

| ID | Statement |
|----|-----------|
| NREQ-001 | Tool is not an ASIL confirmation oracle |
| NREQ-002 | Tool is not a VSOC or certified CSMS |
| NREQ-003 | Tool does not implement real eCall/bCall |
