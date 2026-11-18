# Test plan — Vehicle Debugging Assistant

## Levels

| Level | Scope | Tooling | Cadence |
|-------|-------|---------|----------|
| Unit (Python) | uds/log/arxml/doip/j2534 backends | pytest | Every CI push |
| Unit (logic) | triage ranking pure rules | `test_triage_logic.py` | Every CI push |
| Lint | TypeScript style | eslint | CI |
| Smoke (manual) | Extension host F5 — 10 critical cmds | [SMOKE_EXTENSION_HOST.md](SMOKE_EXTENSION_HOST.md) | Before release |
| Integration (manual) | Broader F5 flows | Developer | Before release |
| Acceptance | REQ must-items checklist | Manual sign-off | Release candidate |

## Acceptance checklist (M / must)

- [ ] Connect simulation and see session Connected
- [ ] Read DTCs populates DTC view
- [ ] Analyze sample log produces errors
- [ ] Health view ranks findings
- [ ] Set VIN visible in Session
- [ ] Export health snapshot creates file
- [ ] Remote LLM upload setting defaults to false
- [ ] No command exposes remote lock/immobilize
- [ ] Self-diagnostic shows backends present + analysis-only
- [ ] `npm run test:python` / pytest passes
- [ ] `npm run lint` passes (when deps installed)

## Sample assets

- `resources/sample_trace.log`
- `resources/sample_diagnostic.arxml`
- `resources/sample_fleet.json`
- `resources/sample_triage_rules.json`
- `resources/sample.asc` (if present)

## Defect severity

| Severity | Definition |
|----------|------------|
| Blocker | Crash on activate, data loss, unsafe command reachable |
| Major | Core diagnostic flow broken |
| Minor | UI/docs issue, non-core command failure |

## Related

- [TRACEABILITY.md](TRACEABILITY.md) · [REQUIREMENTS.md](REQUIREMENTS.md)
