import json, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

def run(script, action, cfg):
    proc = subprocess.run([sys.executable, str(ROOT/'src/python'/script), action],
        input=json.dumps(cfg), text=True, capture_output=True, timeout=10)
    assert proc.returncode == 0, proc.stderr
    return json.loads(proc.stdout.strip().splitlines()[-1])

def test_j2012_known():
    data = run('j2012_lookup.py', 'lookup', {'code': 'P0420'})
    assert data['found'] is True and 'Catalyst' in data['description']

def test_j2012_enrich():
    data = run('j2012_lookup.py', 'enrich', {'dtcs': [{'code': 'U0100'}]})
    assert data['dtcs'][0]['j2012Found'] is True

def test_mode09():
    data = run('obd_client.py', 'read_mode09', {})
    assert data['status']=='ok' and len(data['vin'])==17
