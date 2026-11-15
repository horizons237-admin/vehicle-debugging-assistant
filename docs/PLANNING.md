# Project Planning — Vehicle Debugging Assistant

**Version:** 0.1.1  
**Last updated:** 2026-11-15  
**Status:** Active (lab / engineering tool)

## 1. Goals

| Goal | Description | Success indicator |
|------|-------------|-------------------|
| G1 | Provide VS Code–based analysis of automotive diagnostic errors | DTC/log/ARXML analysis usable offline |
| G2 | Support safety-critical *analysis* (not confirmation) | ASIL heuristic + disclaimers; no unsafe vehicle commands |
| G3 | Integrate ALM & optional LLM | Jira/Confluence/CodeBeamer + local/remote LLM with opt-in |
| G4 | Align with connected-vehicle insight patterns (lab scale) | Health, status, OTA correlation, governance, fleet offline |

## 2. Scope

### In scope
- UDS/OBD-II style diagnostics (simulation + optional real CAN/DoIP)
- AUTOSAR ARXML (DEM/DCM) analysis
- Log analysis, CI/CD JSON import
- Health triage, VIN session, remote mock diagnostics, SOVD lab discovery
- Anomaly baseline, partner packs, offline fleet ranking
- OTA correlation (read-only), UN R155 *aide* checklist, lab incident pack
- Packaging as `.vsix` (Linux/Windows notes)

### Out of scope
- Production VSOC / real eCall / remote immobilization
- Certified ISO 26262 *tool qualification* evidence pack
- Multi-OEM 24/7 connected platform
- VS Code Marketplace publication (optional later)

## 3. Constraints

- **Safety:** analysis-only; no remote vehicle control
- **Data:** remote LLM opt-in (`allowRemoteDataUpload`)
- **Platform:** VS Code ^1.85, Python 3 for backends
- **License:** MIT

## 4. Schedule (milestones)

| Milestone | Target | Content | Status |
|-----------|--------|---------|--------|
| M0 | 0.1.0 | Core extension, UDS sim, ALM hooks | Done |
| M1 | 0.1.1 | P0–P3 features, SDLC docs, CI | Done / in progress |
| M2 | 0.2.0 | TS unit tests, REQ coverage ≥ core commands | Planned |
| M3 | 0.3.0 | Multi-ECU sessions, stronger DoIP, i18n FR/EN | Planned |

## 5. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Real CAN hardware variance | High | Simulation-first; document interface matrix |
| Misuse as safety oracle | High | Disclaimers; wiki Safety; no ASIL confirmation claims |
| Remote LLM data leak | High | Opt-in + governance audit channel |
| Scope creep toward OEM platform | Medium | Explicit out-of-scope list |

## 6. Related documents

- [REQUIREMENTS.md](./REQUIREMENTS.md)
- [TEST_PLAN.md](./TEST_PLAN.md)
- [MAINTENANCE.md](./MAINTENANCE.md)
