"""Lightweight triage ranking tests (mirrors extension triage priorities)."""

PRIORITY_SCORE = {
    "critical": 100,
    "high": 80,
    "medium": 50,
    "low": 20,
    "info": 5,
}


def match_pattern(value: str, pattern: str) -> bool:
    v, p = value.upper(), pattern.upper()
    if p.endswith("*"):
        return v.startswith(p[:-1])
    return v == p


def rank_dtc(code: str, severity: str, rules):
    best = None
    for r in rules:
        ok = True
        if "dtcPattern" in r and not match_pattern(code, r["dtcPattern"]):
            ok = False
        if "severity" in r and r["severity"] != severity:
            ok = False
        if ok and ("dtcPattern" in r or "severity" in r):
            if best is None or PRIORITY_SCORE[r["priority"]] > PRIORITY_SCORE[best["priority"]]:
                best = r
    return best["priority"] if best else {"critical": "critical", "major": "high", "minor": "low"}.get(
        severity, "info"
    )


RULES = [
    {"severity": "critical", "priority": "critical"},
    {"dtcPattern": "P0*", "priority": "high"},
    {"dtcPattern": "U*", "priority": "high"},
]


def test_network_dtc_high():
    assert rank_dtc("U0100", "major", RULES) == "high"


def test_powertrain_pattern():
    assert rank_dtc("P0300", "major", RULES) == "high"


def test_critical_severity_wins():
    assert rank_dtc("P0001", "critical", RULES) == "critical"


def test_sample_fleet_file_exists():
    from pathlib import Path

    root = Path(__file__).resolve().parents[1]
    assert (root / "resources" / "sample_fleet.json").exists()


def test_requirements_doc_exists():
    from pathlib import Path

    root = Path(__file__).resolve().parents[1]
    text = (root / "docs" / "REQUIREMENTS.md").read_text(encoding="utf-8")
    assert "REQ-DIAG-001" in text
    assert "REQ-NFR-001" in text
