# Vehicle Debugging Assistant

Extension VS Code pour l'**analyse d'erreurs** dans le développement automobile (AUTOSAR, UDS, OBD-II, safety-critical / ISO 26262).

## Fonctionnalités

| Fonctionnalité | Commande |
|----------------|----------|
| Connexion ECU (réel ou simulation) | `Vehicle Debug: Connect to ECU` |
| Déconnexion | `Vehicle Debug: Disconnect ECU` |
| Lecture des DTC (+ freeze frames) | `Vehicle Debug: Read DTCs` |
| Effacement des DTC | `Vehicle Debug: Clear DTCs` |
| Lecture d'un DID | `Vehicle Debug: Read Data Identifier (DID)` |
| Analyse de fichier log / trace | `Vehicle Debug: Analyze Log File` |
| Ouvrir un log d'exemple | `Vehicle Debug: Open Sample Trace Log` |
| Rapport HTML consolidé | `Vehicle Debug: Show Analysis Report` |
| Analyse ARXML (DEM/DCM/DTC) | `Vehicle Debug: Analyze ARXML` |
| Import rapport CI/CD JSON | `Vehicle Debug: Import CI/CD Analysis Report` |
| Analyse IA (LLM local/remote) | `Vehicle Debug: AI: Analyze...` |
| Tickets Jira / CodeBeamer | `Vehicle Debug: Create Ticket from...` |
| Export Confluence | `Vehicle Debug: Export Report to Confluence` |
| Discovery DoIP | `Vehicle Debug: DoIP: Vehicle Discovery` |

**Vues latérales** (icône voiture) : DTCs, Errors Analysis, Session & Status, Connections.

## Documentation

- **[Guide utilisateur complet](docs/GUIDE.md)** — installation, interface, architecture, workflows, safety
- Index : [docs/README.md](docs/README.md)
- Présentation PowerPoint et guide Word : générés dans `docs/` (`.pptx` / `.docx`)

## Wiki

Documentation structurée (pages wiki du dépôt) :

- [Accueil du wiki](wiki/Home.md)
- [Installation](wiki/Installation.md) · [Guide utilisateur](wiki/User-Guide.md) · [Architecture](wiki/Architecture.md)
- [Commandes](wiki/Commands.md) · [Connexions](wiki/Connections.md) · [Configuration](wiki/Configuration.md)
- [Safety](wiki/Safety.md) · [Dépannage](wiki/Troubleshooting.md) · [Développement](wiki/Development.md)
- [Feuille de route](wiki/Roadmap.md) · [Index wiki](wiki/README.md)

> L’onglet **Wiki** GitHub natif peut être alimenté en copiant ces pages (`_Sidebar.md` inclus), ou consulté directement via les fichiers `wiki/*.md` sur `main`.

## Prérequis

- VS Code ≥ 1.85
- Node.js 18+ (compile)
- Python 3.8+

```bash
pip install python-can udsoncan can-isotp   # optionnel, mode réel
```

Sans hardware → **mode simulation** automatique.

## Installation

```bash
cd vehicle-debugging-assistant
npm install && npm run compile
# ou Install from VSIX
```

F5 pour Extension Development Host.

## Configuration

Settings `vehicleDebug.*` : pythonPath, pythonTimeoutMs, canInterface, canChannel, txId/rxId, transport (`can`|`doip`|`simulation`), DoIP host/port, connexions Jira/Confluence/CodeBeamer/LLM.

Secrets via **Set Connection Token / Password** (Secret Storage).

## Licence

MIT
