import json, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

def run_py(script, action, cfg):
    proc = subprocess.run([sys.executable, str(ROOT/'src/python'/script), action],
        input=json.dumps(cfg), text=True, capture_output=True, timeout=15)
    assert proc.returncode == 0, proc.stderr + proc.stdout
    return json.loads(proc.stdout.strip().splitlines()[-1])

def test_odx_parse_sample():
    data = run_py('odx_parser.py', 'parse', {'path': str(ROOT/'resources/sample.odx')})
    assert data['status']=='ok' and data['summary']['dtcs'] >= 2

def test_uds_0x19_report_by_status():
    data = run_py('uds_client.py', 'read_dtc_extended', {'subFunction': '0x02'})
    assert data['service']=='0x19' and len(data['dtcs']) >= 1

def test_uds_0x19_count():
    data = run_py('uds_client.py', 'read_dtc_extended', {'subFunction': '0x01'})
    assert data['subFunction']=='0x01' and data['dtcCount'] >= 1

def test_obd_readiness():
    data = run_py('obd_client.py', 'read_readiness', {})
    assert data['status']=='ok' and 'monitors' in data
