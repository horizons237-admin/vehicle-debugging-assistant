import json, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
ASC = ROOT / "resources/sample.asc"

def run(action):
    proc = subprocess.run(
        [sys.executable, str(ROOT / "src/python/asc_parser.py"), action],
        input=json.dumps({"path": str(ASC)}),
        text=True, capture_output=True, timeout=15,
    )
    assert proc.returncode == 0, proc.stderr + proc.stdout
    return json.loads(proc.stdout.strip().splitlines()[-1])

def test_parse_sample_asc():
    data = run("parse")
    assert data["status"] == "ok"
    assert data["frameCount"] >= 6
    ids = {f["id"] for f in data["frames"]}
    assert 0x7E0 in ids and 0x7E8 in ids

def test_analyze_asc():
    data = run("analyze")
    assert data["status"] == "ok"
    assert "analysis" in data
    assert data["analysis"]["frameCount"] >= 1
