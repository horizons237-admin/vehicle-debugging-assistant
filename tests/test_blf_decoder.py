import json, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BLF = ROOT / "resources/sample_min.blf"

def test_blf_lite_decode():
    proc = subprocess.run(
        [sys.executable, str(ROOT / "src/python/blf_decoder.py"), "decode"],
        input=json.dumps({"path": str(BLF), "limit": 10}),
        text=True, capture_output=True, timeout=15,
    )
    assert proc.returncode == 0, proc.stderr
    data = json.loads(proc.stdout.strip().splitlines()[-1])
    assert data["status"] == "ok"
    assert data["frameCount"] >= 1
    assert data["frames"][0]["id"] == 0x7E0
    assert "10" in data["frames"][0]["data"].replace(" ", "") or "02" in data["frames"][0]["data"]

def test_unified_analyze():
    proc = subprocess.run(
        [sys.executable, str(ROOT / "src/python/buslog_decoder.py"), "analyze"],
        input=json.dumps({"path": str(BLF)}),
        text=True, capture_output=True, timeout=15,
    )
    assert proc.returncode == 0, proc.stderr
    data = json.loads(proc.stdout.strip().splitlines()[-1])
    assert data["status"] == "ok"
    assert data.get("format") == "BLF"
    assert "analysis" in data
