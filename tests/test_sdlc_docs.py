"""Ensure SDLC completion artifacts exist."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_planning_doc():
    p = ROOT / "docs" / "PLANNING.md"
    assert p.exists()
    assert "Goals" in p.read_text(encoding="utf-8")


def test_maintenance_doc():
    assert (ROOT / "docs" / "MAINTENANCE.md").exists()


def test_test_plan_doc():
    assert (ROOT / "docs" / "TEST_PLAN.md").exists()


def test_traceability_doc():
    assert (ROOT / "docs" / "TRACEABILITY.md").exists()


def test_issue_templates():
    d = ROOT / ".github" / "ISSUE_TEMPLATE"
    assert (d / "bug_report.md").exists()
    assert (d / "feature_request.md").exists()
    assert (d / "safety_concern.md").exists()


def test_changelog_mentions_sdlc_or_p3():
    text = (ROOT / "CHANGELOG.md").read_text(encoding="utf-8")
    assert "P3" in text or "0.1.1" in text
