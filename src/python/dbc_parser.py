#!/usr/bin/env python3
"""Minimal DBC parser for lab symbol resolution."""
from __future__ import annotations
import argparse, json, re, sys
from pathlib import Path
from typing import Any, Dict, List

BO_RE = re.compile(r'^BO_\s+(\d+)\s+(\w+)\s*:\s*(\d+)\s+(\w+)')
SG_RE = re.compile(
    r'^SG_\s+(\w+)\s*(?:M|m\d+)?\s*:\s*(\d+)\|(\d+)@([01])([+-])\s*\(([^,]+),([^)]+)\)\s*\[([^\]]*)\]\s*"([^"]*)"'
)

def parse_dbc(text: str) -> Dict[str, Any]:
    messages: List[Dict[str, Any]] = []
    current = None
    for line in text.splitlines():
        line = line.strip()
        m = BO_RE.match(line)
        if m:
            if current: messages.append(current)
            current = {"id": int(m.group(1)), "name": m.group(2), "dlc": int(m.group(3)), "sender": m.group(4), "signals": []}
            continue
        s = SG_RE.match(line)
        if s and current is not None:
            current["signals"].append({
                "name": s.group(1), "start_bit": int(s.group(2)), "length": int(s.group(3)),
                "byte_order": "motorola" if s.group(4) == "0" else "intel",
                "sign": "signed" if s.group(5) == "-" else "unsigned",
                "factor": float(s.group(6)), "offset": float(s.group(7)), "unit": s.group(9),
            })
    if current: messages.append(current)
    by_id = {str(m["id"]): m["name"] for m in messages}
    return {"status": "ok", "messageCount": len(messages), "messages": messages, "idToName": by_id}

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("action", choices=["parse", "annotate"])
    args = ap.parse_args()
    cfg = json.loads(sys.stdin.read() or "{}")
    if args.action == "parse":
        path = cfg.get("path")
        if not path or not Path(path).is_file():
            print(json.dumps({"status": "error", "message": "DBC path missing"})); return
        print(json.dumps(parse_dbc(Path(path).read_text(encoding="utf-8", errors="replace")), ensure_ascii=False))
        return
    dbc_path, log_path = cfg.get("dbcPath"), cfg.get("logPath")
    if not dbc_path or not log_path:
        print(json.dumps({"status": "error", "message": "dbcPath and logPath required"})); return
    parsed = parse_dbc(Path(dbc_path).read_text(encoding="utf-8", errors="replace"))
    id_to_name = parsed.get("idToName") or {}
    lines = Path(log_path).read_text(encoding="utf-8", errors="replace").splitlines()
    def annot(line):
        def repl(m):
            try: can_id = str(int(m.group(1), 16))
            except Exception: return m.group(0)
            name = id_to_name.get(can_id)
            return f"{m.group(0)}({name})" if name else m.group(0)
        return re.sub(r'\b(0x[0-9A-Fa-f]+)\b', repl, line)
    out = [annot(l) for l in lines[:5000]]
    print(json.dumps({"status": "ok", "messageCount": parsed["messageCount"], "annotatedLines": out, "preview": out[:30]}, ensure_ascii=False))

if __name__ == "__main__":
    main()
