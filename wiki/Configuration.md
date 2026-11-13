# Configuration

Tous les réglages sont sous le préfixe **`vehicleDebug`**  
(*Settings* → rechercher « Vehicle Debug »).

## Interpréteur & robustesse

| Clé | Défaut | Description |
|-----|--------|-------------|
| `pythonPath` | `python3` | Interpréteur Python |
| `pythonTimeoutMs` | `60000` | Timeout d’un appel backend (1 s – 600 s) |

## Bus & diagnostic

| Clé | Défaut | Description |
|-----|--------|-------------|
| `canInterface` | `socketcan` | socketcan / vector / pcan / virtual |
| `canChannel` | `can0` | Canal CAN |
| `txId` / `rxId` | `0x7E0` / `0x7E8` | IDs UDS |
| `defaultSession` | `extended` | Session diagnostique |
| `transport` | `can` | `can` / `doip` / `simulation` |
| `enableSafetyClassification` | `true` | Estimation ASIL indicative |
| `logLevel` | `info` | debug / info / warn / error |

## DoIP

| Clé | Défaut |
|-----|--------|
| `doip.enabled` | `false` |
| `doip.host` | `192.168.0.10` |
| `doip.port` | `13400` |
| `doip.logicalAddressTester` | `0x0E00` |
| `doip.logicalAddressEcu` | `0x0E80` |

## Jira / Confluence / CodeBeamer / LLM

Voir les clés `jira.vwif.*`, `jira.devstack.*`, `confluence.*`, `codebeamer.*`, `llm.local.*`, `llm.remote.*` dans le manifeste `package.json`.

## Secrets

Ne pas placer de tokens dans les settings partagés.  
Utiliser exclusivement **Set Connection Token / Password**.
