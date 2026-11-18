# Requirements — Vehicle Debugging Assistant

**Version:** 0.2.9  
**Status:** Baseline for lab tool (not ISO 26262 work product)

IDs use `REQ-<AREA>-<nnn>`. Priority: **M** must / **S** should / **C** could.  
Traceability: [TRACEABILITY.md](TRACEABILITY.md)

## Functional

| ID | Priority | Statement | Implemented by |
|----|----------|-----------|----------------|
| REQ-DIAG-001 | M | Connect to ECU in simulation or real transport | `connectEcu`, sessionStore |
| REQ-DIAG-002 | M | Read and display DTCs | `readDtcs`, dtcTreeProvider |
| REQ-DIAG-003 | M | Analyze diagnostic log files | `analyzeLog` |
| REQ-DIAG-004 | S | Analyze ARXML DEM/DCM DTC definitions | `analyzeArxml` |
| REQ-DIAG-005 | S | DoIP vehicle discovery (lab) | `doipDiscover` |
| REQ-DIAG-006 | S | Read vehicle status DIDs (normalized) | `readVehicleStatus` |
| REQ-DIAG-007 | C | Read EV/charging focused DIDs | `readEvStatus` |
| REQ-DIAG-008 | M | OBD-II lab: connect, PIDs, Mode 03/04/09 | `obdCmd`, `obd_client.py` |
| REQ-DIAG-009 | M | Parse/analyze ASC (Vector ASCII) logs | `ascCmd`, `asc_parser.py` |
| REQ-DIAG-010 | S | Probe/decode BLF/MDF4 (optional deps) | `buslogCmd`, blf/mf4 modules |
| REQ-DIAG-011 | S | Analyze CAN flow (IDs, UDS pairs) | `canFlowCmd`, `can_flow_analyzer.py` |
| REQ-DIAG-012 | S | Load DBC and annotate logs | `dbcCmd`, `dbc_parser.py` |
| REQ-DIAG-013 | S | Multi-ECU target registry | `multiEcuCmd`, ecuRegistry |
| REQ-DIAG-014 | S | J2534 registry discover + analysis-only probe | `j2534Cmd`, `j2534_probe.py` |
| REQ-HEALTH-001 | M | Unified health view with priority ranking | healthTreeProvider, triage |
| REQ-HEALTH-002 | M | Configurable triage rules in workspace | triage-rules.json |
| REQ-HEALTH-003 | S | Export health snapshot MD/JSON | `exportHealth` |
| REQ-HEALTH-004 | S | Diff health snapshots | `healthDiffCmd` |
| REQ-HEALTH-005 | S | Session timeline | `showTimeline` |
| REQ-HEALTH-006 | C | Anomaly assist vs local baseline | `anomalyAssistCmd` |
| REQ-ID-001 | M | Associate session with VIN or lab vehicle id | `vehicleIdentity` |
| REQ-ALM-001 | S | Create tickets from errors/DTCs | `createTicket` |
| REQ-ALM-002 | S | Export report to Confluence | `exportConfluence` |
| REQ-AI-001 | S | LLM analysis local and/or remote (opt-in) | `aiAnalyze`, llmClient |
| REQ-AI-002 | M | Remote LLM data upload disabled by default | package.json setting |
| REQ-CI-001 | S | Import CI/CD analysis JSON (schema VDA) | `importCicdReport` |
| REQ-CI-002 | C | Watch folder for CI reports | `ciWatchCmd` |
| REQ-GOV-001 | M | Data governance scopes + audit log | `governanceCmd` |
| REQ-GOV-002 | S | Export partner data pack (scoped) | `partnerExportCmd` |
| REQ-GOV-003 | S | Export lab incident pack (not eCall) | `incidentPackCmd` |
| REQ-FLEET-001 | S | Offline fleet import and ranking | `fleetOfflineCmd` |
| REQ-OTA-001 | S | Correlate findings with OTA campaign metadata (RO) | `otaCorrelationCmd` |
| REQ-CYBER-001 | C | UN R155 process checklist *aide* | `cyberChecklistCmd` |

## Non-functional

| ID | Priority | Statement | Notes |
|----|----------|-----------|-------|
| REQ-NFR-001 | M | No remote vehicle control commands | Safety boundary |
| REQ-NFR-002 | M | Python backend calls time-bounded | pythonRunner timeout |
| REQ-NFR-003 | S | CI runs Python tests and lint on push | ci.yml |
| REQ-NFR-004 | S | Distributable as .vsix Linux and Windows | release-platforms |
| REQ-NFR-005 | M | Safety disclaimers visible in docs/exports | Safety.md, snapshots |
| REQ-NFR-006 | S | Workspace-scoped session state | sessionStore |
| REQ-NFR-007 | M | Self-diagnostic of backends and posture | selfDiagnostic.ts |
| REQ-NFR-008 | M | J2534 limited to Open/ReadVersion/Close | j2534_probe.py |

## Explicit non-requirements

| ID | Statement |
|----|-----------|
| NREQ-001 | Tool is not an ASIL confirmation oracle |
| NREQ-002 | Tool is not a VSOC or certified CSMS |
| NREQ-003 | Tool does not implement real eCall/bCall |
| NREQ-004 | Tool does not perform flash / WriteMsgs / Security Access |

## Related

- [TRACEABILITY.md](TRACEABILITY.md) · [TEST_PLAN.md](TEST_PLAN.md) · [SMOKE_EXTENSION_HOST.md](SMOKE_EXTENSION_HOST.md)
