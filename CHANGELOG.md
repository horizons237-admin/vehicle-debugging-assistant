# Changelog

## [0.2.9] — 2026-11-17
### Wired on main — full command surface (78)
- **Core / P2 / P3** as previously
- **Continue:** multi-ECU, OBD-II, DoIP session/DTCs, J2534/D-PDU stubs, CI folder watch, ODX/UDS extensions, DBC, health diff
- **Modules restored on remote:** `multiEcuCmd`, `doipDiagnosticCmd`, `j2534Cmd`, `ciWatchCmd`, `standardsCmd`, `udsExtendedCmd`, `dbcCmd`, `healthDiffCmd`, `j2534Adapter`, `i18n`

### Verification
- Python tests: `pytest tests/` green (local smoke)

### Safety
- Analysis support only — no vehicle control, no eCall, no OTA push

## [0.1.1] — baseline
- Core UDS/OBD analysis posture (analysis-only)
