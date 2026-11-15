# CI/CD integration — Vehicle Debugging Assistant

## 1. Repository pipelines (this project)

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `.github/workflows/ci.yml` | push/PR to main | Compile TS, pytest, validate sample report, package VSIX artifact |
| `.github/workflows/release-platforms.yml` | tag `v*` / dispatch | Release Linux/Windows VSIX notes + assets |
| `.github/workflows/deploy-wiki.yml` | wiki content | Publish GitHub wiki |
| Dependabot | weekly | npm + Actions updates |

### Local commands

```bash
npm ci
npm run compile
npm run test:python
python3 scripts/validate_cicd_report.py resources/sample_cicd_report.json
npm run package
```

Or: `npm run ci:local`

## 2. Importing pipeline results into the extension

Command palette: **Vehicle Debug: Import CI/CD Analysis Report**

Preferred format: `resources/sample_cicd_report.json`  
Schema: `resources/schemas/vda-cicd-report.schema.json`

After import, findings feed **Errors / DTCs / Vehicle Health**.

### Validate a report

```bash
python3 scripts/validate_cicd_report.py path/to/report.json
```

## 3. Emitting reports from ECU pipelines

Examples:

- `examples/cicd/github-actions-emit-report.yml`
- `examples/cicd/gitlab-ci-snippet.yml`
- `examples/cicd/azure-pipelines-snippet.yml`

```text
MISRA / unit / HIL → aggregate → vda-cicd-report.json → artifact
  → VS Code: Import CI/CD Analysis Report
```

## 4. Safety note

CI/CD import is analysis aggregation only — not certified safety evidence.
