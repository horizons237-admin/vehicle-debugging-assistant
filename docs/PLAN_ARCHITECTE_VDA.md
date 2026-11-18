# LE PLAN D'ARCHITECTE DU VEHICLE DEBUGGING ASSISTANT

**Concevoir, bâtir et défendre un outil d'analyse automobile safety-critical**

| Paradigme | Méthodologie | Finalité |
|-----------|--------------|----------|
| **Sciences de l'artificiel** (artefact lab) | **Architecture de l'information diagnostic** | **Masterclass opérationnelle** pour lab, FO, MOS |

---

## INTRODUCTION — De la Chrysalide au Papillon : Le Cycle de Vie du Produit

| Phase | Nom | Contenu VDA |
|-------|-----|-------------|
| **1. Incubation** | Fondations et design | Safety boundary, posture analysis-only, stack VS Code + Python |
| **2. Exploration** | Terrain et collecte | CAN / UDS / OBD / DoIP / J2534 / logs ASC·BLF·MDF4 |
| **3. Déchiffrage** | Analyse et synthèse | DTC, Health, Triage, Anomaly, Timeline, Trace |
| **4. Envol** | Artefacts et diffusion | Reports, Incident/Partner packs, VSIX, Wiki, FO value |

### Métaphore produit

| Stade | Diagnostic terrain | VDA |
|-------|-------------------|-----|
| **Larve** | Question floue : *« Pourquoi l’ECU ne répond pas ? »* | Données brutes dispersées (logs, DTC, DID) |
| **Chrysalide** | Terrain + standards forcent un recentrage | Pipeline unifié : session → decode → triage → preuve |
| **Papillon** | Question actionnable | *« Quelles preuves de conformité / de cause pour ce MOS requirement ? »* |

---

## PHASE 1 | FONDATIONS — Le Code Source du Produit

### 1.1 Matrice épistémologique (posture produit)

| | **Positivisme lab** (mesure) | **Constructivisme lab** (sens) |
|--|------------------------------|--------------------------------|
| **Ontologie** | Le bus et les DTCs existent indépendamment de l’outil | Le *sens* du défaut dépend du contexte session / MOS |
| **Logique** | Déductive : NRC → cause connue | Abductive : pattern de traces → hypothèse à vérifier |
| **Objectif** | Expliquer, reproduire, vérifier | Comprendre, interpréter, co-construire le dossier de preuve |
| **Posture** | L’ECU est isolable (simulation, vcan) | L’interaction lab / véhicule / FO est inévitable |

**Choix VDA :** hybride contrôlé — **mesure objective** des trames et DTCs + **interprétation guidée** (triage, ASIL *indicatif*, AI assist) **sans** prétendre à une confirmation ASIL.

### 1.2 Sciences de l’artificiel (H.A. Simon) appliquées au VDA

| Pilier | Application VDA |
|--------|-----------------|
| **Synthèse humaine** | L’extension est un artefact bâti pour le lab, pas un phénomène naturel |
| **Imitation** | Simulation UDS/OBD/DoIP imite le terrain sans substance véhicule |
| **Téléologie** | But explicite : *analyse et preuve*, pas contrôle véhicule |
| **Prescription** | Safety banner, analysis-only, interdits (WriteMsgs, flash, eCall) |

**Postulat fondamental :** le diagnosticien n’est pas inerte — conscience, biais, gouvernance des données (VIN redact, scopes export).

### 1.3 Architecture des « hypothèses » lab (modèle de travail)

```
Standards (ISO 14229, J1979, J2534…)
        ↓
Concepts (session, DTC, DID, health, MOS requirement)
        ↓
Propositions (ex. : ce pattern de freeze-frame indique…)
        ↓
Hypothèses de travail (à confirmer / infirmer en lab)
        ↓
Indicateurs mesurables (codes, PIDs, signaux, métriques anomaly)
```

| Test double (esprit lab) | |
|--------------------------|--|
| **H1** | Le scénario MOS / la cause suspectée explique le trace |
| **H0** | Aucun lien démontrable — documenter l’absence de preuve autant que la preuve |

### 1.4 Crible de validité (qualité des mesures lab)

| Niveau | VDA |
|--------|-----|
| **Validité faciale / contenu** | Couverture UDS 0x19, OBD Modes, formats de log documentés |
| **Validité de construit** | Health / triage cohérents entre DTC, erreurs log, status DIDs |
| **Validité critère** | Corrélation CI report ↔ findings lab ; partner pack exploitable |
| **Fiabilité** | Self-diagnostic, tests pytest, runs reproductibles en simulation |
| **Validité écologique** | Simulation ≠ véhicule ; J2534 probe = Open/ReadVersion/Close seulement |

