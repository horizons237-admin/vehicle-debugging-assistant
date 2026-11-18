# Requirements traceability matrix

**Baseline:** 0.2.9 · **Posture:** analysis-only lab · **Not** an ISO 26262 work product

| Legend | |
|--------|--|
| **V** | Verified (pytest / CI / smoke) |
| **P** | Partial (manual / sim only) |
| **D** | Doc / design review |
| **—** | Gap (planned 0.3) |

---

## Diagnostic core

| Requirement | Code / module | Test / verification | Status |
|-------------|---------------|---------------------|--------|
| REQ-DIAG-001 Connect ECU (sim/real) | `connectEcu.ts`, sessionStore | Manual F5; Smoke #2 | P |
| REQ-DIAG-002 Read DTCs | `readDtcs.ts`, `uds_client.py` | `test_python_backends.py`; Smoke #3 | V/P |
| REQ-DIAG-003 Analyze log | `analyzeLog.ts`, `log_analyzer.py` | pytest backends; sample log | V/P |
| REQ-DIAG-004 ARXML DEM/DCM | `analyzeArxml.ts`, `arxml_analyzer.py` | pytest arxml / standards | P |
| REQ-DIAG-005 DoIP discovery | `doipDiscover.ts`, `doip_client.py` | `test_doip_e2e.py` | V/P |
| REQ-DIAG-006 Status DIDs | `readVehicleStatus.ts` | Manual; Smoke #4 | P |
| REQ-DIAG-007 EV / charging DIDs | `evStatusCmd.ts` | Manual | P |
| REQ-DIAG-008 OBD-II lab Mode 03/04/09 | `obdCmd.ts`, `obd_client.py` | `test_obd_client.py`, `test_j2012_mode09.py` | V |
| REQ-DIAG-009 ASC bus log | `ascCmd.ts`, `asc_parser.py` | `test_asc_parser.py`; Smoke #7 | V |
| REQ-DIAG-010 BLF / MDF4 probe-decode | `buslogCmd.ts`, `blf_*`, `mf4_*` | `test_blf_decoder.py` (subset) | P |
| REQ-DIAG-011 CAN flow analysis | `canFlowCmd.ts`, `can_flow_analyzer.py` | `test_can_connect_codes.py` | P |
| REQ-DIAG-012 DBC symbols | `dbcCmd.ts`, `dbc_parser.py` | `test_dbc_parser.py` | V |
| REQ-DIAG-013 Multi-ECU targets | `multiEcuCmd.ts`, ecuRegistry | Manual | P |
| REQ-DIAG-014 J2534 discover + probe AO | `j2534Cmd.ts`, `j2534_probe.py` | `test_j2534_probe.py`; Smoke #9 | V |

---

## Health / identity / timeline

| Requirement | Code / module | Test / verification | Status |
|-------------|---------------|---------------------|--------|
| REQ-HEALTH-001 Unified health view | `healthTreeProvider.ts` | Manual; Smoke #5 | P |
| REQ-HEALTH-002 Configurable triage | triage rules JSON | `test_triage_logic.py` | V |
| REQ-HEALTH-003 Health snapshot export | `exportHealth.ts` | Manual; Smoke #8 | P |
| REQ-HEALTH-004 Diff snapshots | `healthDiffCmd.ts` | `test_health_diff.py` | V |
| REQ-HEALTH-005 Session timeline | `showTimeline.ts` | Manual; Smoke #6 | P |
| REQ-HEALTH-006 Anomaly baseline | `anomalyAssistCmd.ts` | Manual | P |
| REQ-ID-001 Set / read VIN | `vehicleIdentity.ts`, sessionStore | Manual | P |

---

## Governance / packs / ALM / CI

| Requirement | Code / module | Test / verification | Status |
|-------------|---------------|---------------------|--------|
| REQ-GOV-001 Data governance scopes | `governanceCmd.ts` | Manual; Smoke #10 | P |
| REQ-GOV-002 Partner data pack | `partnerExportCmd.ts` | Manual | P |
| REQ-GOV-003 Lab incident pack | `incidentPackCmd.ts` | Manual | P |
| REQ-GOV-004 VIN redact / audit | audit utils | Manual review | P |
| REQ-AI-001 AI analyze opt-in | `aiAnalyze.ts` | Config default off | D |
| REQ-AI-002 No default remote upload | package.json settings | Review default `false` | D |
| REQ-ALM-001 Ticket from DTC/error | `createTicket.ts` | Manual (needs token) | P |
| REQ-ALM-002 Export Confluence | `exportConfluence.ts` | Manual | P |
| REQ-CI-001 Import CI JSON VDA | `importCicdReport.ts` | `test_cicd_validator.py` | V |
| REQ-CI-002 CI folder watch | `ciWatchCmd.ts` | Manual | P |
| REQ-FLEET-001 Offline fleet rank | `fleetOfflineCmd.ts` | sample_fleet.json | P |
| REQ-OTA-001 OTA correlation RO | `otaCorrelationCmd.ts` | Manual + sample | P |
| REQ-CYBER-001 UN R155 checklist aide | `cyberChecklistCmd.ts` | Manual | D |

---

## NFR / safety / platform

| Requirement | Code / module | Test / verification | Status |
|-------------|---------------|---------------------|--------|
| REQ-NFR-001 No vehicle control cmds | command set, Safety.md | Design review; NREQ | D |
| REQ-NFR-002 Python time-bounded | `pythonRunner.ts` | Timeout review | D |
| REQ-NFR-003 CI pytest + lint | `.github/workflows/ci.yml` | GitHub Actions | V |
| REQ-NFR-004 VSIX Win/Linux | release-platforms.yml | Release tags 0.2.9 | V |
| REQ-NFR-005 Safety disclaimers | Safety.md, exports, self-diag | Doc + self-diag item | D |
| REQ-NFR-006 Session workspace scope | sessionStore | Design | D |
| REQ-NFR-007 Self-diagnostic | `selfDiagnostic.ts` | Manual F5; Smoke #1 | P |
| REQ-NFR-008 J2534 analysis-only limit | `j2534_probe.py` | `test_j2534_probe.py` | V |

---

## Explicit non-requirements (must remain unsatisfied)

| ID | Statement | Guard |
|----|-----------|--------|
| NREQ-001 | Not ASIL confirmation oracle | Docs + UI disclaimers |
| NREQ-002 | Not VSOC / certified CSMS | No cyber ops features |
| NREQ-003 | Not real eCall/bCall | Incident pack = lab only |
| NREQ-004 | No flash / WriteMsgs / Security Access | J2534 probe limited API |

---

## Coverage summary (0.2.9)

| Status | Count (approx.) | Meaning |
|--------|-----------------|----------|
| V | ~12 | Automated pytest or CI evidence |
| P | ~25 | Works in lab/sim; needs manual / TS tests |
| D | ~8 | Design/doc verified |
| — | 0 listed | Gaps tracked under 0.3 (TS unit, EH smoke auto) |

**Gaps 0.3**

1. Automated Extension Host smoke (see [SMOKE_EXTENSION_HOST.md](SMOKE_EXTENSION_HOST.md))  
2. TypeScript unit tests for providers/commands  
3. Keep REQUIREMENTS.md IDs in sync with this matrix  

---

## Related

- [REQUIREMENTS.md](REQUIREMENTS.md)  
- [TEST_PLAN.md](TEST_PLAN.md)  
- [SMOKE_EXTENSION_HOST.md](SMOKE_EXTENSION_HOST.md)  
- [wiki/Safety.md](../wiki/Safety.md) · [wiki/Roadmap.md](../wiki/Roadmap.md)  
