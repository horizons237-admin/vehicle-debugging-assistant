# Runbook Phase 4 — Envol

**Rayonnement et défense du dossier** · analysis-only · lab → FO / ALM

Prérequis : livrable Phase 3 prêt (findings + H1/H0 + couverture MOS) — voir [Runbook Phase 3](Runbook-Phase3).

Voir aussi : [Plan d’architecte](Plan-Architecte) · [Guide utilisateur](User-Guide) · [Commandes](Commands) · [Safety](Safety) · [Connexions](Connections)

---

## Checklist 1 page (imprimable)

```
[ ] 0  Phase 3 terminée (report/pack interne OK)
[ ] 1  Data Governance Panel — scopes & VIN redact
[ ] 2  Governance: Self-Test Scopes (audit output)
[ ] 3  Choisir le canal : Report | Partner Pack | Incident Pack | Ticket | Confluence
[ ] 4  Export Health Snapshot (MD/JSON) si besoin d’annexe
[ ] 5  Export Report / Partner Data Pack / Lab Incident Pack
[ ] 6  (Option) Create Ticket from Error/DTC (Jira / CodeBeamer)
[ ] 7  (Option) Export Report to Confluence
[ ] 8  (Option) Import CI/CD Analysis Report — corréler pipeline ↔ lab
[ ] 9  Labeller source : sim | hardware | log
[ ]10  Disclaimer analysis-only visible dans chaque artefact
[ ]11  Brief FO : 20–30 min Trace → Health → preuve → MOS
[ ]12  Archiver pack + lien requirement (traçabilité)
```

**Séquence type : 10–20 min (export) + 20–30 min (défense FO)**

```
Governance Panel / Self-Test Scopes
  → Export Health Snapshot (annexe)
  → Export Report  OU  Partner Pack  OU  Incident Pack
  → (Ticket Jira/CodeBeamer)
  → (Confluence)
  → (CI import si pipeline)
  → Brief FO / archive
```

---

## 0. Entrée depuis Phase 3

| Attendu | Détail |
|---------|--------|
| Findings ordonnés | Sévérité + ECU, top 3–7 |
| Timeline | connect → event → DTC |
| H1 / H0 | Explicites |
| Couverture MOS | Couvert / partiel / **non démontré** |
| Source labellisée | sim / hardware / log |

Sans cela → retour [Runbook Phase 3](Runbook-Phase3).

---

## 1. Gouvernance avant tout export

| # | Commande | Pourquoi |
|---|----------|----------|
| 1.1 | **Data Governance Panel** | Politique scopes (quoi peut sortir) |
| 1.2 | **Governance: Self-Test Scopes** | Audit Output — vérifier avant envoi partner |
| 1.3 | VIN redact | Activer si pack hors lab strict |

**Règle :** aucun Partner / Confluence / ticket sans passage gouvernance si données véhicule réelles.

---

## 2. Choisir le canal de diffusion

| Canal | Commande | Public | Usage |
|-------|----------|--------|--------|
| **Report lab** | Show Analysis Report · Export Health Snapshot | Lab / archive | Preuve interne |
| **Partner Pack** | **Export Partner Data Pack** | quality / aftersales / safety | Export cadré scopes |
| **Incident Pack** | **Export Lab Incident Pack** | Dev lab | Pack incident (pas eCall) |
| **Ticket** | **Create Ticket from Error/DTC** | Jira / CodeBeamer | Suivi requirement / bug |
| **Confluence** | **Export Report to Confluence** | Wiki projet | Page lisible FO |
| **CI** | **Import CI/CD Analysis Report** | Pipeline ↔ lab | Corrélation automatisée |

Un dossier FO peut combiner : **Pack + Ticket + lien Confluence**.

---

## 3. Exports concrets

### 3.1 Health Snapshot

| Commande | Format | Rôle |
|----------|--------|------|
| **Export Health Snapshot** | MD / JSON | Annexe technique, diff ultérieur |

### 3.2 Partner Data Pack

| Commande | Notes |
|----------|--------|
| **Export Partner Data Pack** | Choisir audience (quality / aftersales / safety) · respecter scopes gouvernance |

### 3.3 Lab Incident Pack