---

## PHASE 2 | EXPLORATION — Sonder le Terrain Diagnostic

### 2.1 Continuum des « entretiens » avec l’ECU

| Mode | Ouverture | Usage VDA |
|------|-----------|-----------|
| **Phénoménologique** | Totale | Lecture libre de log ASC/BLF, observation brute |
| **Non-directif** | Empathique au bus | Découverte DoIP / SOVD, scan registry J2534 |
| **Semi-directif** | Guide flexible | Session UDS ciblée, DID list, Mode 09, readiness |
| **Structuré** | Forte | Scripts connect / read_dtcs / clear (lab), CI watch |

**Arsenal des relances (lab) :**

| Type | Exemple |
|------|---------|
| Simple | Rejouer le même 0x19 |
| Différée | « Plus tôt le NRC 0x78… » → corréler timeline |
| Interprétative | Reformuler : health top-N + hypothesis MOS |

### 2.2 Dynamiques collectives (sources de vérité)

| Dispositif | Analogue VDA |
|------------|--------------|
| **Focus group** | Multi-ECU targets, confrontation TX/RX |
| **Delphi** | Itérations CI report + re-import jusqu’à stabilisation |
| **Nominal** | Ranking health / triage rules sans biais de discussion |
| **Brainstorm** | Anomaly baseline, partner pack contenu brut |

### 2.3 Techniques « projectives » — percer les écrans du terrain

Écrans typiques : conscience incomplète du log, rationalisation a posteriori, normes OEM, politesse outillage.

| Technique | VDA |
|-----------|-----|
| Image ambiguë (TAT) | Trace partiel → reconstruction assistée |
| Métaphores (ZMET) | DBC symbols, annotation sémantique du bus |
| Psychodrame | Simulation session sans enjeu véhicule réel |

### 2.4 Ingénierie de la collecte (quantitatif lab)

| Instrument | Rôle |
|------------|------|
| Likert-like | Sévérité triage / confidence anomaly (échelles produit) |
| Différentiel | Simulation ↔ hardware, mock ↔ remote diagnostics |
| Point neutre | `unsupported_os`, `skip` self-diag : ne pas forcer un faux positif |

### 2.5 Contrôle de causalité (héritage Mill, adapté lab)

Pour affirmer *X contribue à Y* dans un dossier MOS :

1. **Variation concomitante** — signal / DTC et symptôme co-varient dans le trace  
2. **Ordre temporel** — timeline session (connect → event → DTC)  
3. **Isolement** — simulation / canaux séparés / multi-ECU pour réduire causes confondues  

**Carré latin lab :** croiser transport (CAN / DoIP / sim), session, et jeu de logs pour neutraliser le biais d’apprentissage outil.

### 2.6 Artefacts humains (biais lab)

| Rôle | Risque | Mitigation VDA |
|------|--------|----------------|
| Saboteur | Rejeter toute sim | Traces réels + sim explicitement labellisés |
| Bon élève | Sur-confiance AI | AI = aide ; safety disclaimer permanent |
| Anxieux | Sous-déclarer findings | Audit log, packs anonymisables |
| Naïf idéal | Suit le runbook | User-Guide + self-diagnostic |

---

## PHASE 3 | DÉCHIFFRAGE — De la Trace Brute au Réseau de Preuves

### 3.1 Raffinerie qualitative (de la voix du bus au réseau)

```
Corpus brut (ASC / BLF probe / DTC list / DID dump)
        ↓
Normalisation (ISO-TP, timestamps, endianness doc)
        ↓
Lexique réduit (DBC, J2012, ODX labels)
        ↓
Réseau sémantique (health links, timeline, anomaly edges)
```

**Hapax lab :** un NRC rare ou un DID inattendu peut valoir plus qu’un flood de trames banales — à préserver dans le report.

### 3.2 Objectiver la subjectivité (accord inter-analystes)

| Niveau | Pratique VDA |
|--------|----------------|
| Accord simple | Deux ingénieurs, même log → mêmes DTC top |
| Kappa-like | Règles de triage versionnées (`sample_triage_rules.json`) |
| PRL métier | Alignement FO MOS : le finding couvre-t-il le requirement ? |

