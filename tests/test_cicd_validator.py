from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def test_validate_sample_report():
    script = ROOT / "scripts" / "validate_cicd_report.py"
    sample = ROOT / "resources" / "sample_cicd_report.json"
    r = subprocess.run([sys.executable, str(script), str(sample)], capture_output=True, text=True)
    assert r.returncode == 0, r.stdout + r.stderr
    assert "OK" in r.stdout


def test_schema_file_exists():
    assert (ROOT / "resources" / "schemas" / "vda-cicd-report.schema.json").exists()


def test_cicd_doc_exists():
    assert (ROOT / "docs" / "CICD.md").exists()
