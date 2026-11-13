# Architecture

## Vue d’ensemble

```text
┌──────────────────────────────────────────────────────────┐
│  Visual Studio Code                                      │
│  Commands · TreeView providers · Webview · Status bar    │
├──────────────────────────────────────────────────────────┤
│  Orchestration (TypeScript)                              │
│  ConnectionManager · LlmClient · PythonRunner · Config   │
├──────────────────────────────────────────────────────────┤
│  Backends Python                                         │
│  uds_client · doip_client · log_analyzer · arxml_analyzer│
├──────────────────────────────────────────────────────────┤
│  Transport                                               │
│  CAN / ISO-TP · DoIP (ISO 13400) · Simulation            │
└──────────────────────────────────────────────────────────┘
```

## Flux typique

1. L’utilisateur lance une commande VS Code.
2. Le handler TypeScript lit la configuration et l’état de session.
3. `PythonRunner` exécute un script sous `src/python/` (JSON stdin / dernière ligne stdout).
4. Les résultats sont mappés vers `DtcTreeProvider` / `ErrorTreeProvider`.
5. Actions optionnelles : LLM, ticket ALM, export Confluence, rapport HTML.

## Modules clés

| Chemin | Rôle |
|--------|------|
| `src/extension.ts` | Activation, enregistrement des commandes |
| `src/commands/*` | Handlers métier |
| `src/providers/*` | TreeViews |
| `src/connections/*` | ALM + LLM + types de connexion |
| `src/utils/pythonRunner.ts` | Spawn Python + **timeout** + limite stdout |
| `src/utils/config.ts` | Settings typés |
| `src/webviews/reportPanel.ts` | Rapport HTML (échappement XSS) |
| `src/python/*.py` | Diagnostic et analyse |

## Contrat Python

- Entrée optionnelle : JSON sur **stdin**
- Sortie structurée : **dernière ligne** de stdout = JSON
- Champ `mode` : `simulation` ou `real`
- Timeout configurable : `vehicleDebug.pythonTimeoutMs` (défaut 60 s, SIGTERM puis SIGKILL)

## Identifiant extension

`vehicle-debug.vehicle-debugging-assistant`
