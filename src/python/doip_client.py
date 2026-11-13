#!/usr/bin/env python3
"""
DoIP (ISO 13400) helper for Vehicle Debugging Assistant.

Supports:
  - UDP vehicle discovery (0x0001 / 0x0004 style payloads simplified)
  - TCP routing activation scaffold
  - Simulation mode when network/ECU unavailable

Real full UDS-over-DoIP can be layered with udsoncan + custom connection later.
"""

from __future__ import annotations

import sys
import json
import socket
import struct
import argparse
from typing import Any, Dict, List, Optional, Tuple


DOIP_UDP_DISCOVERY_PORT = 13400
DOIP_PROTOCOL_VERSION = 0x02
DOIP_INVERSE_VERSION = 0xFD


def respond(data: Dict[str, Any], code: int = 0) -> None:
    print(json.dumps(data, ensure_ascii=False))
    sys.exit(code)


def load_cfg() -> Dict[str, Any]:
    if sys.stdin.isatty():
        return {}
    try:
        return json.load(sys.stdin)
    except Exception:
        return {}


def parse_addr(value: str) -> int:
    value = str(value).strip().lower()
    if value.startswith("0x"):
        return int(value, 16)
    return int(value)


def doip_header(payload_type: int, payload: bytes) -> bytes:
    return struct.pack(
        "!BBHI",
        DOIP_PROTOCOL_VERSION,
        DOIP_INVERSE_VERSION,
        payload_type,
        len(payload),
    ) + payload


def try_udp_discovery(timeout: float = 2.0, broadcast: str = "255.255.255.255") -> List[Dict[str, Any]]:
    vehicles: List[Dict[str, Any]] = []
    packet = doip_header(0x0001, b"")

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
    sock.settimeout(timeout)
    try:
        sock.bind(("", 0))
        sock.sendto(packet, (broadcast, DOIP_UDP_DISCOVERY_PORT))
        while True:
            try:
                data, addr = sock.recvfrom(1024)
                if len(data) < 8:
                    continue
                ver, inv, ptype, plen = struct.unpack("!BBHI", data[:8])
                payload = data[8 : 8 + plen]
                info: Dict[str, Any] = {
                    "ip": addr[0],
                    "port": addr[1],
                    "payloadType": hex(ptype),
                    "rawLen": len(payload),
                }
                if len(payload) >= 17:
                    try:
                        vin = payload[:17].decode("ascii", errors="ignore")
                        if vin.isprintable():
                            info["vin"] = vin.strip("\x00")
                    except Exception:
                        pass
                if len(payload) >= 19:
                    la = struct.unpack("!H", payload[17:19])[0]
                    info["logicalAddress"] = hex(la)
                vehicles.append(info)
            except socket.timeout:
                break
    except Exception as e:
        return [{"error": str(e)}]
    finally:
        sock.close()
    return vehicles


def try_tcp_routing_activation(
    host: str,
    port: int,
    tester_addr: int,
    ecu_addr: int,
    timeout: float = 3.0,
) -> Dict[str, Any]:
    payload = struct.pack("!H B I I", tester_addr, 0x00, 0, 0)
    packet = doip_header(0x0005, payload)

    try:
        sock = socket.create_connection((host, port), timeout=timeout)
        sock.settimeout(timeout)
        sock.sendall(packet)
        data = sock.recv(256)
        sock.close()
        if len(data) < 8:
            return {"status": "error", "message": "Short response", "mode": "doip"}
        ver, inv, ptype, plen = struct.unpack("!BBHI", data[:8])
        return {
            "status": "ok" if ptype in (0x0006, 0x0005) else "response",
            "mode": "doip",
            "payloadType": hex(ptype),
            "host": host,
            "port": port,
            "testerAddress": hex(tester_addr),
            "ecuAddress": hex(ecu_addr),
        }
    except Exception as e:
        return {"status": "error", "mode": "doip", "message": str(e), "host": host, "port": port}


def action_discover(cfg: Dict[str, Any]) -> None:
    timeout = float(cfg.get("timeout", 2.0))
    broadcast = cfg.get("broadcast", "255.255.255.255")
    vehicles = try_udp_discovery(timeout=timeout, broadcast=broadcast)

    sim = {
        "ip": "127.0.0.1",
        "port": 13400,
        "vin": "SIMULATEDVIN000001",
        "logicalAddress": "0xe80",
        "mode": "simulation",
    }
    if not vehicles or (len(vehicles) == 1 and "error" in vehicles[0]):
        respond(
            {
                "status": "ok",
                "mode": "simulation",
                "vehicles": [sim],
                "message": "No DoIP vehicle responded – simulation entry provided",
            }
        )

    respond({"status": "ok", "mode": "doip", "vehicles": vehicles})


def action_connect(cfg: Dict[str, Any]) -> None:
    host = cfg.get("host", "192.168.0.10")
    port = int(cfg.get("port", 13400))
    tester = parse_addr(cfg.get("logicalAddressTester", "0x0E00"))
    ecu = parse_addr(cfg.get("logicalAddressEcu", "0x0E80"))

    result = try_tcp_routing_activation(host, port, tester, ecu)
    if result.get("status") == "ok":
        respond(result)

    respond(
        {
            "status": "connected",
            "mode": "simulation",
            "message": result.get("message", "DoIP routing failed – using simulation"),
            "host": host,
            "port": port,
        }
    )


def action_status(cfg: Dict[str, Any]) -> None:
    respond(
        {
            "status": "ok",
            "transport": "doip",
            "host": cfg.get("host"),
            "port": cfg.get("port", 13400),
        }
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["discover", "connect", "status"])
    args = parser.parse_args()
    cfg = load_cfg()

    {"discover": action_discover, "connect": action_connect, "status": action_status}[args.action](cfg)


if __name__ == "__main__":
    main()
