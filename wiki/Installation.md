# Installation

## Prérequis

| Composant | Version minimale |
|-----------|------------------|
| Visual Studio Code | ≥ 1.85 |
| Node.js | 18+ |
| Python | 3.8+ |
| npm | 9+ |

### Dépendances Python optionnelles (mode réel CAN)

```bash
pip install python-can udsoncan can-isotp
```

Sans ces bibliothèques, l’extension bascule automatiquement en **mode simulation**.

## Installation depuis les sources

```bash
git clone https://github.com/horizons237-admin/vehicle-debugging-assistant.git
cd vehicle-debugging-assistant
npm install
npm run compile
```

Dans VS Code : ouvrir le dossier → **F5** (Extension Development Host).

## Installation via VSIX

```bash
npm run package
# Produit vehicle-debugging-assistant-0.1.1.vsix
```

Dans VS Code : *Extensions* → `…` → **Install from VSIX…**

## Vérification rapide

1. Icône **Vehicle Debug** dans la barre d’activité.
2. Commande `Vehicle Debug: Connect to ECU` → statut *connected* (simulation si pas de bus).
3. `Vehicle Debug: Read DTCs` → liste de DTC d’exemple.

## Structure après install

```text
vehicle-debugging-assistant/
├── package.json          # Manifeste extension
├── src/                  # TypeScript + python/
├── out/                  # Sortie tsc
├── resources/            # Échantillons (log, ARXML, CI)
├── docs/                 # Guide Markdown
└── wiki/                 # Ce wiki
```
