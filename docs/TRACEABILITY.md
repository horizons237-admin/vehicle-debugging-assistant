# Requirements traceability matrix (baseline)

| Requirement | Primary code / doc | Test / verification |
|-------------|-------------------|---------------------|
| REQ-DIAG-001 | `src/commands/connectEcu.ts` | Manual F5; session view |
| REQ-DIAG-002 | `src/commands/readDtcs.ts`, `uds_client.py` | `tests/test_python_backends.py` |
| REQ-DIAG-003 | `analyzeLog.ts`, `log_analyzer.py` | pytest log_analyzer |
| REQ-DIAG-004 | `analyzeArxml.ts`, `arxml_analyzer.py` | pytest arxml |
| REQ-DIAG-005 | `doip_client.py` | pytest doip |
| REQ-DIAG-006 | `readVehicleStatus.ts`, `read_status_batch` | pytest / manual status view |
| REQ-HEALTH-001 | `healthTreeProvider.ts` | Manual health view |
| REQ-HEALTH-002 | `triageRules.ts` | `tests/test_triage_logic.py` |
| REQ-ID-001 | `vehicleIdentity.ts`, sessionStore | Manual VIN |
| REQ-AI-002 | package.json setting | Review config default false |
| REQ-GOV-001 | `dataGovernance.ts` | Manual governance self-test |
| REQ-NFR-001 | Architecture + command set | Design review / Safety.md |
| REQ-NFR-002 | `pythonRunner.ts` | Timeout behavior review |
| REQ-NFR-003 | `ci.yml` | GitHub Actions |
| REQ-OTA-001 | `otaCorrelation.ts` | Manual + sample campaigns |
| REQ-FLEET-001 | `fleetOffline.ts` | `resources/sample_fleet.json` |

Gaps (planned M2): automated TS tests for providers/commands; extension activation smoke.
