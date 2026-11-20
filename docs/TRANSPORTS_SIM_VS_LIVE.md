# Transports — Simulation vs Live (lab)

**Baseline 0.2.9** · analysis-only · ce document fixe ce qui est **sim**, **log**, **lab live**, et ce qui **n’existe pas**.

Voir aussi : [J2534](J2534) · [Safety](Safety) · [Runbook Phase 2](Runbook-Phase2) · [Commands](Commands)

---

## Matrice unique (à coller en démo FO)

| Transport / source | Simulation | Log offline | Lab live (lecture) | Contrôle véhicule |
|--------------------|------------|-------------|--------------------|-------------------|
| **UDS session** (`Connect to ECU`) | **Oui** (défaut) | via log | Partiel* | **Non** |
| **OBD-II** | Oui | — | Partiel* | **Non** |
| **DoIP discovery / session** | Mock / lab | — | Découverte lab | **Non** |
| **SOVD discover** | Lab | — | Lab limité | **Non** |
| **Remote diagnostics** | **Mock** par défaut | — | HTTP optionnel | **Non** |
| **ASC / BLF / MDF4** | — | **Oui** | — | **Non** |
| **J2534 registry discover** | — | — | Windows registry | **Non** |
| **J2534 probe** | — | — | Open/ReadVersion/Close **only** | **Non** |
| **D-PDU / J2534 Status** | **Stub** UI | — | Info config | **Non** |
| **CAN interface** (socketcan, etc.) | virtual | — | Selon stack Python | **Non** (pas WriteMsgs outil) |

\* *Partiel* = dépend de l’interface (SocketCAN, VCI, stack `python-can` / `udsoncan`) et de la config ; **jamais** flash / security access via VDA.

---

## Règle d’or

> **Labeller la source** sur chaque finding et chaque pack : `sim` | `log` | `hardware`.  
> Mélanger sans label = validité contestable (Phase 3–4).

---

## 1. Simulation (recommandé Phase 1–2)

| | |
|--|--|
| **Setting** | `vehicleDebug.transport` = `simulation` (ou Connect en mode sim) |
| **Usage** | Onboarding, smoke, démos FO sans VCI |
| **Validité écologique** | Faible (pas le véhicule) · **forte** pour régression outil |
| **Commandes** | Connect, Read DTCs/DID, Health, Timeline, OBD lab sim |

**Ne pas** présenter un run 100 % sim comme preuve véhicule.

---

## 2. Log offline (ASC / BLF / MDF4)

| | |
|--|--|
| **Usage** | Rejeu, CI, dossier MOS à partir de traces capturées ailleurs |
| **Commandes** | Parse/Analyze ASC, Probe/Decode BLF·MF4, Analyze Log, CAN flow, DBC annotate |
| **Limites** | Qualité = qualité du fichier ; timestamps manquants → timeline faible |
| **Deps** | BLF lite natif (CAN subset) ; MF4 souvent `asammdf` / `python-can` |

Label pack : **`log`**.

---

## 3. Lab live (lecture)

### 3.1 UDS / OBD sur interface CAN

- Config `canInterface` / channel / txId / rxId  
- Stack Python optionnelle (`python-can`, `udsoncan`, `can-isotp`)  
- **Autorisé :** lectures diagnostiques dans le périmètre tool  
- **Interdit via VDA :** programmation, WriteMsgs métier, remote control  

### 3.2 DoIP

| Commande | Réalité 0.2.9 |
|----------|----------------|
| **DoIP: Vehicle Discovery** | Lab / discovery — pas inventaire flotte prod |
| **DoIP: Diagnostic Session / Read DTCs** | Parcours lab E2E ; vérifier host/port et firewall |
| Mock | Utilisé si pas d’ECU DoIP joignable |

Toujours indiquer **DoIP lab** vs **sim** dans le report.

### 3.3 J2534

| Étape | Live ? | Détail |
|-------|--------|--------|
| Discover drivers | Oui (Windows registry) | **Aucun** chargement DLL |
| Probe library | Oui (minimal) | Open → ReadVersion → Close |
| Trafic bus UDS via J2534 | **Non** dans 0.2.9 | Pas un remplacement ISTA/Xentry |

→ Détail : [J2534](J2534)

### 3.4 Remote diagnostics / SOVD

| | |
|--|--|
| Remote | `preferMock` **true** par défaut → HTTP seulement si configuré et autorisé |
| SOVD | Discovery **lab**, pas un client cloud production |

---

## 4. Stubs (UI / architecture only)

Ces commandes **existent** pour alignement architecture et self-diag — elles **ne** constituent **pas** une stack live complète :

| Commande | Statut |
|----------|--------|
| **J2534 Pass-Thru Status (stub)** | Affiche config / next steps |
| **D-PDU API Status (stub)** | ISO 22900 — placeholder |
| Certaines vues Status si pas de session | Placeholders informatifs |

Les marquer **stub** dans le brief FO si montrées.

---

## 5. Tableau de décision rapide

| Besoin | Choisir |
|--------|----------|
| Démo outil / smoke | **Simulation** |
| Analyse d’un log terrain | **Log** ASC/BLF/MDF4 |
| Lire DTC sur banc avec VCI Ethernet | **DoIP lab** (si joignable) |
| Vérifier qu’un driver J2534 est installé | **J2534 Discover** (+ Probe version) |
| Programmer un ECU | **Hors scope** — outil OEM, pas VDA |
| Preuve MOS pour FO | Phase 3–4 + label source + H0/H1 |

---

## 6. Self-diagnostic (lecture des statuts)

| Item | Lecture |
|------|----------|
| UDS/OBD connect (sim) ok | Runtime Python + backends OK |
| J2534 `skip` / unsupported_os | Normal hors Windows |
| J2534 drivers=N | Registry OK ; **pas** preuve bus |
| Optional deps missing | BLF/MF4/CAN live limités |
| Analysis-only posture ok | Frontière produit rappelée |

---

## 7. Phrases autorisées en démo

- « En simulation, on valide le **pipeline** d’analyse. »  
- « Sur ce log terrain, on construit le **dossier de preuve**. »  
- « J2534 ici = **inventaire driver + version DLL**, pas le trafic UDS. »  
- « Pas de flash, pas de WriteMsgs, pas de confirmation ASIL. »

## Phrases interdites

- « On est connecté au véhicule comme un outil de concession. »  
- « Le probe J2534 a validé le réseau CAN. »  
- « Health vert = ASIL OK. »

---

*Document 0.2.9 — à mettre à jour si un transport live UDS-via-J2534 analysis-only est ajouté en 0.3+.*
