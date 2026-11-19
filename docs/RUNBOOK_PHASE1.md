# Runbook Phase 1 — Fondations (Incubation)

**Code source du produit lab** · analysis-only · avant toute collecte

Objectif : outillage prêt, posture safety claire, session workspace saine — **sans** lire le bus métier.

Voir aussi : [Plan d’architecte](Plan-Architecte) · [Safety](Safety) · [Configuration](Configuration) · [Smoke Extension Host](Smoke-Extension-Host)

---

## Checklist 1 page (imprimable)

```
[ ] 0  Repo / VSIX 0.2.9 · npm install · npm run compile
[ ] 1  F5 Extension Development Host (ou VSIX installé)
[ ] 2  Settings vehicleDebug.* (pythonPath, transport=simulation)
[ ] 3  (Win) j2534.pythonPath32 / libraryPath si DLL OEM prévue
[ ] 4  Run Self Diagnostic → backends present · Safety analysis-only
[ ] 5  Smoke 10 commandes (voir Smoke-Extension-Host) — ou planifié
[ ] 6  Data Governance Panel — scopes connus
[ ] 7  Triage rules : Open / Create (sample ou projet)
[ ] 8  Connections : Jira/Confluence/LLM seulement si besoin (tokens SecretStorage)
[ ] 9  Lire Safety.md + NREQ (pas ASIL, pas flash, pas eCall)
[ ]10  Labeller le mode de travail : sim | log-only | hardware-later
[ ]11  Noter OS, VS Code, Python path dans le journal lab
[ ]12  Sortie Phase 1 = « ready for Exploration » (Phase 2)
```

**Séquence type : 10–20 min**

```
Install / F5
  → Settings (python, transport=simulation)
  → Self Diagnostic
  → (Smoke checklist)
  → Governance + triage rules
  → Lire Safety
  → Go Phase 2
```

---

## 0. Environnement

| Étape | Action | Attendu |
|-------|--------|----------|
| 0.1 | `npm install && npm run compile` | Build OK |
| 0.2 | **F5** ou installer VSIX `v0.2.9-*` | Host sans erreur critique |
| 0.3 | Activity Bar → **Vehicle Debug** | Vues DTC / Health / Session / Self-diag |

---

## 1. Configuration minimale

| Setting | Valeur lab typique |
|---------|-------------------|
| `vehicleDebug.pythonPath` | `python3` ou chemin venv |
| `vehicleDebug.transport` | `simulation` (Phase 1–2 par défaut) |
| `vehicleDebug.j2534.pythonPath32` | Python 32-bit si J2534 Windows plus tard |
| `vehicleDebug.j2534.libraryPath` | vide jusqu’à Phase 2 hardware |
| `vehicleDebug.llm.allowRemoteDataUpload` | **false** |

Commande : **Configure Connections…** seulement si ALM requis (sinon skip).

---

## 2. Self-diagnostic (critère de sortie)

| Commande | Critère pass |
|----------|----------------|
| **Run Self Diagnostic** | Scripts backends `present` |
| | Item **Analysis-only posture** visible |
| | J2534 = skip hors Windows, ou discover OK |
| | Pas d’`error` bloquant sur UDS/OBD sim si deep |

Export optionnel : **Export Self Diagnostic Report**.

---

## 3. Gouvernance & règles

| Commande | Pourquoi en Phase 1 |
|----------|---------------------|
| **Data Governance Panel** | Savoir ce qui pourra sortir en Phase 4 |
| **Open / Create Triage Rules** | Même rules = comparabilité Phase 3 |
| SecretStorage tokens | Jamais en clair dans settings |

---

## 4. Frontière safety (non négociable)

| Interdit | Autorisé |
|----------|----------|
| Flash, WriteMsgs, Security Access | Read DTCs / DID / logs |
| Contrôle véhicule / immobilizer | Simulation, mock DoIP |
| Confirmation ASIL | Scoring **indicatif** seulement |
| eCall / VSOC | Incident pack **lab** |

→ [Safety](Safety) · NREQ-001…004 dans docs/REQUIREMENTS.md

---

## Anti-patterns Phase 1

| À éviter | Pourquoi |
|----------|----------|
| Brancher hardware avant Self-diag vert | Debug environnement confondu avec défaut véhicule |
| Activer LLM remote + upload | Données lab exposées |
| Ignorer scripts `missing` | Packaging / path cassé |
| Promettre ASIL au FO dès l’install | Hors scope produit |

---

## Sortie vers Phase 2

Phase 1 OK quand : **Self-diag acceptable** + **transport labellisé** + **safety lue**.

→ [Runbook Phase 2 — Exploration](Runbook-Phase2)
