# Runbook Phase 2 — Exploration

**Sonder le terrain diagnostic** · collecte corpus · analysis-only

Prérequis : [Runbook Phase 1](Runbook-Phase1) OK (Self-diag, settings, safety).

Voir aussi : [Plan d’architecte](Plan-Architecte) · [J2534](J2534) · [Commands](Commands) · [Runbook Phase 3](Runbook-Phase3)

---

## Checklist 1 page (imprimable)

```
[ ] 0  Phase 1 OK · transport choisi et labellisé
[ ] 1  Connect to ECU (simulation)  — ou OBD connect lab
[ ] 2  (Option) Multi-ECU : Add / Select Active ECU
[ ] 3  DoIP: Vehicle Discovery (lab) si réseau diagnostic
[ ] 4  J2534: Discover Drivers (Win) · Probe analysis-only si libraryPath
[ ] 5  Read DTCs smoke · Read DID / Status (corpus minimal)
[ ] 6  OBD Mode 03/09 si applicable
[ ] 7  Log : Open Sample / Parse ASC / Probe BLF·MF4
[ ] 8  Load DBC (si signaux) · Analyze CAN Flow (option)
[ ] 9  ARXML / ODX lab si defs disponibles
[ ]10  SOVD discover / Remote diagnostics mock (option)
[ ]11  Label source sur chaque artefact : sim | log | hardware
[ ]12  Corpus minimal prêt → aller Phase 3 (ne pas sur-interpréter ici)
```

**Séquence type : 15–30 min**

```
Connect (sim)
  → (DoIP / J2534 discover)
  → Read DTCs + Status
  → Logs ASC/BLF/MF4 selon dispo
  → (DBC / CAN flow)
  → Labeller sources
  → Phase 3 Déchiffrage
```

---

## 0. Choisir le mode d’exploration

| Mode | Commandes typiques | Validité |
|------|-------------------|----------|
| **Simulation** | Connect to ECU (sim) | Reproductible, pas écologique véhicule |
| **Log-only** | Parse ASC, Probe/Decode BLF·MF4, Analyze Log | Dépend qualité du fichier |
| **Hardware lab** | DoIP / J2534 / CAN interface | Label **hardware** ; toujours analysis-only |

Ne **pas** mélanger sim et hardware dans le même dossier sans label.

---

## 1. Session & cibles

| # | Commande | Attendu |
|---|----------|----------|
| 1.1 | **Connect to ECU** | Session connected / simulation |
| 1.2 | **Add ECU Target** / **Select Active ECU** | Multi-nœud si besoin |
| 1.3 | **Set Vehicle VIN / ID** ou Read VIN | Identité lab (redact plus tard) |

---

## 2. Découverte transports (lab)

| # | Commande | Notes |
|---|----------|--------|
| 2.1 | **DoIP: Vehicle Discovery** | Lab / mock ; pas prod fleet |
| 2.2 | **J2534: Discover Drivers** | Windows registry ; Linux = unsupported |
| 2.3 | **J2534: Probe Library** | Open / ReadVersion / Close **only** |
| 2.4 | **D-PDU Status** / **J2534 Status** | Stubs informatifs |

Rappel démo : *J2534 ne fait pas de trafic bus métier dans VDA 0.2.9.*

---

## 3. Collecte corpus minimal

| # | Commande | Produit |
|---|----------|----------|
| 3.1 | **Read DTCs** | Liste codes |
| 3.2 | **Read Vehicle Status** / **Read DID** | Contexte |
| 3.3 | **OBD-II: Read DTCs / VIN / Mode 09** | Si OBD lab |
| 3.4 | **Parse ASC** / **Analyze ASC** | Trace texte |
| 3.5 | **Probe BLF/MF4** / **Decode** | Selon deps |
| 3.6 | **Open Sample Trace Log** | Sanity path |

**Sortie minimale Phase 2 :** au moins (DTCs **ou** log) + label source.

---

## 4. Lexique & structure (préparation Phase 3)

| # | Commande | Rôle |
|---|----------|------|
| 4.1 | **Load DBC Symbols** | Noms signaux |
| 4.2 | **Analyze CAN Bus Flow** | IDs, paires UDS |
| 4.3 | **Analyze ARXML** / **Load ODX** | Définitions DTC |
| 4.4 | **SOVD: Discover** / **Pull Remote Diagnostics** | Lab / mock |

Pas d’H1/H0 formalisés ici — c’est la Phase 3.

---

## Anti-patterns Phase 2

| À éviter | Pourquoi |
|----------|----------|
| Clear DTC avant export corpus | Perte de preuve |
| Interpréter root-cause trop tôt | Sauter le Déchiffrage |
| Probe J2534 = « bus OK » | Seulement version DLL |
| Un seul log sans timestamp | Timeline Phase 3 impossible |
| Hardware sans Self-diag préalable | Environnement vs véhicule |

---

## Mapping palette (Phase 2)

| Intention | Commandes |
|-----------|----------|
| Session | Connect, Multi-ECU, VIN |
| Découverte | DoIP discover, J2534 discover/probe |
| Codes / status | Read DTCs, Status, OBD |
| Logs | ASC, BLF/MF4, Analyze Log, CAN flow |
| Défs | DBC, ARXML, ODX, J2012 |

---

## Sortie vers Phase 3

Corpus **labellisé** prêt → [Runbook Phase 3 — Déchiffrage](Runbook-Phase3)  
(Health, Triage, Timeline, H1/H0, couverture MOS)

Puis diffusion : [Runbook Phase 4 — Envol](Runbook-Phase4)
