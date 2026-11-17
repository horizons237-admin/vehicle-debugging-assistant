# Installation

## Prérequis

| Composant | Version minimale |
|-----------|------------------|
| Visual Studio Code | ≥ 1.85 |
| Node.js | 18+ |
| Python | 3.8+ |
| npm | 9+ |

## Dépendances Python (matrice)

| Package | Obligatoire ? | Capacité débloquée |
|---------|---------------|--------------------|
| *(aucune)* | — | Mode **simulation** : DTC/DID/log texte, commandes lab |
| `python-can` | Optionnel | Interfaces CAN, **BLFReader**, **MF4Reader** |
| `udsoncan` | Optionnel | Client UDS (avec transport) |
| `can-isotp` | Optionnel | ISO-TP sous UDS |
| `asammdf` | Optionnel | Lecture **MF4** complète (channels, bus logging) |

```bash
# Minimal lab (simulation)
# rien à installer côté Python au-delà de la stdlib

# Bus réel + BLF
pip install python-can udsoncan can-isotp

# MF4 enrichi
pip install asammdf
```

L'extension détecte l'absence de libs et **bascule en simulation** ou en *probe-only* pour les binaires.

## Installation depuis les sources

```bash
git clone https://github.com/horizons237-admin/vehicle-debugging-assistant.git
cd vehicle-debugging-assistant
npm install
npm run compile
```

Dans VS Code : ouvrir le dossier → **F5** (Extension Development Host).

### Smoke test

```bash
npm run compile
python3 -m pytest tests/ -q
node tests/unit/run_unit_tests.js
```

## Installation via VSIX

```bash
npm run package
# Produit vehicle-debugging-assistant-0.2.9.vsix (version package.json)
```

VS Code : *Extensions* → `…` → **Install from VSIX…**

## Vérification rapide

1. Icône **Vehicle Debug** dans la barre d'activité.
2. `Vehicle Debug: Connect to ECU` → *connected* (simulation si pas de bus).
3. `Vehicle Debug: Read DTCs` → DTC d'exemple.
4. `Vehicle Debug: Parse ASC Log` sur `resources/sample.asc`.
5. `Vehicle Debug: Self Diagnostic` → état des backends.

## Structure après install

```text
vehicle-debugging-assistant/
├── package.json
├── src/                  # TypeScript + python/
├── out/                  # Sortie tsc
├── resources/            # Échantillons (log, ASC, BLF b64, ARXML, CI)
├── docs/                 # BLF, MDF4, CI/CD, process diagrams
└── wiki/                 # Pages wiki (source)
```

## Documentation associée

- [Guide utilisateur](User-Guide)
- [Commandes](Commands)
- [Configuration](Configuration)
- [Process diagrams](Process-Diagrams)
