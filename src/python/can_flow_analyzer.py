#!/usr/bin/env python3
"""
CAN bus flow analyzer (lab).

Parses text traces (candump-like or VDA sample) into:
- frame statistics by ID
- diagnostic request/response pairs (ISO-TP single-frame UDS)
- anomalies (timeouts, NRC, bus-off)

Not a full Vector BLF decoder.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

UDS_SID = {
    0x10: "DiagnosticSessionControl",
    0x11: "ECUReset",
    0x14: "ClearDiagnosticInformation",
    0x19: "ReadDTCInformation",
    0x22: "ReadDataByIdentifier",
    0x27: "SecurityAccess",
    0x28: "CommunicationControl",
    0x2E: "WriteDataByIdentifier",
    0x2F: "InputOutputControlByIdentifier",
    0x31: "RoutineControl",
    0x3E: "TesterPresent",
    0x85: "ControlDTCSetting",
}

LINE_CAN = re.compile(
    r"^\s*(?:(?P<ts>[\d.]+)\s+)?(?P<id>[0-9A-Fa-fx]+)\s+(?P<data>(?:[0-9A-Fa-f]{2}\s*)+)"
)
LINE_EVENT = re.compile(
    r"(bus-?off|timeout|NRC\s*(?:0x)?([0-9A-Fa-f]{2})|watchdog|FiM|DEM|Safe state)",
    re.I,
)


def parse_id(s: str) -> Optional[int]:
    s = s.strip().lower().replace("0x", "")
    if s in ("can", "dem", "wdgm", "fim", "error"):
        return None
    try:
        return int(s, 16)
    except ValueError:
        return None


def parse_data_bytes(data: str) -> List[int]:
    parts = re.findall(r"[0-9A-Fa-f]{2}", data)
    return [int(p, 16) for p in parts]


def decode_uds_sf(payload: List[int]) -> Optional[Dict[str, Any]]:
    """Decode ISO-TP single-frame: PCI | SID | ..."""
    if len(payload) < 2:
        return None
    pci = payload[0]
    if (pci >> 4) == 0:
        length = pci & 0x0F
        body = payload[1 : 1 + length]
    else:
        body = payload
    if not body:
        return None
    sid = body[0]
    is_pos = sid & 0x40
    is_neg = sid == 0x7F
    if is_neg and len(body) >= 3:
        return {
            "type": "NRC",
            "sid": body[1],
            "sidName": UDS_SID.get(body[1], f"0x{body[1]:02X}"),
            "nrc": body[2],
            "nrcName": nrc_name(body[2]),
        }
    if is_pos:
        req_sid = sid & 0xBF
        return {
            "type": "positive",
            "sid": req_sid,
            "sidName": UDS_SID.get(req_sid, f"0x{req_sid:02X}"),
            "payload": body[1:],
        }
    return {
        "type": "request",
        "sid": sid,
        "sidName": UDS_SID.get(sid, f"0x{sid:02X}"),
        "payload": body[1:],
    }


def nrc_name(nrc: int) -> str:
    names = {
        0x10: "generalReject",
        0x11: "serviceNotSupported",
        0x12: "subFunctionNotSupported",
        0x13: "incorrectMessageLength",
        0x22: "conditionsNotCorrect",
        0x31: "requestOutOfRange",
        0x33: "securityAccessDenied",
        0x78: "responsePending",
        0x7F: "serviceNotSupportedInActiveSession",
    }
    return names.get(nrc, f"0x{nrc:02X}")


def analyze_text(text: str) -> Dict[str, Any]:
    frames: List[Dict[str, Any]] = []
    events: List[Dict[str, Any]] = []
    by_id: Counter = Counter()
    pairs: List[Dict[str, Any]] = []
    pending_req: Optional[Dict[str, Any]] = None

    for i, line in enumerate(text.splitlines()):
        raw = line.strip()
        if not raw or raw.startswith("#"):
            continue
        if "#" in raw:
            raw_code, comment = raw.split("#", 1)
            comment = comment.strip()
        else:
            raw_code, comment = raw, ""

        m = LINE_CAN.match(raw_code)
        if m:
            can_id = parse_id(m.group("id"))
            if can_id is None:
                ev = LINE_EVENT.search(line)
                if ev:
                    events.append({"line": i + 1, "kind": "event", "text": line.strip()})
                continue
            data = parse_data_bytes(m.group("data"))
            ts = float(m.group("ts") or 0)
            by_id[f"0x{can_id:03X}"] += 1
            uds = decode_uds_sf(data)
            frame = {
                "line": i + 1,
                "ts": ts,
                "id": f"0x{can_id:03X}",
                "idInt": can_id,
                "dlc": len(data),
                "data": " ".join(f"{b:02X}" for b in data),
                "uds": uds,
                "comment": comment,
            }
            frames.append(frame)

            if uds and uds.get("type") == "request":
                pending_req = frame
            elif uds and uds.get("type") in ("positive", "NRC") and pending_req:
                dt = ts - float(pending_req.get("ts") or 0)
                pairs.append(
                    {
                        "requestId": pending_req["id"],
                        "responseId": frame["id"],
                        "service": pending_req.get("uds", {}).get("sidName"),
                        "result": uds.get("type"),
                        "nrc": uds.get("nrcName") if uds.get("type") == "NRC" else None,
                        "deltaSec": round(dt, 6),
                        "requestLine": pending_req["line"],
                        "responseLine": frame["line"],
                    }
                )
                pending_req = None
            continue

        if LINE_EVENT.search(line):
            events.append({"line": i + 1, "kind": "event", "text": line.strip()[:200]})

    roles = []
    for fid, count in by_id.most_common():
        role = "unknown"
        v = int(fid, 16)
        if v in (0x7DF,):
            role = "OBD functional request"
        elif 0x7E0 <= v <= 0x7E7:
            role = "UDS physical request"
        elif 0x7E8 <= v <= 0x7EF:
            role = "UDS physical response"
        roles.append({"id": fid, "count": count, "role": role})

    services = Counter()
    for f in frames:
        if f.get("uds") and f["uds"].get("sidName"):
            services[f["uds"]["sidName"]] += 1

    anomalies = []
    for e in events:
        anomalies.append(e["text"])
    for f in frames:
        if f.get("uds") and f["uds"].get("type") == "NRC":
            anomalies.append(
                f"NRC {f['uds'].get('nrcName')} for {f['uds'].get('sidName')} @ line {f['line']}"
            )

    return {
        "status": "ok",
        "mode": "text-trace",
        "frameCount": len(frames),
        "eventCount": len(events),
        "uniqueIds": len(by_id),
        "ids": roles,
        "services": [{"name": k, "count": v} for k, v in services.most_common()],
        "requestResponsePairs": pairs,
        "anomalies": anomalies[:50],
        "frames": frames[:200],
        "summary": _summary(roles, pairs, anomalies, services),
    }


def _summary(roles, pairs, anomalies, services) -> str:
    top = ", ".join(f"{r['id']}({r['count']})" for r in roles[:5]) or "none"
    svcs = ", ".join(s["name"] for s in [{"name": k} for k, _ in services.most_common(5)]) or "none"
    return (
        f"{len(roles)} CAN IDs [{top}]; "
        f"{len(pairs)} req/res pairs; "
        f"services={svcs}; "
        f"{len(anomalies)} anomaly signal(s)"
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("action", choices=["analyze"])
    args = ap.parse_args()
    cfg = json.loads(sys.stdin.read() or "{}")
    path = cfg.get("path")
    if path:
        text = Path(path).read_text(encoding="utf-8", errors="replace")
    else:
        text = cfg.get("text") or ""
    if not text.strip():
        print(json.dumps({"status": "error", "message": "path or text required"}))
        sys.exit(2)
    print(json.dumps(analyze_text(text), ensure_ascii=False))


if __name__ == "__main__":
    main()