### 3.3 Condensation (composantes « principales » du dossier)

Réduire k signaux / codes en *m* facteurs actionnables :

- Facteurs porteurs de sens : root-cause candidates, MOS gaps  
- Bruit résiduel : trames de remplissage, timeouts isolés  

**Crible :** self-diagnostic + anomaly baseline pour séparer signal et bruit.

### 3.4 Cartographier les proximités

| Distance | Usage |
|----------|--------|
| Euclidienne (simple) | Diff health snapshots |
| Manhattan | Comptages d’écarts DTC / PID |
| Mahalanobis (esprit) | Corrélation multi-signaux (OTA correlation read-only, status DIDs) |

### 3.5 Modèles d’influence (réflexif vs formatif)

| Modèle | Lecture VDA |
|--------|-------------|
| **Réflexif** | Le « concept » *Vehicle Health* se manifeste dans DTC + errors + status |
| **Formatif** | Les preuves (logs, packs, CI) *construisent* le statut de requirement MOS |

---

## PHASE 4 | ENVOL — Rayonnement et Défense du Dossier

### 4.1 Anatomie du « manuscrit » produit

```
Problématique lab/MOS
    → Cadre (standards, safety boundary)
    → Modèle (session, health, triage)
    → Démarche (commands, transports)
    → Cas (trace → findings)
    → Analyse (formation / consolidation / transformation du diagnostic)
    → Discussion (limites analysis-only)
    → Apports / perspectives (roadmap 0.3)
```

**Norme architecturale :** README + Wiki + CHANGELOG + releases VSIX + TRACEABILITY.

### 4.2 Méta-visualisation (diapositive / page wiki idéale)

| Zone | Contenu type |
|------|-------------|
| Navigation | Phase / commande / transport |
| Titre | Phrase affirmative (*« Le probe J2534 reste analysis-only »*) |
| Contenu | Tableau diagnostic, stats, processus BPMN, citation safety |

Une page wiki n’est pas un prompteur : c’est un **artefact de communication** pour FO et lab.

### 4.3 Défendre la place forte (posture face au FO / audit)

| Cercle | Action |
|--------|--------|
| Soi | Connaître les limites (pas ASIL confirmation, pas flash) |
| Contexte | Lab vs production, sim vs hardware |
| Auditoire | FO MOS : traces + requirements ; manager : time-to-finding |
| Espace | Démo 20–30 min : Trace → DTC/Health → Report → lien requirement |

**Ne jamais « vendre » le contrôle véhicule.** La valeur est la **preuve d’analyse** et la **couverture de requirement**.

### 4.4 Artefact achevé — Boucle de la connaissance VDA

```
        Épistémologie (intention analysis-only)
                    ↻
Méthodologie ←———► Analyse (ciment : triage, packs)
 (fondations)              ↻
        Communication (impact : wiki, VSIX, mail FO)
```

> Une recherche / un outil lab réussi est un **artefact parfaitement conçu, bâti et communiqué**.  
> La release **v0.2.9** n’est que la **première itération** de l’architecte.

---

## ANNEXE A — Cartographie rapide commandes ↔ phases

| Phase | Commandes / modules (exemples) |
|-------|--------------------------------|
| 1 Fondations | Self Diagnostic, Safety, Config, Governance |
| 2 Exploration | Connect, DoIP discover, J2534 discover/probe, ASC/BLF, OBD, multi-ECU |
| 3 Déchiffrage | Read DTCs, Health, Triage, Anomaly, Timeline, AI analyze, Diff snapshots |
| 4 Envol | Export report/pack, Confluence, CI import, Wiki, VSIX releases |

## ANNEXE B — Liens

| Ressource | URL |
|-----------|-----|
| Dépôt | https://github.com/horizons237-admin/vehicle-debugging-assistant |
| Release Linux | https://github.com/horizons237-admin/vehicle-debugging-assistant/releases/tag/v0.2.9-linux |
| Release Windows | https://github.com/horizons237-admin/vehicle-debugging-assistant/releases/tag/v0.2.9-windows |
| Wiki J2534 | https://github.com/horizons237-admin/vehicle-debugging-assistant/wiki/J2534 |
| Wiki Safety | https://github.com/horizons237-admin/vehicle-debugging-assistant/wiki/Safety |

---

*Document adapté du modèle « Plan d’architecte de la recherche » (cycle Incubation → Exploration → Déchiffrage → Envol) au produit Vehicle Debugging Assistant — analysis-only, lab automobile.*
