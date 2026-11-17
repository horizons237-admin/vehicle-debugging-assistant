# Formats de log bus - focus **BLF**

## Qu'est-ce que le BLF ?

**BLF** (*Binary Logging Format*) est le format de log **binaire propriétaire** de **Vector Informatik** (CANoe / CANalyzer).  
Il est **message-based** : trames réseau + métadonnées riches (pas seulement des signaux décodés).

- **Pas de spécification publique officielle** complète (reverse-engineering communautaire).
- Recommandé par Vector pour les **nouveaux** enregistrements (taille + performance vs ASCII).

## Structure logique d'un fichier `.blf`

```text
File header (144 bytes) - signature "LOGG"
  app version, binlog version, fileSize, objectCount, timeStart/Stop
Objects (répétés)
  header "LOBJ" + type + size + timestamp
  payload (souvent dans LOG_CONTAINER zlib ~128 KiB)
```

### Types d'objets fréquents (CAN)

| Type | Contenu |
|------|---------|
| CAN_MESSAGE / CAN_MESSAGE2 | Trame CAN classique |
| CAN_FD_MESSAGE / CAN_FD_MESSAGE_64 | CAN FD |
| CAN_ERROR | Erreurs bus |
| LOG_CONTAINER | Conteneur compressé |
| GLOBAL_MARKER | Marqueurs |

## BLF vs autres formats

| Format | Nature | Forces | Limites |
|--------|--------|--------|----------|
| candump .log | Texte | Simple, Linux | Gros fichiers |
| ASC | Texte Vector | Lisible | Volumineux |
| **BLF** | Binaire Vector | Compact, riche | Propriétaire |
| **MF4** | Binaire ASAM | Standard multi-outils | Moins “tout Vector” |

## Lecture logicielle

| Bibliothèque | Rôle |
|--------------|------|
| **python-can** (`BLFReader`) | Lecture trames CAN/FD |
| **vblf** | Read/write plus complet |
| **VDA** `blf_probe.py` / `blf_decoder.py` | Probe + lite decode lab |

```python
import can
with can.BLFReader("capture.blf") as reader:
    for msg in reader:
        print(msg.timestamp, hex(msg.arbitration_id), msg.data.hex())
```

## Lien VDA

| Capacité | État |
|----------|------|
| Probe en-tête BLF | `blf_probe.py` |
| Decode lite CAN | `blf_decoder.py` (vda-blf-lite) |
| Bridge → flow analyzer | `buslog_bridge.py` / `buslog_decoder.py` |
| Analyse UDS / IDs | `can_flow_analyzer.py` |

Pipeline lab : `.blf` → decode → `can_flow_analyzer` / DBC / UDS.

## Sécurité / légal

Format **propriétaire** Vector - interop lecture de logs de banc CANoe, pas un contournement de licence outil.
