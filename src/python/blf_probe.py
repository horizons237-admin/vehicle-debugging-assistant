#!/usr/bin/env python3
"""
BLF (Vector Binary Logging Format) header probe + optional frame extract.

- Always: parse 144-byte file header (signature LOGG).
- Optional: if python-can is installed, iterate CAN messages (limited).
No official public Vector specification; layout follows community reverse-engineering
(python-can / vector_blf).
"""
from __future__ import annotations

import argparse
import json
import struct
import sys
from pathlib import Path
from typing import Any, Dict, List

FILE_HEADER_STRUCT = struct.Struct("<4sLBBBBBBBBQQLL8H8H")
FILE_HEADER_SIZE = 144


def systemtime_tuple(vals: tuple) -> Dict[str, int]:
    keys = ["year", "month", "dayOfWeek", "day", "hour", "minute", "second", "ms"]
    return {k: int(v) for k, v in zip(keys, vals)}


def probe_header(path: str) -> Dict[str, Any]:
    data = Path(path).read_bytes()[:FILE_HEADER_SIZE]
    if len(data) < FILE_HEADER_STRUCT.size:
        return {"status": "error", "message": "File too small for BLF header"}
    try:
        fmt = "<4sLBBBBBBBBQQLL8H8H"
        size = struct.calcsize(fmt)
        if len(data) < size:
            return {"status": "error", "message": f"Need {size} bytes, got {len(data)}"}
        h = struct.unpack_from(fmt, data, 0)
    except struct.error as e:
        return {"status": "error", "message": str(e)}

    sig = h[0]
    if sig != b"LOGG":
        return {
            "status": "error",
            "message": f"Not a BLF file (signature={sig!r}, expected b'LOGG')",
            "hint": "Vector BLF starts with ASCII 'LOGG'",
        }

    start = systemtime_tuple(h[14:22])
    stop = systemtime_tuple(h[22:30])
    return {
        "status": "ok",
        "format": "BLF",
        "signature": "LOGG",
        "applicationId": h[2],
        "applicationVersion": f"{h[3]}.{h[4]}.{h[5]}",
        "binLogVersion": f"{h[6]}.{h[7]}.{h[8]}.{h[9]}",
        "fileSize": h[10],
        "uncompressedSize": h[11],
        "objectCount": h[12],
        "timeStart": start,
        "timeStop": stop,
        "path": path,
        "note": "Proprietary Vector format - no official public full spec",
    }


def extract_with_python_can(path: str, limit: int = 50) -> Dict[str, Any]:
    try:
        import can  # type: ignore
    except ImportError:
        return {
            "status": "skip",
            "message": "python-can not installed - header-only probe",
            "install": "pip install python-can",
        }
    frames: List[Dict[str, Any]] = []
    try:
        reader = can.BLFReader(path)
        for i, msg in enumerate(reader):
            if i >= limit:
                break
            frames.append(
                {
                    "ts": msg.timestamp,
                    "id": hex(msg.arbitration_id),
                    "dlc": msg.dlc,
                    "data": msg.data.hex(" ") if msg.data is not None else "",
                    "channel": getattr(msg, "channel", None),
                    "is_error_frame": bool(getattr(msg, "is_error_frame", False)),
                    "is_fd": bool(getattr(msg, "is_fd", False)),
                }
            )
        return {"status": "ok", "frames": frames, "returned": len(frames), "limit": limit}
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "hint": "CANoe 15+ BLF header version 3 may need a recent python-can / vblf",
        }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("action", choices=["probe", "extract"])
    args = ap.parse_args()
    cfg = json.loads(sys.stdin.read() or "{}")
    path = cfg.get("path")
    if not path or not Path(path).is_file():
        print(json.dumps({"status": "error", "message": "path required"}))
        sys.exit(2)
    header = probe_header(path)
    if args.action == "probe" or header.get("status") != "ok":
        print(json.dumps(header, ensure_ascii=False))
        return
    out = {"header": header, "extract": extract_with_python_can(path, int(cfg.get("limit", 50)))}
    print(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    main()
