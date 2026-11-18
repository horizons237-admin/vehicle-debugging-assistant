# Commands (80+ on main)

## Core
Connect/Disconnect ECU · Read/Clear DTCs · Analyze Log · Read DID · Reports · AI · Tickets · Confluence · CI/CD import · ARXML · DoIP discovery · VIN · Health · Triage · Status · Dashboard · Audit

## Multi-ECU
Select Active ECU · Add / Remove Target · Show Active ECU

## OBD-II lab
Connect · Read DTCs / PIDs / VIN · Clear DTCs · Readiness · Mode 09 · J2012 lookup

## DoIP / pass-thru status
DoIP Diagnostic Session · DoIP Read DTCs · J2534 Status · D-PDU Status

## J2534 / Pass-Thru (analysis-only)
- **J2534: Discover Drivers (registry)** — Windows registry scan; no DLL load
- **J2534: Probe Library (analysis-only)** — Open / ReadVersion / Close only (`j2534.libraryPath`)
- **J2534 Pass-Thru Status (stub)** / **D-PDU Status**
- Settings: `vehicleDebug.j2534.libraryPath`, `vehicleDebug.j2534.pythonPath32` (prefer 32-bit Python for OEM DLLs)
- **Not supported:** programming, WriteMsgs, security access

## Bus log / CAN
CAN Flow · Probe / Decode Bus Log · ASC parse/analyze · DBC load/annotate

## P2
Anomaly Assist · Governance · Partner Pack · Offline Fleet

## P3
OTA Correlation · OTA Campaigns file · UN R155 Checklist (aide) · Lab Incident Pack · EV Status

## ODX / UDS extensions
Load ODX · Apply ODX DTCs · Read DTC Extended · UDS Read Memory · Tester Present

## CI watch
Start / Stop CI Report Folder Watch

## Process
BPMN Viewer · Self Diagnostic · SOVD · Remote Diagnostics (mock) · Timeline

**Safety:** analysis-only — no vehicle control, no eCall, no OTA install.

See [BPMN](BPMN).
