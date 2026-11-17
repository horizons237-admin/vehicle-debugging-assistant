# Formats de mesure - focus **MDF4 / MF4**

## Qu'est-ce que MDF4 ?

**ASAM MDF** (*Measurement Data Format*) version **4** (fichier **`.mf4`**) est un format **binaire ouvert** normalisé par **ASAM e.V.** pour mesures et post-traitement.

- Standard ASAM, **royalty-free**, multi-outils - contraste avec le **BLF** propriétaire Vector.
- Extension typique : **`.mf4`** (parfois `.mdf` pour v3).

## Structure logique

```text
ID  (64 octets)   →  "MDF     " + version
 └─ HD Header     →  racine mesure
     ├─ FH File History
     ├─ DG Data Group(s)
     │    ├─ CG Channel Group(s)
     │    │    └─ CN Channel(s)
     │    └─ DT / DZ Data
     ├─ EV Events
     └─ AT Attachments (DBC, etc.)
```

## BLF vs MF4 (choix pratique)

| Besoin | Préférer |
|--------|----------|
| Banc Vector / replay CANoe | BLF |
| Échange standard / multi-outils | **MF4** |
| Analyse VDA lab rapide | ASC / candump texte, ou BLF via python-can |

## Lecture logicielle

| Bibliothèque | Rôle |
|--------------|------|
| **asammdf** | Référence Python MF4 |
| **python-can** `MF4Reader` | Trames CAN si bus logging |
| **VDA** `mf4_probe.py` / `mf4_decoder.py` | Probe + facade lab |

```python
from asammdf import MDF
mdf = MDF("measure.mf4")
print(mdf.version, list(mdf.channels_db)[:10])
```

## Lien VDA

| Capacité | État |
|----------|------|
| Probe ID block | `mf4_probe.py` |
| Decode facade | `mf4_decoder.py` |
| Unified entry | `buslog_decoder.py` |

Pipeline : `.mf4` → asammdf / MF4Reader → trames → `can_flow_analyzer`.

## Versions

- **MDF 3.x** : `.mdf` / `.dat` hérités
- **MDF 4.x** : `.mf4`, compression, bus logging enrichi

Vérifier la version dans le bloc ID et la finalisation du fichier.
