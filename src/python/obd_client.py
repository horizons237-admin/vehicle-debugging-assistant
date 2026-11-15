#!/usr/bin/env python3
"""OBD-II (SAE J1979) lab backend — simulation first."""
from __future__ import annotations
import argparse, json, sys
from typing import Any, Dict, List

def respond(obj: Dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(obj, ensure_ascii=False) + "\n")
    sys.stdout.flush()

def load_cfg() -> Dict[str, Any]:
    raw = sys.stdin.read().strip()
    if not raw: return {}
    try: return json.loads(raw)
    except json.JSONDecodeError as e:
        respond({"status": "error", "code": "CFG_JSON", "message": str(e)})
        sys.exit(2)

SIM_PIDS = {
    "0C": {"name": "Engine RPM", "value": 1850, "unit": "rpm", "pid": "0C"},
    "0D": {"name": "Vehicle Speed", "value": 48, "unit": "km/h", "pid": "0D"},
    "05": {"name": "Coolant Temperature", "value": 91, "unit": "°C", "pid": "05"},
    "0F": {"name": "Intake Air Temperature", "value": 28, "unit": "°C", "pid": "0F"},
    "11": {"name": "Throttle Position", "value": 18, "unit": "%", "pid": "11"},
    "2F": {"name": "Fuel Tank Level", "value": 62, "unit": "%", "pid": "2F"},
    "42": {"name": "Control Module Voltage", "value": 13.9, "unit": "V", "pid": "42"},
    "04": {"name": "Calculated Engine Load", "value": 34, "unit": "%", "pid": "04"},
}
SIM_DTCS = [
    {"code": "P0420", "status": "Confirmed", "description": "Catalyst System Efficiency Below Threshold (Bank 1)", "severity": "major", "protocol": "obd2"},
    {"code": "P0171", "status": "Pending", "description": "System Too Lean (Bank 1)", "severity": "major", "protocol": "obd2"},
]

def action_connect(cfg: Dict[str, Any]) -> None:
    prefer_sim = cfg.get("forceSimulation") or cfg.get("transport") == "simulation"
    interface = cfg.get("interface") or cfg.get("canInterface") or "can0"
    if prefer_sim:
        respond({"status": "ok", "mode": "simulation", "protocol": "obd2", "message": "OBD-II simulation session ready", "interface": interface})
        return
    try:
        import importlib
        if importlib.util.find_spec("obd") is None:
            raise ImportError("python-obd not installed")
        respond({"status": "error", "code": "OBD_ADAPTER_NOT_WIRED", "message": "python-obd installed but live adapter not enabled; use simulation.", "hint": "Set transport=simulation"})
    except ImportError:
        respond({"status": "error", "code": "OBD_DEPS_MISSING", "message": "OBD libraries not available; use simulation mode.", "hint": "pip install obd or use simulation", "fallback": "simulation"})

def action_read_pids(cfg: Dict[str, Any]) -> None:
    requested = cfg.get("pids") or list(SIM_PIDS.keys())
    signals: List[Dict[str, Any]] = []
    for p in requested:
        key = str(p).upper().replace("0X", "").zfill(2)[-2:]
        info = SIM_PIDS.get(key)
        signals.append(dict(info) if info else {"pid": key, "name": f"PID_{key}", "value": None, "unit": "", "unsupported": True})
    respond({"status": "ok", "mode": "simulation", "protocol": "obd2", "signals": signals})

def action_read_dtcs(_cfg: Dict[str, Any]) -> None:
    respond({"status": "ok", "mode": "simulation", "protocol": "obd2", "dtcs": SIM_DTCS})

def action_clear_dtcs(_cfg: Dict[str, Any]) -> None:
    respond({"status": "cleared", "mode": "simulation", "protocol": "obd2", "message": "Simulated Mode 04 clear — no ECU written in simulation"})

def action_read_vin(_cfg: Dict[str, Any]) -> None:
    respond({"status": "ok", "mode": "simulation", "protocol": "obd2", "vin": "WVWZZZ1JZXW000001", "source": "Mode 09 PID 02 (simulation)"})

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["connect", "read_pids", "read_dtcs", "clear_dtcs", "read_vin"])
    args = parser.parse_args()
    cfg = load_cfg()
    {"connect": action_connect, "read_pids": action_read_pids, "read_dtcs": action_read_dtcs, "clear_dtcs": action_clear_dtcs, "read_vin": action_read_vin}[args.action](cfg)

if __name__ == "__main__":
    main()
