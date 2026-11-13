# Vehicle Debugging Assistant

**Extension Visual Studio Code** pour l’analyse d’erreurs dans le développement automobile  
*(UDS · OBD-II · AUTOSAR · DoIP · ISO 26262)*

| | |
|---|---|
| **Version** | 0.1.1 |
| **Licence** | MIT |
| **Dépôt** | [horizons237-admin/vehicle-debugging-assistant](https://github.com/horizons237-admin/vehicle-debugging-assistant) |
| **Éditeur** | `vehicle-debug` |

---

## Mission

Centraliser dans VS Code le **diagnostic**, l’**analyse** et la **traçabilité** des erreurs véhicule — sans correction automatique non qualifiée — dans un contexte *safety-critical*.

## Accès rapide

| Page | Contenu |
|------|---------|
| [Installation](Installation) | Prérequis, clone, compile, F5, VSIX |
| [Guide utilisateur](User-Guide) | Interface, workflows, mode simulation |
| [Commandes](Commands) | Catalogue des 22 commandes |
| [Architecture](Architecture) | Couches TS / Python / protocoles |
| [Connexions](Connections) | Jira, Confluence, CodeBeamer, LLM |
| [Configuration](Configuration) | Settings `vehicleDebug.*` et secrets |
| [Safety](Safety) | ISO 26262, limites ASIL, bonnes pratiques |
| [Dépannage](Troubleshooting) | Erreurs fréquentes et solutions |
| [Développement](Development) | Structure du code, contribution |
| [Feuille de route](Roadmap) | P0–P3, versions cibles |

## Périmètre fonctionnel

- Lecture / effacement **DTC** (freeze frames)
- Analyse de **logs / traces** CAN
- Parsing **ARXML** (DEM / DCM / DTC)
- Import de rapports **CI/CD** JSON
- Assistance **LLM** (local ou distant)
- Tickets **Jira** (VWIF / DevStack) et **CodeBeamer**
- Export **Confluence**
- Découverte **DoIP** (ISO 13400)
- Mode **simulation** sans hardware

## Avertissement safety

Les estimations ASIL et les analyses IA sont **indicatives**. Elles ne remplacent pas une analyse de sécurité formelle ni un outil qualifié (ISO 26262).
