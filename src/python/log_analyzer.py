#!/usr/bin/env python3
"""
Simple log / trace analyzer for Vehicle Debugging Assistant.
Looks for common automotive diagnostic patterns (NRC, DTC, timeouts, safety events...).
"""

import sys
import json
import re
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Dict, Any


PATTERNS = [
    {
        "regex": re.compile(r"NRC\s*(?:0x)?([0-9A-Fa-f]{2})", re.I),
        "category": "communication",
        "severity": "major",
        "desc": "Negative Response Code"
    },
    {
        "regex": re.compile(r"(timeout|P2\*|no\s*response|response\s*pending)", re.I),
        "category": "timing",
        "severity": "major",
        "desc": "Timing / timeout issue"
    },
    {
        "regex": re.compile(r"\b([PBCU][0-9A-Fa-f]{4})\b"),
        "category": "safety_mechanism",
        "severity": "major",
        "desc": "DTC referenced"
    },
    {
        "regex": re.compile(r"(watchdog|WdgM|deadline\s*supervision|alive\s*supervision)", re.I),
        "category": "safety_mechanism",
        "severity": "critical",
        "desc": "Watchdog / supervision event"
    },
    {
        "regex": re.compile(r"(segfault|exception|assert|fatal\s*error|kernel\s*panic)", re.I),
        "category": "software_bug",
        "severity": "critical",
        "desc": "Software exception / fatal"
    },
    {
        "regex": re.compile(r"(MISRA|rule\s*violation|coding\s*guideline)", re.I),
        "category": "software_bug",
        "severity": "minor",
        "desc": "Coding guideline mention"
    },
    {
        "regex": re.compile(r"(DEM|FiM|safe\s*state|function\s*inhibition)", re.I),
        "category": "safety_mechanism",
        "severity": "major",
        "desc": "AUTOSAR safety module event"
    },
]


def analyze_file(path: str, enable_safety: bool = True) -> List[Dict[str, Any]]:
    errors: List[Dict[str, Any]] = []
    try:
        text = Path(path).read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        return [{
            "id": "file-error",
            "category": "unknown",
            "severity": "major",
            "source": "log",
            "description": f"Cannot read file: {e}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }]

    lines = text.splitlines()
    for idx, line in enumerate(lines):
        for p in PATTERNS:
            m = p["regex"].search(line)
            if m:
                asil = None
                if enable_safety:
                    if p["severity"] == "critical":
                        asil = "B"
                    elif p["category"] == "safety_mechanism":
                        asil = "A"

                errors.append({
                    "id": f"log-{idx}-{len(errors)}",
                    "category": p["category"],
                    "severity": p["severity"],
                    "asilImpact": asil,
                    "source": "log",
                    "description": f"{p['desc']}: {line.strip()[:140]}",
                    "evidence": {"line": idx + 1, "content": line.strip()},
                    "recommendation": "Correlate with DTC list and recent test runs",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
                break

    return errors[:80]


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"errors": [], "error": "No file path provided"}))
        sys.exit(1)

    file_path = sys.argv[1]
    enable_safety = True

    if not sys.stdin.isatty():
        try:
            cfg = json.load(sys.stdin)
            enable_safety = cfg.get("enable_safety", True)
        except Exception:
            pass

    errors = analyze_file(file_path, enable_safety)
    print(json.dumps({"status": "ok", "errors": errors, "count": len(errors)}))


if __name__ == "__main__":
    main()
