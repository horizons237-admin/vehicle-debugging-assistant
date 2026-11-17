# Changelog

## [0.2.9] — 2026-11-17
### J2534 (analysis-only)
- **Discover:** `vehicleDebug.j2534Discover` — Windows registry scan of PassThruSupport.04.04 / 05.00 (no DLL load)
- **Probe:** `vehicleDebug.j2534Probe` — optional `libraryPath` → PassThruOpen + ReadVersion + Close only
- Settings: `vehicleDebug.j2534.libraryPath`, `vehicleDebug.j2534.pythonPath32` (prefer 32-bit Python for OEM DLLs)
- Forbidden by design: WriteMsgs, programming IOCTLs, security access, channel-based ECU control

### Prior
- Full 78+ command surface (P0–P3, multi-ECU, OBD, DoIP, ODX, bus log, BPMN)
- Safety: analysis support only — no vehicle control, no eCall, no OTA push
