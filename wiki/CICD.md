# CI/CD

| Système | Fichier |
|---------|---------|
| GitHub Actions | `.github/workflows/ci.yml`, `release-platforms.yml` |
| GitLab | `.gitlab-ci.yml` |
| K8s runners | `examples/cicd/gitlab-runner-k8s/` |

Rapport importable : schema `resources/schemas/vda-cicd-report.schema.json`  
Valider : `python3 scripts/validate_cicd_report.py report.json`  
Commande VS Code : **Import CI/CD Analysis Report**

Local : `npm run ci:local`
