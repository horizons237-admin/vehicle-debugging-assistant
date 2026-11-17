#!/usr/bin/env python3
"""MF4 decoder facade - asammdf when available, else ID probe only."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, List

from mf4_probe import probe_id_block  # type: ignore


def decode_mf4(path: str, limit: int = 5000) -> Dict[str, Any]:
    header = probe_id_block(path)
    if header.get("status") != "ok":
        return header

    frames: List[Dict[str, Any]] = []
    engine = "probe-only"

    try:
        import can  # type: ignore

        if hasattr(can, "MF4Reader"):
            engine = "python-can.MF4Reader"
            for i, msg in enumerate(can.MF4Reader(path)):
                if i >= limit:
                    break
                if getattr(msg, "is_error_frame", False):
                    continue
                frames.append(
                    {
                        "ts": float(msg.timestamp),
                        "id": int(msg.arbitration_id),
                        "data": bytes(msg.data).hex(" ") if msg.data is not None else "",
                        "is_fd": bool(getattr(msg, "is_fd", False)),
                    }
                )
    except Exception as e_can:
        can_err = str(e_can)
    else:
        can_err = None

    if not frames:
        try:
            from asammdf import MDF  # type: ignore

            engine = "asammdf"
            mdf = MDF(path)
            channels = list(mdf.channels_db.keys())[:50]
            try:
                if hasattr(mdf, "extract_bus_logging"):
                    pass
            except Exception:
                pass
            mdf.close()
            return {
                "status": "ok",
                "decoder": engine,
                "header": header,
                "frameCount": 0,
                "frames": [],
                "channelsSample": [str(c) for c in channels],
                "message": "MF4 opened; install/use bus-logging structure or export frames. "
                + (f"python-can: {can_err}" if can_err else ""),
                "note": "For full CAN frames from MF4, prefer asammdf bus logging or python-can MF4Reader",
            }
        except ImportError:
            return {
                "status": "ok",
                "decoder": "probe-only",
                "header": header,
                "frameCount": 0,
                "frames": [],
                "message": "Install asammdf or python-can for MF4 frame decode: pip install asammdf python-can",
            }
        except Exception as e:
            return {
                "status": "error",
                "header": header,
                "message": str(e),
                "python_can": can_err,
            }

    if frames:
        t0 = frames[0]["ts"]
        for f in frames:
            f["ts_rel"] = f["ts"] - t0

    return {
        "status": "ok",
        "decoder": engine,
        "header": header,
        "frameCount": len(frames),
        "frames": frames,
    }


def frames_to_text(frames: List[Dict[str, Any]]) -> str:
    lines = ["# VDA MF4 decode"]
    for f in frames:
        ts = f.get("ts_rel", f.get("ts", 0))
        cid = f.get("id", 0)
        lines.append(f"{ts:.6f}  0x{int(cid):X}  {f.get('data', '')}")
    return "\n".join(lines) + "\n"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("action", choices=["decode", "analyze"])
    args = ap.parse_args()
    cfg = json.loads(sys.stdin.read() or "{}")
    path = cfg.get("path")
    limit = int(cfg.get("limit", 5000))
    if not path:
        print(json.dumps({"status": "error", "message": "path required"}))
        sys.exit(2)
    result = decode_mf4(path, limit)
    if args.action == "decode" or result.get("status") != "ok":
        print(json.dumps(result, ensure_ascii=False))
        return
    frames = result.get("frames") or []
    if not frames:
        print(json.dumps(result, ensure_ascii=False))
        return
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from can_flow_analyzer import analyze_text  # type: ignore

    analysis = analyze_text(frames_to_text(frames))
    result["analysis"] = analysis
    result["framesPreview"] = frames[:30]
    result.pop("frames", None)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
