#!/usr/bin/env python3
"""Generic DTC text lookup (SAE J2012 / ISO 15031-6 style labels, lab subset)."""
from __future__ import annotations
import argparse, json, sys
from typing import Any, Dict

CATALOG: Dict[str, str] = {
    "P0300": "Random/Multiple Cylinder Misfire Detected",
    "P0301": "Cylinder 1 Misfire Detected",
    "P0302": "Cylinder 2 Misfire Detected",
    "P0171": "System Too Lean (Bank 1)",
    "P0172": "System Too Rich (Bank 1)",
    "P0420": "Catalyst System Efficiency Below Threshold (Bank 1)",
    "P0430": "Catalyst System Efficiency Below Threshold (Bank 2)",
    "P0442": "Evaporative Emission System Leak Detected (Small Leak)",
    "P0500": "Vehicle Speed Sensor A Malfunction",
    "P0562": "System Voltage Low",
    "P0606": "ECM/PCM Processor Fault",
    "P0700": "Transmission Control System (MIL Request)",
    "U0100": "Lost Communication With ECM/PCM A",
    "U0101": "Lost Communication With TCM",
    "U0121": "Lost Communication With Anti-Lock Brake System Control Module",
    "U0140": "Lost Communication With Body Control Module",
    "U3000": "Control Module",
    "C0035": "Left Front Wheel Speed Sensor Circuit",
    "C0040": "Right Front Wheel Speed Sensor Circuit",
    "B0001": "Driver Frontal Stage 1 Deployment Control",
}

def lookup(code: str) -> Dict[str, Any]:
    c = code.strip().upper()
    text = CATALOG.get(c)
    return {
        "code": c,
        "found": text is not None,
        "description": text or f"No generic J2012 text for {c} (OEM-specific or not in lab catalog)",
        "source": "j2012-lab-subset" if text else "unknown",
    }

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("action", choices=["lookup", "enrich"])
    args = ap.parse_args()
    cfg = json.loads(sys.stdin.read() or "{}")
    if args.action == "lookup":
        print(json.dumps({"status": "ok", **lookup(str(cfg.get("code", "")))}))
        return
    dtcs = cfg.get("dtcs") or []
    out = []
    for d in dtcs:
        if isinstance(d, str):
            out.append(lookup(d))
        else:
            code = str(d.get("code", ""))
            info = lookup(code)
            merged = {**d, "j2012": info["description"], "j2012Found": info["found"]}
            if not d.get("description") and info["found"]:
                merged["description"] = info["description"]
            out.append(merged)
    print(json.dumps({"status": "ok", "dtcs": out, "catalogSize": len(CATALOG)}))

if __name__ == "__main__":
    main()
