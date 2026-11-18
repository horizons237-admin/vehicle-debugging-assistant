# Vehicle Debugging Assistant

Extension VS Code pour l’**analyse** d’erreurs automobile (UDS, OBD-II, AUTOSAR, logs CAN, DoIP) — posture **safety-critical analysis-only**.

| Page | Contenu |
|------|---------|
| [Installation](Installation) | Prérequis, build VSIX |
| [Guide utilisateur](User-Guide) | Workflows lab |
| [Commandes](Commands) | Palette (80+) |
| [J2534 / Pass-Thru](J2534) | Discover + probe analysis-only |
| [Architecture](Architecture) | Structure du code |
| [Plan d’architecte](Plan-Architecte) | Vue 4 phases (fondations → envol) |
| [Connexions](Connections) | Jira, Confluence, CodeBeamer, LLM |
| [Configuration](Configuration) | Settings |
| [CI/CD](CICD) | Pipelines |
| [Process diagrams](Process-Diagrams) | BPMN / UML |
| [Safety](Safety) | Limites produit |
| [SDLC](SDLC) | Conformité |
| [Dépannage](Troubleshooting) | FAQ |
| [Développement](Development) | Structure du code |
| [Feuille de route](Roadmap) | P0–P3, jalons 0.2 / 0.3 |

## Périmètre fonctionnel (0.2.9)

- DTC + freeze frames, logs CAN, ARXML DEM/DCM, DoIP lab  
- **Vehicle Health** + règles de triage, VIN  
- Status DIDs, remote diagnostics mock, SOVD discovery, timeline  
- Anomaly baseline, gouvernance data, partner packs, fleet offline  
- Corrélation OTA, checklist UN R155 (aide), incident pack lab, EV status  
- Import rapports **CI/CD** JSON (schema VDA)  
- Tickets Jira / CodeBeamer, export Confluence, LLM local/remote (opt-in)  
- **J2534** registry discovery + analysis-only probe (Windows)

## Avertissement safety

Les estimations ASIL et analyses IA sont **indicatives**. Ce n’est **pas** un outil de confirmation ASIL, ni un VSOC, ni un eCall.

### J2534 lab (v0.2.9)
- Registry discovery + analysis-only probe — see [J2534](J2534).

### Plan d’architecte
- Vue structurée du produit (4 phases) — [Plan d’architecte](Plan-Architecte).