| Commande | Notes |
|----------|--------|
| **Export Lab Incident Pack** | Pack **dev/lab** — **pas** un eCall, **pas** VSOC |

### 3.4 ALM

| Commande | Notes |
|----------|--------|
| **Create Ticket from Error/DTC** | Lier finding → ticket ; coller couverture MOS |
| **Export Report to Confluence** | Page avec disclaimer analysis-only |
| **Configure Connections…** / Test | Si auth manquante |

### 3.5 CI

| Commande | Notes |
|----------|--------|
| **Import CI/CD Analysis Report** | JSON schema VDA — rapproche pipeline et findings lab |

---

## 4. Anatomie du dossier « défendable »

```
Problématique lab/MOS
  → Cadre (standards, safety boundary)
  → Modèle (session, health, triage)
  → Cas (trace → findings)
  → H1 / H0 + couverture MOS
  → Limites analysis-only
  → Artefacts (pack, ticket, page)
```

**Norme minimale d’un pack exporté**

- [ ] Top findings + ECU  
- [ ] Timeline ou horodatage  
- [ ] Couverture MOS (y compris *non démontré*)  
- [ ] Source (sim / hardware / log)  
- [ ] Disclaimer : pas ASIL confirm, pas flash, analysis-only  
- [ ] VIN redact si hors lab  

---

## 5. Défense face au FO (20–30 min)

| Cercle | Message |
|--------|----------|
| **Soi** | Limites connues : pas confirmation ASIL, pas contrôle véhicule |
| **Contexte** | Lab vs prod · sim vs hardware (label visible) |
| **Auditoire FO** | Traces + **requirements** — pas une démo gadget |
| **Manager** | Time-to-finding, reproductibilité, archive |

**Trame de brief**

1. Contexte MOS / question (1 min)  
2. Trace → DTC / Health (5–8 min)  
3. H1 vs H0 + ce qui **manque** (5 min)  
4. Artefact (pack / ticket) + next steps (3 min)  
5. Q/R limites analysis-only (reste)

**Ne jamais vendre le contrôle véhicule.** La valeur = **preuve d’analyse** + **statut de couverture requirement**.

---

## 6. Post-export / archive

| # | Action |
|---|--------|
| 6.1 | Stocker pack + SHA / date dans l’espace projet |
| 6.2 | Lier ticket ↔ requirement MOS (ID) |
| 6.3 | Si rejeu : Diff health snapshots (Phase 3) sur nouvelle session |
| 6.4 | Mettre à jour baseline anomaly si le cas devient « normal lab » |

---

## Anti-patterns Phase 4

| À éviter | Pourquoi |
|----------|----------|
| Export partner sans Governance | Fuite VIN / hors scope |
| Ticket sans H0 / « non démontré » | Sur-promesse de cause |
| Confondre Incident Pack et eCall | Périmètre safety |
| Brief FO = liste brute de DTC | Pas de couverture MOS |
| Oublier le label sim vs hardware | Validité contestable |

---

## Mapping palette (Phase 4)

| Intention | Commandes |
|-----------|----------|
| Gouvernance | Data Governance Panel, Self-Test Scopes |
| Snapshot | Export Health Snapshot, Show Analysis Report |
| Packs | Export Partner Data Pack, Export Lab Incident Pack |
| ALM | Create Ticket from Error/DTC, Export Report to Confluence |
| CI | Import CI/CD Analysis Report |
| Config | Configure Connections…, Test Selected Connection |

Préfixe : **Vehicle Debugging:** — détail [Commands](Commands).

---

## Boucle de la connaissance

```
Épistémologie (analysis-only)
        ↻
Méthodologie  ←→  Analyse (Phase 3)
        ↻
Communication (Phase 4 : packs, tickets, FO)
```

La release et les packs ne sont que des **itérations** de l’architecte — chaque export doit rester fidèle à la limite analysis-only.

---

## Liens

| Ressource | |
|-----------|--|
| Phase 3 | [Runbook Phase 3](Runbook-Phase3) |
| Plan | [Plan d’architecte](Plan-Architecte) |
| Safety | [Safety](Safety) |
| Connexions ALM | [Connections](Connections) |
| Releases | https://github.com/horizons237-admin/vehicle-debugging-assistant/releases |
