# Checklist UDS / DoIP réel (vcan & hardware)

Guide de validation du chemin **réel** (hors simulation) pour Vehicle Debugging Assistant.

## 1. Prérequis logiciels

```bash
sudo apt update && sudo apt install -y can-utils
pip install python-can udsoncan can-isotp
python3 -c "import can, udsoncan, isotp; print('OK')"
```

Settings VS Code : `pythonPath`, `transport` = `can` ou `doip` (pas `simulation`).

## 2. Bus virtuel vcan

```bash
sudo modprobe vcan
sudo ip link add dev vcan0 type vcan
sudo ip link set up vcan0
ip -details link show vcan0
```

| Setting | Valeur |
|---------|--------|
| `canInterface` | `socketcan` |
| `canChannel` | `vcan0` |
| `txId` / `rxId` | selon ECU mock |

### Checklist

- [ ] `vcan0` UP
- [ ] Libs Python importables
- [ ] Connect → **Connected (Real)** (ou simulation si pas de serveur ECU)
- [ ] Read DTCs / Read DID
- [ ] Disconnect

Sans serveur ECU sur vcan, timeout possible (`pythonTimeoutMs`) — attendu.

## 3. Hardware CAN

Bit-rate OS (`ip link set can0 type can bitrate 500000`), IDs TX/RX alignés.

## 4. DoIP

`transport=doip`, `doip.enabled=true`, host/port/adresses logiques. Discovery puis Connect.

## 5. Mode

JSON backends : `"mode": "simulation"|"real"`. Vue Session affiche Simulation vs Real.

## 6. Problèmes fréquents

Libs manquantes → simulation ; timeout → pas de réponse bus ; permissions interface CAN.
