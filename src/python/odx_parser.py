#!/usr/bin/env python3
"""Minimal ODX-like parser (lab) — ASAM ODX subset for diagnostic description."""
from __future__ import annotations
import argparse, json, sys
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any, Dict, List, Optional

def respond(obj: Dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(obj, ensure_ascii=False) + "\n")
    sys.stdout.flush()

def local(tag: str) -> str:
    return tag.split("}")[-1] if "}" in tag else tag

def text_of(el: Optional[ET.Element]) -> str:
    if el is None or el.text is None:
        return ""
    return el.text.strip()

def parse_odx(path: str) -> Dict[str, Any]:
    root = ET.parse(path).getroot()
    layers, dtcs, dids, services = [], [], [], []
    for el in root.iter():
        tag = local(el.tag)
        if tag in ("DTC", "DIAGNOSTIC-TROUBLE-CODE"):
            display = el.attrib.get("DISPLAY") or el.attrib.get("SHORT-NAME") or ""
            code = el.attrib.get("TROUBLE-CODE") or el.attrib.get("ID") or ""
            text = el.attrib.get("TEXT") or ""
            if display or code:
                dtcs.append({"code": display or code, "troubleCode": code, "description": text or display, "level": el.attrib.get("LEVEL", "")})
        if tag in ("DOP", "DATA-OBJECT-PROP", "DATA-IDENTIFIER"):
            name = el.attrib.get("SHORT-NAME") or ""
            did = el.attrib.get("ID") or ""
            if name or did:
                dids.append({"name": name or did, "id": did, "unit": el.attrib.get("UNIT", ""), "category": el.attrib.get("CATEGORY", "")})
        if tag in ("SERVICE", "DIAG-SERVICE"):
            services.append({"sid": el.attrib.get("SID") or el.attrib.get("ID") or "", "name": el.attrib.get("NAME") or ""})
        if tag == "DIAG-LAYER":
            layers.append({
                "name": text_of(el.find("{*}SHORT-NAME")) or el.attrib.get("SHORT-NAME", ""),
                "protocol": text_of(el.find("{*}PROTOCOL")) or el.attrib.get("PROTOCOL", ""),
                "requestId": text_of(el.find("{*}REQUEST-ID")) or el.attrib.get("REQUEST-ID", ""),
                "responseId": text_of(el.find("{*}RESPONSE-ID")) or el.attrib.get("RESPONSE-ID", ""),
            })
    seen, uniq = set(), []
    for d in dtcs:
        if d["code"] in seen: continue
        seen.add(d["code"]); uniq.append(d)
    return {
        "status": "ok", "format": "odx-lab", "path": path,
        "layers": layers, "dtcs": uniq, "dids": dids, "services": services,
        "summary": {"layers": len(layers), "dtcs": len(uniq), "dids": len(dids), "services": len(services)},
        "note": "Lab ODX subset — not a full ASAM ODX 2.2 validator",
    }

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("action", choices=["parse", "list_dtcs", "list_dids"])
    args = ap.parse_args()
    cfg = json.loads(sys.stdin.read() or "{}")
    path = cfg.get("path")
    if not path or not Path(path).is_file():
        respond({"status": "error", "message": "ODX path missing"}); sys.exit(2)
    data = parse_odx(path)
    if args.action == "list_dtcs": respond({"status": "ok", "dtcs": data["dtcs"]})
    elif args.action == "list_dids": respond({"status": "ok", "dids": data["dids"]})
    else: respond(data)

if __name__ == "__main__":
    main()
