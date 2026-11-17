# Vehicle Debugging Assistant

**Extension Visual Studio Code** pour l’analyse d’erreurs dans le développement automobile  
*(UDS · OBD-II · AUTOSAR · DoIP · ISO 26262 — aide à l’analyse)*

| | |
|---|---|
| **Version** | 0.1.1 |
| **Licence** | MIT |
| **Dépôt** | [horizons237-admin/vehicle-debugging-assistant](https://github.com/horizons237-admin/vehicle-debugging-assistant) |
| **Présentation** | [Vehicle_Debugging_Assistant_Presentation.pptx](https://github.com/horizons237-admin/vehicle-debugging-assistant/blob/main/Vehicle_Debugging_Assistant_Presentation.pptx) |

---

## Mission

Centraliser dans VS Code le **diagnostic**, l’**analyse** et la **traçabilité** des erreurs véhicule — sans correction automatique non qualifiée — dans un contexte *safety-critical*.

## Accès rapide

| Page | Contenu |
|------|---------|
| [Installation](Installation) | Prérequis, F5, VSIX |
| [Guide utilisateur](User-Guide) | Workflows lab, Health, Status |
| [Commandes](Commands) | Catalogue des commandes |
| [Architecture](Architecture) | Couches TS / Python |
| [Connexions](Connections) | Jira, Confluence, CodeBeamer, LLM |
| [Configuration](Configuration) | Settings `vehicleDebug.*` |
| [CI/CD](CICD) | GitHub, GitLab, K8s, format rapport |
| [Process diagrams](Process-Diagrams) | BPMN Level-2 & UML Activity |
| [BPMN](BPMN) | Four core processes (BPMN 2.0) |
| [UML Activity](UML-Activity) | Same processes (PlantUML / Mermaid) |
| [Safety](Safety) | Limites ASIL, gouvernance |
| [SDLC](SDLC) | Planning, exigences, tests, maintenance |
| [Dépannage](Troubleshooting) | Erreurs fréquentes |
| [Développement](Development) | Structure du code |
| [Feuille de route](Roadmap) | P0–P3, jalons 0.2 / 0.3 |

## Périmètre fonctionnel (0.1.1)

- DTC + freeze frames, logs CAN, ARXML DEM/DCM, DoIP lab  
- **Vehicle Health** + règles de triage, VIN  
- Status DIDs, remote diagnostics mock, SOVD discovery, timeline  
- Anomaly baseline, gouvernance data, partner packs, fleet offline  
- Corrélation OTA, checklist UN R155 (aide), incident pack lab, EV status  
- Import rapports **CI/CD** JSON (schema VDA)  
- Tickets Jira / CodeBeamer, export Confluence, LLM local/remote (opt-in)

## Avertissement safety

Les estimations ASIL et analyses IA sont **indicatives**. Ce n’est **pas** un outil de confirmation ASIL, ni un VSOC, ni un eCall.
