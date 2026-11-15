# CI/CD integration — Vehicle Debugging Assistant

## 1. Repository pipelines (this project)

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `.github/workflows/ci.yml` | push/PR to main | Compile TS, pytest, validate sample report, package VSIX artifact |
| `.gitlab-ci.yml` | MR, default branch, tags, web | Same goals on GitLab Runners |
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

## 5. GitLab CI (this repository)

Root file: **`.gitlab-ci.yml`**

| Stage | Jobs |
|-------|------|
| build | `compile` (Node 20, `npm run compile`) |
| test | `test:python:junit`, `lint:ts` (allow_failure) |
| validate | `validate:cicd-report`, `validate:sdlc-docs` |
| package | `package:vsix`, `emit:vda-report-template` |
| release | `release:vsix` (tags only) |

### Enable on GitLab

1. Push / mirror this repo to GitLab.
2. Ensure shared runners (Docker) are enabled.
3. Pipelines run on default branch, MRs, tags, and **web** (manual).
4. Download **VSIX** or **vda-cicd-report** from job artifacts.

### ECU product pipelines on GitLab

See `examples/cicd/gitlab-ci-snippet.yml`:

`analyze` (MISRA/unit placeholders) → `aggregate_vda_report` → artifact `out/vda-cicd-report.json` → import in VS Code.
