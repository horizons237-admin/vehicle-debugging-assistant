#!/usr/bin/env python3
"""
Bridge BLF / MF4 → text lines consumable by can_flow_analyzer.

Requires optional deps:
  BLF: python-can
  MF4: asammdf (and/or python-can[mf4])
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple


def frames_to_text(frames: List[Dict[str, Any]]) -> str:
    lines = ["# VDA buslog bridge export"]
    for f in frames:
        ts = f.get("ts", 0)
        cid = f.get("id", "0")
        if isinstance(cid, int):
            cid = f"0x{cid:X}"
        data = f.get("data") or ""
        if isinstance(data, (bytes, bytearray)):
            data = data.hex(" ")
        elif isinstance(data, list):
            data = " ".join(f"{int(b):02X}" for b in data)
        lines.append(f"{ts:.6f}  {cid}  {data}")
    return "\n".join(lines) + "\n"


def extract_blf(path: str, limit: int) -> Tuple[List[Dict[str, Any]], str]:
    try:
        import can  # type: ignore
    except ImportError:
        return [], "python-can not installed (pip install python-can)"
    frames: List[Dict[str, Any]] = []
    try:
        for i, msg in enumerate(can.BLFReader(path)):
            if i >= limit:
                break
            if getattr(msg, "is_error_frame", False):
                continue
            frames.append(
                {
                    "ts": float(msg.timestamp),
                    "id": int(msg.arbitration_id),
                    "data": bytes(msg.data) if msg.data is not None else b"",
                    "channel": getattr(msg, "channel", None),
                }
            )
        return frames, "ok"
    except Exception as e:
        return [], str(e)


def extract_mf4(path: str, limit: int) -> Tuple[List[Dict[str, Any]], str]:
    try:
        import can  # type: ignore

        if hasattr(can, "MF4Reader"):
            frames = []
            try:
                reader = can.MF4Reader(path)
                for i, msg in enumerate(reader):
                    if i >= limit:
                        break
                    if getattr(msg, "is_error_frame", False):
                        continue
                    frames.append(
                        {
                            "ts": float(msg.timestamp),
                            "id": int(msg.arbitration_id),
                            "data": bytes(msg.data) if msg.data is not None else b"",
                        }
                    )
                return frames, "ok"
            except Exception as e:
                mf4_err = str(e)
        else:
            mf4_err = "MF4Reader not in python-can"
    except ImportError:
        mf4_err = "python-can missing"

    try:
        from asammdf import MDF  # type: ignore
    except ImportError:
        return [], f"{mf4_err}; asammdf not installed (pip install asammdf)"

    try:
        mdf = MDF(path)
        frames = []
        if hasattr(mdf, "get_bus_logging"):
            pass
        mdf.close()
        return [], (
            f"MF4 opened (version={getattr(mdf, 'version', '?')}) but no simple frame iterator; "
            "use asammdf GUI/export or python-can MF4Reader. Prior error: " + mf4_err
        )
    except Exception as e:
        return [], f"{mf4_err}; asammdf: {e}"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("action", choices=["bridge", "probe_kind"])
    args = ap.parse_args()
    cfg = json.loads(sys.stdin.read() or "{}")
    path = cfg.get("path")
    limit = int(cfg.get("limit", 5000))
    if not path or not Path(path).is_file():
        print(json.dumps({"status": "error", "message": "path required"}))
        sys.exit(2)

    data = Path(path).read_bytes()[:8]
    kind = "unknown"
    if data.startswith(b"LOGG"):
        kind = "blf"
    elif data.startswith(b"MDF"):
        kind = "mf4"

    if args.action == "probe_kind":
        print(json.dumps({"status": "ok", "kind": kind, "path": path}))
        return

    if kind == "blf":
        frames, status = extract_blf(path, limit)
    elif kind == "mf4":
        frames, status = extract_mf4(path, limit)
    else:
        print(json.dumps({"status": "error", "message": f"Unsupported or unknown binary log (kind={kind})", "hint": "Expected BLF (LOGG) or MF4 (MDF)"}))
        return

    if status != "ok":
        print(json.dumps({"status": "error", "kind": kind, "message": status}))
        return

    text = frames_to_text(frames)
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from can_flow_analyzer import analyze_text  # type: ignore

    analysis = analyze_text(text)
    print(
        json.dumps(
            {
                "status": "ok",
                "kind": kind,
                "frameExtracted": len(frames),
                "textPreview": "\n".join(text.splitlines()[:20]),
                "analysis": analysis,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
