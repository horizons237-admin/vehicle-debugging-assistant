import json, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "src" / "python" / "obd_client.py"

def run(action, cfg=None):
    proc = subprocess.run([sys.executable, str(SCRIPT), action], input=json.dumps(cfg or {}), text=True, capture_output=True, check=False, timeout=10)
    assert proc.returncode == 0, proc.stderr
    return json.loads(proc.stdout.strip().splitlines()[-1])

def test_obd_connect_simulation():
    data = run("connect", {"forceSimulation": True})
    assert data["status"] == "ok" and data["mode"] == "simulation"

def test_obd_read_pids():
    data = run("read_pids", {})
    assert data["status"] == "ok" and len(data["signals"]) >= 5

def test_obd_read_dtcs():
    data = run("read_dtcs", {})
    assert any(d["code"].startswith("P") for d in data["dtcs"])

def test_obd_read_vin():
    data = run("read_vin", {})
    assert len(data["vin"]) == 17

def test_obd_clear():
    data = run("clear_dtcs", {})
    assert data["status"] == "cleared"
