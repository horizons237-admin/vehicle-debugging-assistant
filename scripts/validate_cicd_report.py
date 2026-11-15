#!/usr/bin/env python3
"""Validate a VDA CI/CD analysis report JSON (lightweight, no external deps)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

CATEGORIES = {
    "software_bug",
    "communication",
    "safety_mechanism",
    "configuration",
    "timing",
    "unknown",
}
SEVERITIES = {"critical", "major", "minor"}
DTC_SEV = SEVERITIES | {"info"}


def validate(data: dict) -> list[str]:
    errs: list[str] = []
    if not isinstance(data, dict):
        return ["Root must be a JSON object"]

    has = any(k in data for k in ("errors", "dtcs", "issues"))
    if not has:
        errs.append("Expected at least one of: errors, dtcs, issues")

    for i, e in enumerate(data.get("errors") or []):
        if not isinstance(e, dict):
            errs.append(f"errors[{i}] must be object")
            continue
        if not e.get("description"):
            errs.append(f"errors[{i}].description required")
        cat = e.get("category")
        if cat is not None and cat not in CATEGORIES:
            errs.append(f"errors[{i}].category invalid: {cat}")
        sev = e.get("severity")
        if sev is not None and sev not in SEVERITIES:
            errs.append(f"errors[{i}].severity invalid: {sev}")

    for i, d in enumerate(data.get("dtcs") or []):
        if not isinstance(d, dict):
            errs.append(f"dtcs[{i}] must be object")
            continue
        if not d.get("code"):
            errs.append(f"dtcs[{i}].code required")
        sev = d.get("severity")
        if sev is not None and sev not in DTC_SEV:
            errs.append(f"dtcs[{i}].severity invalid: {sev}")

    return errs


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: validate_cicd_report.py <report.json> [report2.json ...]")
        return 2
    rc = 0
    for arg in sys.argv[1:]:
        path = Path(arg)
        print(f"== {path}")
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception as ex:
            print(f"FAIL: cannot parse: {ex}")
            rc = 1
            continue
        problems = validate(data)
        if problems:
            print("FAIL:")
            for p in problems:
                print(f"  - {p}")
            rc = 1
        else:
            n_err = len(data.get("errors") or [])
            n_dtc = len(data.get("dtcs") or [])
            print(f"OK ({n_err} errors, {n_dtc} dtcs)")
    return rc


if __name__ == "__main__":
    sys.exit(main())
