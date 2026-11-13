#!/usr/bin/env python3
"""
Vehicle Debugging Assistant – UDS client backend

Actions: connect | disconnect | read_dtcs | clear_dtcs | change_session | read_did

Real mode requires: pip install python-can udsoncan can-isotp
Falls back to rich simulation when hardware/libs are missing.
"""

from __future__ import annotations

import sys
import json
import argparse
from typing import Any, Dict, List, Optional

SIM_DTCS = [
    {
        "code": "P0301",
        "status": "Confirmed",
        "description": "Cylinder 1 Misfire Detected",
        "severity": "major",
        "freezeFrame": "RPM=2100, Load=34%, Coolant=92C",
    },
    {
        "code": "U0100",
        "status": "Pending",
        "description": "Lost Communication with ECM/PCM A",
        "severity": "critical",
        "freezeFrame": "Bus-off count=3",
    },
    {
        "code": "C0035",
        "status": "Confirmed",
        "description": "Left Front Wheel Speed Sensor Circuit",
        "severity": "major",
        "freezeFrame": "Speed LF=0 km/h while others > 20",
    },
    {
        "code": "B1234",
        "status": "History",
        "description": "Battery Voltage Low",
        "severity": "minor",
        "freezeFrame": "Vbat=11.2 V",
    },
    {
        "code": "P0420",
        "status": "Confirmed",
        "description": "Catalyst System Efficiency Below Threshold (Bank 1)",
        "severity": "major",
        "freezeFrame": "O2 sensor delta below threshold",
    },
]

SIM_DIDS = {
    0xF190: {"name": "VIN", "value": "WVWZZZ1JZYW123456"},
    0xF187: {"name": "PartNumber", "value": "03L906018DX"},
    0xF18A: {"name": "SystemSupplier", "value": "OEM-Supplier"},
    0xF191: {"name": "HardwareNumber", "value": "HW-REV-B2"},
    0xF195: {"name": "SoftwareVersion", "value": "SW-2.4.1-ASILB"},
}

_real_client = None


def respond(data: Dict[str, Any], exit_code: int = 0) -> None:
    print(json.dumps(data, ensure_ascii=False))
    sys.exit(exit_code)


def load_stdin_config() -> Dict[str, Any]:
    if sys.stdin.isatty():
        return {}
    try:
        return json.load(sys.stdin)
    except Exception:
        return {}


def parse_can_id(value: str) -> int:
    value = str(value).strip().lower()
    if value.startswith("0x"):
        return int(value, 16)
    return int(value)


def try_real_connect(cfg: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    global _real_client
    try:
        import can
        import isotp
        from udsoncan.client import Client
        from udsoncan.connections import PythonIsoTpConnection

        iface = cfg.get("interface", "socketcan")
        channel = cfg.get("channel", "can0")
        tx_id = parse_can_id(cfg.get("tx_id", "0x7E0"))
        rx_id = parse_can_id(cfg.get("rx_id", "0x7E8"))

        bus = can.interface.Bus(channel=channel, bustype=iface)
        tp_addr = isotp.Address(isotp.AddressingMode.Normal_11bits, txid=tx_id, rxid=rx_id)
        stack = isotp.CanStack(bus=bus, address=tp_addr)
        conn = PythonIsoTpConnection(stack)
        client = Client(conn, request_timeout=2)
        client.open()
        _real_client = client
        return {
            "status": "connected",
            "mode": "real",
            "interface": iface,
            "channel": channel,
            "tx_id": hex(tx_id),
            "rx_id": hex(rx_id),
        }
    except Exception as e:
        return {"status": "error", "mode": "real", "message": str(e)}


def real_read_dtcs() -> Optional[List[Dict[str, Any]]]:
    global _real_client
    if not _real_client:
        return None
    try:
        response = _real_client.get_dtc_by_status_mask(0xFF)
        dtcs = []
        for dtc in getattr(response.service_data, "dtcs", []) or []:
            dtcs.append(
                {
                    "code": str(getattr(dtc, "id", dtc)),
                    "status": str(getattr(dtc, "status", "Unknown")),
                    "description": str(getattr(dtc, "status", "")),
                    "severity": "major",
                }
            )
        return dtcs
    except Exception:
        return None


def real_clear_dtcs() -> bool:
    global _real_client
    if not _real_client:
        return False
    try:
        _real_client.clear_dtc()
        return True
    except Exception:
        return False


def real_disconnect() -> None:
    global _real_client
    if _real_client:
        try:
            _real_client.close()
        except Exception:
            pass
        _real_client = None


def action_connect(cfg: Dict[str, Any]) -> None:
    real = try_real_connect(cfg)
    if real and real.get("status") == "connected" and real.get("mode") == "real":
        respond(real)

    respond(
        {
            "status": "connected",
            "mode": "simulation",
            "message": "Running in simulation mode (install python-can + udsoncan + CAN interface for real hardware)",
            "session": cfg.get("session", "extended"),
            "interface": cfg.get("interface", "virtual"),
            "channel": cfg.get("channel", "vcan0"),
        }
    )


def action_disconnect(cfg: Dict[str, Any]) -> None:
    real_disconnect()
    respond({"status": "disconnected"})


def action_read_dtcs(cfg: Dict[str, Any]) -> None:
    real_dtcs = real_read_dtcs()
    if real_dtcs is not None:
        respond({"status": "ok", "dtcs": real_dtcs, "mode": "real"})
    respond({"status": "ok", "dtcs": SIM_DTCS, "mode": "simulation"})


def action_clear_dtcs(cfg: Dict[str, Any]) -> None:
    if real_clear_dtcs():
        respond({"status": "cleared", "mode": "real"})
    respond({"status": "cleared", "mode": "simulation"})


def action_read_did(cfg: Dict[str, Any]) -> None:
    did_raw = cfg.get("did", "0xF190")
    try:
        did = parse_can_id(str(did_raw))
    except Exception:
        did = 0xF190

    info = SIM_DIDS.get(did, {"name": f"DID_{did:04X}", "value": "N/A (simulation)"})
    respond(
        {
            "status": "ok",
            "did": hex(did),
            "name": info["name"],
            "value": info["value"],
            "mode": "simulation",
        }
    )


def action_change_session(cfg: Dict[str, Any]) -> None:
    session = cfg.get("session", "extended")
    respond({"status": "ok", "session": session, "mode": "simulation"})


def main() -> None:
    parser = argparse.ArgumentParser(description="Vehicle Debug UDS backend")
    parser.add_argument(
        "action",
        choices=["connect", "disconnect", "read_dtcs", "clear_dtcs", "read_did", "change_session"],
    )
    args = parser.parse_args()
    cfg = load_stdin_config()

    actions = {
        "connect": action_connect,
        "disconnect": action_disconnect,
        "read_dtcs": action_read_dtcs,
        "clear_dtcs": action_clear_dtcs,
        "read_did": action_read_did,
        "change_session": action_change_session,
    }
    actions[args.action](cfg)


if __name__ == "__main__":
    main()
