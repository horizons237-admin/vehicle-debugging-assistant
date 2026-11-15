# Maintenance policy — Vehicle Debugging Assistant

## Versioning

- **SemVer:** MAJOR.MINOR.PATCH (`package.json`)
- Document changes in `CHANGELOG.md`
- Extension host compatibility: `engines.vscode`

## Support model (lab tool)

| Channel | Use |
|---------|-----|
| GitHub Issues | Bugs, enhancements, safety concerns |
| Wiki Troubleshooting | Known issues and workarounds |
| Security / data | Prefer local LLM; report governance gaps via issue label `security` |

**No formal SLA** for v0.x. Critical safety misconceptions in docs are prioritized.

## Release process

1. Update CHANGELOG and version if needed  
2. `npm run compile` && `npm run test:python` && `npm run lint`  
3. `npm run package` → `.vsix`  
4. Tag / run `release-platforms` workflow as applicable  
5. Smoke acceptance checklist in TEST_PLAN.md  

## Issue triage

| Label | Meaning |
|-------|---------|
| `bug` | Incorrect behavior |
| `enhancement` | New feature |
| `safety` | Disclaimer, ASIL boundary, unsafe UX |
| `docs` | Documentation only |

## Continuous improvement

- Review Roadmap quarterly  
- Revisit triage default rules when false positives rise  
- Keep Python dependencies minimal and documented  
