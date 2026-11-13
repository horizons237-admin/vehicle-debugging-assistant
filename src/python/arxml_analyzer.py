#!/usr/bin/env python3
"""
Lightweight ARXML analyzer for Vehicle Debugging Assistant.
Extracts diagnostic-related elements (DEM events, DCM services hints, DTCs)
without requiring a full AUTOSAR stack.

Outputs JSON on stdout for the VS Code extension.
"""

from __future__ import annotations

import sys
import json
import re
from pathlib import Path
from typing import Any, Dict, List
from xml.etree import ElementTree as ET


def local(tag: str) -> str:
    if "}" in tag:
        return tag.rsplit("}", 1)[-1]
    return tag


def text_of(el: ET.Element | None) -> str:
    if el is None or el.text is None:
        return ""
    return el.text.strip()


def find_all(root: ET.Element, name: str) -> List[ET.Element]:
    return [e for e in root.iter() if local(e.tag) == name]


def analyze_arxml(path: str) -> Dict[str, Any]:
    tree = ET.parse(path)
    root = tree.getroot()

    errors: List[Dict[str, Any]] = []
    dtcs: List[Dict[str, Any]] = []
    summary: Dict[str, Any] = {
        "file": str(path),
        "demEvents": 0,
        "dtcValues": 0,
        "diagnosticServices": 0,
        "packages": [],
    }

    for pkg in find_all(root, "AR-PACKAGE"):
        short = text_of(next((c for c in pkg if local(c.tag) == "SHORT-NAME"), None))
        if short:
            summary["packages"].append(short)

    for ev in find_all(root, "DIAGNOSTIC-EVENT"):
        summary["demEvents"] += 1
        name = text_of(next((c for c in ev if local(c.tag) == "SHORT-NAME"), None))
        dtc_val = None
        for child in ev.iter():
            ln = local(child.tag)
            if ln in ("UDS-DTC-VALUE", "DTC-VALUE", "TROUBLE-CODE"):
                dtc_val = text_of(child)
                break
            if ln == "DIAGNOSTIC-TROUBLE-CODE-REF":
                dtc_val = child.get("{http://www.w3.org/1999/xlink}href") or child.get("DEST") or text_of(child)

        if name and not dtc_val:
            m = re.search(r"([PBCU][0-9A-Fa-f]{4})", name)
            if m:
                dtc_val = m.group(1)

        if dtc_val:
            code = dtc_val if re.match(r"^[PBCU]", str(dtc_val)) else str(dtc_val)
            dtcs.append(
                {
                    "code": code[:16],
                    "status": "Configured",
                    "description": f"DEM event: {name or 'unnamed'}",
                    "severity": "major",
                }
            )
            summary["dtcValues"] += 1

    for dtc_el in find_all(root, "DIAGNOSTIC-TROUBLE-CODE"):
        name = text_of(next((c for c in dtc_el if local(c.tag) == "SHORT-NAME"), None))
        val = None
        for child in dtc_el.iter():
            if local(child.tag) in ("UDS-DTC-VALUE", "DTC-VALUE", "TROUBLE-CODE"):
                val = text_of(child)
                break
        code = val or name or "UNKNOWN"
        dtcs.append(
            {
                "code": str(code)[:16],
                "status": "Configured",
                "description": f"DTC definition: {name or code}",
                "severity": "major",
            }
        )
        summary["dtcValues"] += 1

    service_names = set()
    for svc in find_all(root, "DIAGNOSTIC-SERVICE"):
        summary["diagnosticServices"] += 1
        name = text_of(next((c for c in svc if local(c.tag) == "SHORT-NAME"), None))
        if name:
            service_names.add(name)
    for svc in find_all(root, "DIAGNOSTIC-SERVICE-INSTANCE"):
        summary["diagnosticServices"] += 1
        name = text_of(next((c for c in svc if local(c.tag) == "SHORT-NAME"), None))
        if name:
            service_names.add(name)

    if summary["demEvents"] == 0 and summary["dtcValues"] == 0:
        errors.append(
            {
                "category": "configuration",
                "severity": "major",
                "source": "arxml",
                "description": "No DEM events or DTC definitions found in ARXML",
                "recommendation": "Verify DEM/DCM configuration is present in this extract",
                "asilImpact": None,
            }
        )

    if summary["diagnosticServices"] == 0:
        errors.append(
            {
                "category": "configuration",
                "severity": "minor",
                "source": "arxml",
                "description": "No diagnostic service elements detected",
                "recommendation": "Check if DCM services are in another ARXML fragment",
            }
        )

    seen = {}
    for d in dtcs:
        c = d["code"]
        seen[c] = seen.get(c, 0) + 1
    for code, count in seen.items():
        if count > 1:
            errors.append(
                {
                    "category": "configuration",
                    "severity": "major",
                    "source": "arxml",
                    "description": f"Duplicate DTC code '{code}' appears {count} times",
                    "recommendation": "Resolve duplicate DEM/DTC configuration",
                    "asilImpact": "A",
                }
            )

    uniq = {}
    for d in dtcs:
        uniq[d["code"]] = d
    dtcs = list(uniq.values())

    summary["services"] = sorted(service_names)[:50]
    summary["packages"] = summary["packages"][:40]

    return {
        "status": "ok",
        "summary": summary,
        "errors": errors,
        "dtcs": dtcs,
        "source": "arxml",
    }


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "message": "Usage: arxml_analyzer.py <file.arxml>"}))
        sys.exit(1)

    path = sys.argv[1]
    if not Path(path).is_file():
        print(json.dumps({"status": "error", "message": f"File not found: {path}"}))
        sys.exit(1)

    try:
        result = analyze_arxml(path)
        print(json.dumps(result, ensure_ascii=False))
    except ET.ParseError as e:
        print(json.dumps({"status": "error", "message": f"XML parse error: {e}"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
