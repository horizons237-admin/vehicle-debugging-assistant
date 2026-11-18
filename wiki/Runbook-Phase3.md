# Runbook Phase 3 — Déchiffrage

**De la trace brute au réseau de preuves** · analysis-only · lab automobile

Prérequis : session lab ouverte **ou** log chargé · Self Diagnostic OK · pas de flash / WriteMsgs.

Voir aussi : [Plan d’architecte](Plan-Architecte) · [Guide utilisateur](User-Guide) · [Commandes](Commands) · [Safety](Safety)

---

## Checklist 1 page (imprimable)

```
[ ] 0  Self Diagnostic OK — transport labellisé (sim / hardware / log)
[ ] 1  Read DTCs (+ freeze frames si dispo)
[ ] 2  Status / DID clés  ·  multi-ECU si besoin
[ ] 3  Log ASC / BLF·MDF4 probe si pas de live
[ ] 4  DBC / labels (lexique)
[ ] 5  Vehicle Health  →  Triage (règles JSON)
[ ] 6  Session Timeline
[ ] 7  Anomaly baseline  ·  Diff health snapshots
[ ] 8  H1 / H0 formulés  ·  (AI Analyze optionnel, après les faits)
[ ] 9  Accord inter-analystes (mêmes DTC top / mêmes rules)
[ ]10  Couverture MOS : couvert / partiel / non démontré
[ ]11  Export Report ou Incident/Partner Pack (VIN redact si besoin)
[ ]12  Source labellisée + disclaimer analysis-only dans le livrable
```

**Séquence type : 15–25 min**

```
Self Diagnostic
  → Read DTCs (+ freeze)
  → Status / DID
  → (Log si besoin)
  → Vehicle Health → Triage
  → Session Timeline
  → Anomaly + Diff snapshots
  → (AI Analyze optionnel)
  → Export Report / Pack
```

---

## 0. Pré-vol

| Étape | Commande / action | Attendu |
|-------|-------------------|----------|
| 1 | **Vehicle Debugging: Self Diagnostic** | Modules OK / warnings connus |
| 2 | Vérifier transport | Simulation **ou** log **ou** DoIP / J2534 **labellisé** |
| 3 | Noter le contexte | VIN (ou redact), ECU cible, requirement MOS visé |

Self-diag rouge sur un module critique → corriger **avant** de déchiffrer.

---

## 1. Collecte ciblée (corpus)

| # | Commande (palette) | Usage |
|---|--------------------|--------|
| 1.1 | **Read DTCs** / Read DTC Information | Liste codes + statut |
| 1.2 | Freeze frames (extended / provider) | Contexte au moment du défaut |
| 1.3 | **Read DID** / Status signals | Santé, readiness |
| 1.4 | Import / open **ASC** (ou BLF/MDF4 probe) | Trace bus si pas de live |
| 1.5 | **Multi-ECU** targets | Ne pas limiter à un seul nœud trop tôt |

**Sortie minimale :** DTC list + au moins une source de contexte (DID **ou** log).

---

## 2. Normalisation & lexique

| # | Action | Note |
|---|--------|------|
| 2.1 | Décoder / annoter | Load **DBC** si signaux CAN |
| 2.2 | Labels DTC | J2012 / textes OEM si configurés |
| 2.3 | Aligner le temps | Timestamps log ↔ session |

Ne pas interpréter encore : rendre les données **comparables**.

---

## 3. Synthèse Health & triage

| # | Commande | Produit |
|---|----------|----------|
| 3.1 | **Vehicle Health** / snapshot | Vue consolidée (DTC + errors + status) |
| 3.2 | **Triage** (règles JSON) | Priorisation sévérité / familles |
| 3.3 | Noter top-N | 3–7 findings max pour le FO |

Si Health et liste DTC divergent → relancer Read DTCs, vérifier session active.

---

## 4. Temporalité & anomalies

| # | Commande | Question |
|---|----------|----------|
| 4.1 | **Session Timeline** | Ordre : connect → event → DTC ? |
| 4.2 | **Anomaly** / baseline | Hors normal lab ? |
| 4.3 | **Diff health snapshots** | Avant / après : qu’est-ce qui a changé ? |

Ordre recommandé : **Timeline → Anomaly → Diff**.

---

## 5. Hypothèses de travail (H1 / H0)

1. **H1** : *« Ce pattern explique le symptôme / le gap MOS. »*  
2. **H0** : *« Aucun lien démontrable dans ce corpus. »*  
3. Timeline + Diff pour **ordre temporel** et **co-variation**.  
4. AI **uniquement** après faits structurés.

| # | Commande | Garde-fou |
|---|----------|----------|
| 5.1 | **AI Analyze** (opt-in) | Indicatif ; **pas** de verdict ASIL |
| 5.2 | Confronter AI ↔ triage rules | Divergence → rules versionnées + trace |

---

## 6. Accord inter-analystes

| # | Action | Critère |
|---|--------|----------|
| 6.1 | 2ᵉ revue sur le **même** log/session | Mêmes DTC top |
| 6.2 | Rejouer triage avec **mêmes** rules JSON | Même classement |
| 6.3 | FO : couverture requirement ? | Couvert / partiel / **non démontré** |

Documenter explicitement **non démontré** (autant de valeur qu’un finding positif).

---

## 7. Condensation → livrable

| # | Commande | Contenu |
|---|----------|----------|
| 7.1 | **Export Report** | Findings + timeline + limites |
| 7.2 | **Incident Pack** / Partner Pack | Preuves + redact VIN si gouvernance |
| 7.3 | (Option) Confluence / ticket | Lien requirement MOS |

**Checklist livrable**

- [ ] Top findings (sévérité + ECU)  
- [ ] Liens temporels  
- [ ] H1 / H0 explicites  
- [ ] Couverture MOS (couvert / partiel / non démontré)  
- [ ] Source labellisée (sim / hardware / log)  
- [ ] Disclaimer analysis-only  

---

## Anti-patterns

| À éviter | Pourquoi |
|----------|----------|
| Clear DTC avant export | Perte de preuve |
| AI avant faits structurés | Narrative sans ancrage |
| Un seul ECU alors que multi-bus | Cause confondue |
| Confondre Health vert et MOS OK | La **preuve** construit le statut (modèle formatif) |
| Mélanger sim et hardware sans label | Validité écologique cassée |

---

## Mapping palette (Phase 3)

| Intention | Noms typiques |
|-----------|----------------|
| Codes | Read DTCs, extended DTC |
| Santé | Vehicle Health, Triage |
| Temps | Session Timeline |
| Écart | Anomaly, Diff snapshots |
| Aide | AI Analyze |
| Preuve | Export Report, Incident / Partner Pack |

Préfixe palette : **Vehicle Debugging:** — détail dans [Commands](Commands).

---

## Sortie vers Phase 4

Le runbook Phase 3 s’arrête quand le **pack/report** est prêt à être défendu devant le FO (traces + requirements), pas quand « on a une intuition ».

→ [Runbook Phase 4 — Envol](Runbook-Phase4) · [Plan d’architecte](Plan-Architecte)
