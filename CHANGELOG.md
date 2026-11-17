# Changelog

## [0.2.9] — 2026-11-17
### Fixed / wired (P2 + P3 on main)
- **P2:** anomaly assist, data governance, partner packs, offline fleet ranking
- **P3:** OTA correlation (read-only), UN R155 aide checklist, lab incident pack, EV/charging status
- `StatusTreeProvider` used by OTA / incident / EV paths
- Campaigns: `.vehicle-debug/ota-campaigns.json` (sample auto-created)

### Safety
- Analysis support only — no vehicle control, no eCall, no OTA push

### Added (earlier 0.2.x)
- ASC / BLF / MF4, CAN flow, BPMN viewer, self-diagnostic, SOVD lab discovery

## [0.1.1] — baseline
- Core UDS/OBD analysis, CI/CD import schema, safety posture (analysis-only)
