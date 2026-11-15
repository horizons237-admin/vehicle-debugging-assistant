# Test plan — Vehicle Debugging Assistant

## Levels

| Level | Scope | Tooling | Cadence |
|-------|-------|---------|---------|
| Unit (Python) | uds/log/arxml/doip backends | pytest | Every CI push |
| Unit (logic) | triage ranking pure rules | pytest `test_triage_logic.py` | Every CI push |
| Lint | TypeScript style | eslint | CI |
| Integration (manual) | Extension host F5 flows | Developer | Before release |
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
- [ ] `npm run test:python` passes
- [ ] `npm run lint` passes (when deps installed)

## Sample assets

- `resources/sample_trace.log`
- `resources/sample_diagnostic.arxml`
- `resources/sample_fleet.json`
- `resources/sample_triage_rules.json`
