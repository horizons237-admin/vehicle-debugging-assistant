#!/usr/bin/env python3
"""Unified BLF/MF4 decoder entry for VDA."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("action", choices=["decode", "analyze"])
    args = ap.parse_args()
    cfg = json.loads(sys.stdin.read() or "{}")
    path = cfg.get("path")
    if not path or not Path(path).is_file():
        print(json.dumps({"status": "error", "message": "path required"}))
        sys.exit(2)
    magic = Path(path).read_bytes()[:4]
    if magic == b"LOGG":
        import blf_decoder as dec  # type: ignore

        limit = int(cfg.get("limit", 10000))
        result = dec.decode_blf(path, limit)
        if args.action == "analyze" and result.get("status") == "ok":
            from can_flow_analyzer import analyze_text  # type: ignore

            text = dec.frames_to_text(result.get("frames") or [])
            out = {
                "status": "ok",
                "format": "BLF",
                "decoder": result.get("decoder"),
                "header": result.get("header"),
                "frameCount": result.get("frameCount"),
                "analysis": analyze_text(text),
                "framesPreview": (result.get("frames") or [])[:30],
            }
            print(json.dumps(out, ensure_ascii=False))
        else:
            result["format"] = "BLF"
            print(json.dumps(result, ensure_ascii=False))
        return

    if magic.startswith(b"MDF"):
        import mf4_decoder as mdec  # type: ignore

        limit = int(cfg.get("limit", 5000))
        result = mdec.decode_mf4(path, limit)
        if args.action == "analyze" and result.get("status") == "ok" and result.get("frames"):
            from can_flow_analyzer import analyze_text  # type: ignore

            text = mdec.frames_to_text(result["frames"])
            result["analysis"] = analyze_text(text)
            result["framesPreview"] = result["frames"][:30]
            result.pop("frames", None)
        result["format"] = "MF4"
        print(json.dumps(result, ensure_ascii=False))
        return

    lower = path.lower()
    head = Path(path).read_bytes()[:240].lower()
    if lower.endswith(".asc") or b"base hex" in head or b"timestamps" in head:
        import asc_parser as adec  # type: ignore

        limit = int(cfg.get("limit", 100000))
        result = adec.parse_asc_file(path, limit)
        if args.action == "analyze" and result.get("status") == "ok":
            from can_flow_analyzer import analyze_text  # type: ignore

            text = adec.frames_to_text(result.get("frames") or [])
            out = {
                "status": "ok",
                "format": "ASC",
                "decoder": "vda-asc",
                "meta": result.get("meta"),
                "frameCount": result.get("frameCount"),
                "analysis": analyze_text(text),
                "framesPreview": (result.get("frames") or [])[:40],
            }
            print(json.dumps(out, ensure_ascii=False))
        else:
            if result.get("frameCount", 0) > 200:
                result["framesPreview"] = result.get("frames", [])[:50]
                result["frames"] = result.get("frames", [])[:200]
            print(json.dumps(result, ensure_ascii=False))
        return

    print(
        json.dumps(
            {
                "status": "error",
                "message": f"Unknown format (magic={magic!r})",
                "hint": "Expected BLF (LOGG), MF4 (MDF), or ASC",
            }
        )
    )


if __name__ == "__main__":
    main()
