#!/usr/bin/env python3
"""
Vector ASC (ASCII log) parser — lab.

Supports common CANalyzer/CANoe ASC line forms:
  <timestamp> <channel> <id> <Rx|Tx> d <dlc> <data bytes...>
  <timestamp> CANFD <channel> <id> ...
Ignores comments, date/base headers, statistics lines.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

# Classic: 0.015200 1  7E8  Rx  d 7 06 50 03 00 32 01 F4
LINE_CLASSIC = re.compile(
    r"^\s*(?P<ts>[\d.]+)\s+"
    r"(?P<ch>\d+)\s+"
    r"(?P<id>[0-9A-Fa-fx]+)\s+"
    r"(?P<dir>Rx|Tx|RX|TX)\s+"
    r"(?P<dtype>[dr])\s+"
    r"(?P<dlc>\d+)\s+"
    r"(?P<data>(?:[0-9A-Fa-f]{2}\s*)*)",
    re.I,
)

# Expanded ID sometimes with x suffix: 18DAF110x
LINE_EXTENDED = re.compile(
    r"^\s*(?P<ts>[\d.]+)\s+"
    r"(?P<ch>\d+)\s+"
    r"(?P<id>[0-9A-Fa-f]+)x?\s+"
    r"(?P<dir>Rx|Tx)\s+"
    r"d\s+(?P<dlc>\d+)\s+"
    r"(?P<data>(?:[0-9A-Fa-f]{2}\s*)*)",
    re.I,
)

# CAN FD simplified variants
LINE_FD = re.compile(
    r"^\s*(?P<ts>[\d.]+)\s+CANFD\s+(?P<ch>\d+)\s+(?P<id>[0-9A-Fa-fx]+)\s+"
    r"(?P<dir>Rx|Tx).*?\s+(?P<data>(?:[0-9A-Fa-f]{2}\s*)+)$",
    re.I,
)


def _parse_id(s: str) -> int:
    s = s.strip().lower().rstrip("x")
    if s.startswith("0x"):
        return int(s, 16)
    return int(s, 16)


def _parse_data(s: str) -> str:
    parts = re.findall(r"[0-9A-Fa-f]{2}", s or "")
    return " ".join(p.upper() for p in parts)


def parse_asc_text(text: str, limit: int = 100000) -> Dict[str, Any]:
    frames: List[Dict[str, Any]] = []
    meta: Dict[str, str] = {}
    skipped = 0

    for i, line in enumerate(text.splitlines()):
        raw = line.strip()
        if not raw or raw.startswith("//") or raw.startswith(";"):
            continue
        low = raw.lower()
        if low.startswith("date "):
            meta["date"] = raw[5:].strip()
            continue
        if low.startswith("base "):
            meta["base"] = raw
            continue
        if low.startswith("begin ") or low.startswith("end "):
            continue
        if "statistic" in low or low.startswith("//"):
            continue

        m = LINE_CLASSIC.match(raw) or LINE_EXTENDED.match(raw)
        is_fd = False
        if not m:
            m = LINE_FD.match(raw)
            is_fd = m is not None
        if not m:
            skipped += 1
            continue

        try:
            can_id = _parse_id(m.group("id"))
            data = _parse_data(m.group("data"))
            dlc = int(m.groupdict().get("dlc") or len(data.split()))
            frames.append(
                {
                    "line": i + 1,
                    "ts": float(m.group("ts")),
                    "channel": int(m.group("ch")),
                    "id": can_id,
                    "idHex": f"0x{can_id:X}",
                    "dir": m.group("dir").upper(),
                    "dlc": dlc,
                    "data": data,
                    "is_fd": is_fd,
                }
            )
        except Exception:
            skipped += 1
            continue
        if len(frames) >= limit:
            break

    if frames:
        t0 = frames[0]["ts"]
        for f in frames:
            f["ts_rel"] = f["ts"] - t0

    return {
        "status": "ok",
        "format": "ASC",
        "decoder": "vda-asc",
        "meta": meta,
        "frameCount": len(frames),
        "skippedLines": skipped,
        "frames": frames,
    }


def frames_to_text(frames: List[Dict[str, Any]]) -> str:
    lines = ["# VDA ASC decode"]
    for f in frames:
        ts = f.get("ts_rel", f.get("ts", 0))
        lines.append(f"{ts:.6f}  {f.get('idHex', hex(f['id']))}  {f.get('data', '')}")
    return "\n".join(lines) + "\n"


def parse_asc_file(path: str, limit: int = 100000) -> Dict[str, Any]:
    text = Path(path).read_text(encoding="utf-8", errors="replace")
    result = parse_asc_text(text, limit)
    result["path"] = path
    return result


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("action", choices=["parse", "analyze"])
    args = ap.parse_args()
    cfg = json.loads(sys.stdin.read() or "{}")
    path = cfg.get("path")
    limit = int(cfg.get("limit", 100000))
    if path:
        result = parse_asc_file(path, limit)
    else:
        result = parse_asc_text(cfg.get("text") or "", limit)
    if args.action == "parse" or result.get("status") != "ok":
        if result.get("frameCount", 0) > 200:
            result = {**result, "framesPreview": result["frames"][:50], "frames": result["frames"][:200]}
        print(json.dumps(result, ensure_ascii=False))
        return
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from can_flow_analyzer import analyze_text  # type: ignore

    analysis = analyze_text(frames_to_text(result.get("frames") or []))
    out = {
        "status": "ok",
        "format": "ASC",
        "decoder": "vda-asc",
        "meta": result.get("meta"),
        "frameCount": result.get("frameCount"),
        "analysis": analysis,
        "framesPreview": (result.get("frames") or [])[:40],
    }
    print(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    main()
