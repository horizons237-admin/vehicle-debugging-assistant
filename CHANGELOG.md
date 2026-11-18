# Changelog

## [0.2.9] — 2026-11-18

### Added
- **J2534 (analysis-only):** registry discovery (`PassThruSupport` / WOW6432Node) + probe Open / ReadVersion / Close only
- Settings: `vehicleDebug.j2534.libraryPath`, `vehicleDebug.j2534.pythonPath32` (32-bit Python for OEM DLLs)
- ASC (Vector ASCII) parser + sample; unified `buslog_decoder` ASC path
- Commands: Parse ASC Log, Analyze ASC Log, J2534 Discover / Probe
- BPMN Level-2 process diagrams (`docs/bpmn`) + UML Activity (`docs/uml`)
- **Plan d’architecte** (4 phases) + **Runbook Phase 3** (Déchiffrage) + **Runbook Phase 4** (Envol / FO)
- Wiki updates: J2534 lab, Safety, Commands, Plan-Architecte, runbooks

### Safety
- J2534: **no** WriteMsgs, programming, security access, or vehicle control
- Releases: Windows + Linux VSIX tags `v0.2.9-windows` / `v0.2.9-linux`

### Known limits
- BLF/MDF4 depth depends on optional deps (`asammdf` / `python-can`); native BLF is CAN-subset lite
- TypeScript / Extension Host automated smoke still thin (see Roadmap 0.3)

---

## [0.2.8] — 2026-11-15
### Added
- Native BLF lite decoder (CAN subset)
- MF4 decoder facade (asammdf / python-can)
- Decode BLF/MF4 command

## [0.2.7] — 2026-11-15
### Added
- BLF/MF4 header probe
- buslog_bridge + docs BLF.md / MDF4.md

## [0.2.6] — CAN flow analyzer
### Added
- can_flow_analyzer.py (IDs, UDS pairs, anomalies)

## [0.2.5] — J2012, Mode09, ODX→view, D-PDU stub

## [0.2.2] — 2026-11-15
### Added (P2)
- DBC symbol load + log annotation
- Dashboard webview, i18n FR/EN (partial)
- CI report folder watch
- UDS read-only extensions (sim)

## [0.2.1] — 2026-11-15
### Added (P1)
- Multi-ECU, DoIP E2E lab, health diff, audit/redaction

## [0.2.0] — 2026-11-15
### Added (P0)
- OBD-II lab, unit tests (Python), CAN structured errors
- Vehicle Health, VIN, triage, snapshot (baseline P0)

## [0.1.1] — baseline
### SDLC / P3 notes
- Planning, requirements, test plan, maintenance docs
- Wiki, CI/CD import schema, safety posture (analysis-only)
- P0–P3 feature set (Health → OTA/cyber aide / incident pack / EV)
- Issue templates (bug, feature, safety_concern)
