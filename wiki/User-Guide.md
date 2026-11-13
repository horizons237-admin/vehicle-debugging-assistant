# Guide utilisateur

## Interface VS Code

Conteneur d’activité **Vehicle Debug** (icône véhicule) :

| Vue | Rôle |
|-----|------|
| **DTCs** | Codes défaut, statut, sévérité, freeze frames |
| **Errors Analysis** | Erreurs classifiées (catégorie, ASIL, source) |
| **Session & Status** | Connexion, session UDS, transport |
| **Connections** | État Jira / Confluence / CodeBeamer / LLM |

La **barre d’état** indique l’état de connexion ECU (cliquable).

## Workflows recommandés

### 1. Diagnostic ECU

1. `Connect to ECU` (CAN, DoIP ou simulation)
2. `Read DTCs` → examiner freeze frames
3. Optionnel : `AI: Analyze This DTC`
4. Optionnel : `Create Ticket from DTC`

### 2. Analyse de trace

1. `Open Sample Trace Log` ou `Analyze Log File`
2. Examiner **Errors Analysis**
3. `Show Analysis Report` (webview HTML)
4. Optionnel : export Confluence

### 3. ARXML + CI/CD

1. `Analyze ARXML (DEM/DCM/DTC)`
2. `Import CI/CD Analysis Report` (JSON)
3. `AI: Analyze All Errors & DTCs`
4. Création de tickets ALM

## Mode simulation vs réel

| Condition | Comportement |
|-----------|--------------|
| `vehicleDebug.transport` = `simulation` | Toujours simulation |
| Libs CAN absentes | Fallback simulation + message |
| Transport `can` / `doip` + libs OK | Chemin réel |

Les réponses JSON Python exposent `"mode": "simulation" | "real"`.
