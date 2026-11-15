# Checklist CAN / vcan

```bash
sudo modprobe vcan
sudo ip link add dev vcan0 type vcan
sudo ip link set up vcan0
pip install python-can can-isotp udsoncan
```

| Code | Action |
|------|--------|
| CAN_DEPS_MISSING | pip install deps |
| CAN_INTERFACE_MISSING | create/up interface |
| CAN_PERMISSION | capabilities / udev |
| CAN_TIMEOUT | check TX/RX IDs |
| SIM_FORCED | transport=simulation |
| CAN_FALLBACK_SIM | real failed → sim |
