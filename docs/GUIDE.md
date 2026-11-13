# Vehicle Debugging Assistant — Guide utilisateur

Extension Visual Studio Code pour l'analyse d'erreurs dans le développement automobile (UDS, OBD-II, AUTOSAR, DoIP, ISO 26262).

**Version 0.1.0** · [Dépôt GitHub](https://github.com/horizons237-admin/vehicle-debugging-assistant)

Documents associés (générés localement) :
- `Vehicle_Debugging_Assistant_Guide.docx` — guide Word professionnel
- `Vehicle_Debugging_Assistant_Presentation.pptx` — présentation 14 slides

---

## 1. Introduction et objectifs

Vehicle Debugging Assistant regroupe dans VS Code : diagnostics UDS/OBD-II, analyse de traces CAN, parsing ARXML (DEM/DCM), import de rapports CI/CD, assistance par LLM, tickets ALM (Jira, CodeBeamer) et export Confluence.

**Objectifs**
- Centraliser le diagnostic et l'analyse dans l'IDE
- Prioriser la compréhension des erreurs (pas de correction automatique non qualifiée)
- Contexte safety-critical (ISO 26262) : estimation ASIL, traçabilité, mode simulation explicite
- Travail sans hardware via mode simulation riche

## 2. Prérequis et installation

- Visual Studio Code ≥ 1.85
- Node.js 18+ et Python 3.8+
- Optionnel (mode réel CAN) : `python-can`, `udsoncan`, `can-isotp`

```bash
git clone https://github.com/horizons237-admin/vehicle-debugging-assistant.git
cd vehicle-debugging-assistant
npm install && npm run compile
# F5 dans VS Code → Extension Development Host
```

## 3. Interface VS Code

Conteneur d'activité **Vehicle Debug** (icône voiture) :

| Vue | Rôle |
|-----|------|
| **DTCs** | Codes, statut, sévérité, freeze frames |
| **Errors Analysis** | Erreurs classifiées (catégorie, ASIL, source) |
| **Session & Status** | Connexion, session UDS, CAN TX/RX |
| **Connections** | Jira, Confluence, CodeBeamer, LLM |

Barre de statut : clic pour connecter / déconnecter.

## 4. Commandes principales

| Commande | Description |
|----------|-------------|
| Connect / Disconnect ECU | Session CAN, DoIP ou simulation |
| Read / Clear DTCs | Lecture freeze frames ; effacement |
| Read DID | VIN, part number, versions |
| Analyze Log File | NRC, timeout, WdgM, MISRA, DEM/FiM |
| Analyze ARXML | DEM events, DTC, services |
| Import CI/CD Report | JSON errors / dtcs / issues |
| Show Analysis Report | Webview HTML |
| AI Analyze… | LLM local ou distant |
| Create Ticket | Jira VWIF/DevStack ou CodeBeamer |
| Export to Confluence | Page storage ou wiki |
| DoIP Discovery | UDP discovery / simulation |
| Configure Connections | Assistant + secrets |

## 5. Architecture

```
┌─────────────────────────────────────────────┐
│  VS Code (TypeScript)                       │
│  commands · providers · webviews · secrets  │
├─────────────────────────────────────────────┤
│  Orchestration                              │
│  ConnectionManager · LlmClient · PythonRunner│
├─────────────────────────────────────────────┤
│  Python backends                            │
│  uds_client · doip · log_analyzer · arxml   │
│  CAN / ISO-TP / DoIP / simulation           │
└─────────────────────────────────────────────┘
```

**Flux** : Commande → handler TS → PythonRunner (JSON stdin/stdout) → classification → TreeViews.

## 6. Workflows

1. **Diagnostic ECU** : Connect → Read DTCs → freeze frames → AI (opt.) → Ticket  
2. **Trace** : Sample log → Analyze Log → Report → Confluence  
3. **ARXML / CI** : Analyze ARXML → Import CI JSON → AI Analyze All → Ticket  

## 7. Connexions externes

- **ALM** : Jira VWIF / DevStack, CodeBeamer  
- **Docs** : Confluence VWIF / DevStack  
- **AI** : LLM local (Ollama, LM Studio) ou remote (OpenAI, Azure, Anthropic)

Secrets uniquement via **Set Connection Token / Password** (Secret Storage).

## 8. Configuration

Settings `vehicleDebug.*` : `pythonPath`, `canInterface`, `txId`/`rxId`, `transport`, `doip.*`, `jira.*`, `confluence.*`, `codebeamer.*`, `llm.*`, `enableSafetyClassification`.

## 9. Simulation vs réel

Sans libs CAN ou `transport=simulation` → mode simulation (DTC/DID démo). Réponses indiquent `mode: simulation|real`.

## 10. Safety

- Outil orienté **analyse** (pas d'écriture flash non contrôlée)
- ASIL **indicatif** — validation experts safety
- Evidence dans tickets ALM
- Qualifier la chaîne d'outils pour process formel

## 11. Dépannage

- Not connected → Connect to ECU  
- Python fail → vérifier `pythonPath` et `src/python/`  
- LLM → activer local/remote + token  
- 401 ALM → régénérer token  

## 12. Références

- ISO 14229 (UDS), ISO 13400 (DoIP), ISO 15031 (OBD), AUTOSAR DEM/DCM, ISO 26262
