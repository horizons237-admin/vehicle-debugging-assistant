import json, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

def test_parse_sample_dbc():
    proc = subprocess.run([sys.executable, str(ROOT/'src/python/dbc_parser.py'), 'parse'],
        input=json.dumps({'path': str(ROOT/'resources/sample.dbc')}), text=True, capture_output=True, timeout=10)
    assert proc.returncode == 0, proc.stderr
    data = json.loads(proc.stdout.strip().splitlines()[-1])
    assert data['status']=='ok' and data['messageCount']>=2

def test_uds_read_memory_sim():
    proc = subprocess.run([sys.executable, str(ROOT/'src/python/uds_client.py'), 'read_memory'],
        input=json.dumps({'address':'0x100','size':8}), text=True, capture_output=True, timeout=10)
    assert proc.returncode == 0
    data = json.loads(proc.stdout.strip().splitlines()[-1])
    assert data['status']=='ok' and len(data['data'])==8
