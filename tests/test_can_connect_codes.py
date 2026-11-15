import json, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "src" / "python" / "uds_client.py"

def run_connect(cfg):
    proc = subprocess.run([sys.executable, str(SCRIPT), "connect"], input=json.dumps(cfg), text=True, capture_output=True, check=False, timeout=10)
    assert proc.returncode == 0, proc.stderr + proc.stdout
    return json.loads(proc.stdout.strip().splitlines()[-1])

def test_forced_simulation_code():
    data = run_connect({"transport": "simulation", "forceSimulation": True})
    assert data["mode"] == "simulation" and data["status"] == "connected"
    assert data.get("code") == "SIM_FORCED"

def test_missing_interface_fallback():
    data = run_connect({"interface": "socketcan", "channel": "vcan_does_not_exist_zz"})
    assert data["status"] == "connected" and data["mode"] == "simulation"
