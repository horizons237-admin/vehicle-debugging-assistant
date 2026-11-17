#!/usr/bin/env python3
"""
MF4 / ASAM MDF 4 identification probe + optional channel listing via asammdf.

ID block is 64 bytes; starts with ASCII "MDF     " (MDF + spaces).
"""
from __future__ import annotations

import argparse
import json
import struct
import sys
from pathlib import Path
from typing import Any, Dict


def probe_id_block(path: str) -> Dict[str, Any]:
    raw = Path(path).read_bytes()[:64]
    if len(raw) < 64:
        return {"status": "error", "message": "File smaller than 64-byte ID block"}
    file_id = raw[0:8]
    format_id = raw[8:16].split(b"\0")[0].decode("ascii", errors="replace").strip()
    program = raw[16:24].split(b"\0")[0].decode("ascii", errors="replace").strip()
    if not file_id.startswith(b"MDF"):
        return {
            "status": "error",
            "message": f"Not an MDF file (id={file_id!r})",
            "hint": "MF4 files start with ASCII 'MDF' padded with spaces",
        }
    version = raw[28:36].split(b"\0")[0].decode("ascii", errors="replace").strip()
    if not version:
        version = format_id or "unknown"
    return {
        "status": "ok",
        "format": "MDF/MF4",
        "fileId": file_id.decode("ascii", errors="replace").strip(),
        "formatId": format_id,
        "programId": program,
        "versionHint": version,
        "path": path,
        "standard": "ASAM MDF",
        "note": "Open standard (royalty-free). Prefer asammdf for full parse.",
    }


def extract_asammdf(path: str, limit_channels: int = 30) -> Dict[str, Any]:
    try:
        from asammdf import MDF  # type: ignore
    except ImportError:
        return {
            "status": "skip",
            "message": "asammdf not installed",
            "install": "pip install asammdf",
        }
    try:
        mdf = MDF(path)
        channels = []
        for name in list(mdf.channels_db.keys())[:limit_channels]:
            channels.append(str(name))
        info = {
            "status": "ok",
            "version": getattr(mdf, "version", None),
            "channelCount": len(mdf.channels_db),
            "channelsSample": channels,
            "startTime": str(getattr(mdf.header, "start_time", "")),
        }
        mdf.close()
        return info
    except Exception as e:
        return {"status": "error", "message": str(e)}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("action", choices=["probe", "info"])
    args = ap.parse_args()
    cfg = json.loads(sys.stdin.read() or "{}")
    path = cfg.get("path")
    if not path or not Path(path).is_file():
        print(json.dumps({"status": "error", "message": "path required"}))
        sys.exit(2)
    header = probe_id_block(path)
    if args.action == "probe" or header.get("status") != "ok":
        print(json.dumps(header, ensure_ascii=False))
        return
    print(json.dumps({"header": header, "info": extract_asammdf(path)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
