"""Smoke tests for Vehicle Debugging Assistant Python backends (simulation / offline)."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
PYTHON_DIR = ROOT / "src" / "python"
RESOURCES = ROOT / "resources"
PY = sys.executable


def run_script(script: str, args: list[str] | None = None, stdin_obj: dict | None = None, timeout: float = 30.0):
    cmd = [PY, str(PYTHON_DIR / script), *(args or [])]
    input_data = json.dumps(stdin_obj).encode() if stdin_obj is not None else None
    proc = subprocess.run(
        cmd,
        input=input_data,
        capture_output=True,
        timeout=timeout,
    )
    stdout = proc.stdout.decode("utf-8", errors="replace")
    stderr = proc.stderr.decode("utf-8", errors="replace")
    data = None
    if stdout.strip():
        last = stdout.strip().splitlines()[-1]
        try:
            data = json.loads(last)
        except json.JSONDecodeError:
            data = None
    return proc.returncode, data, stdout, stderr


def test_uds_read_dtcs_simulation():
    code, data, stdout, stderr = run_script(
        "uds_client.py",
        ["read_dtcs"],
        {"transport": "simulation"},
    )
    assert code == 0, stderr or stdout
    assert data is not None
    assert data.get("status") == "ok"
    assert data.get("mode") in ("simulation", "real")
    assert isinstance(data.get("dtcs"), list)
    assert len(data["dtcs"]) >= 1
    assert "code" in data["dtcs"][0]


def test_log_analyzer_sample_trace():
    sample = RESOURCES / "sample_trace.log"
    assert sample.is_file(), f"missing {sample}"
    code, data, stdout, stderr = run_script("log_analyzer.py", [str(sample)])
    assert code == 0, stderr or stdout
    assert data is not None
    assert data.get("status") == "ok"
    errors = data.get("errors") or []
    assert len(errors) >= 1
    err = errors[0]
    assert "category" in err
    assert "severity" in err
    assert "description" in err


def test_arxml_analyzer_sample():
    sample = RESOURCES / "sample_diagnostic.arxml"
    assert sample.is_file(), f"missing {sample}"
    code, data, stdout, stderr = run_script("arxml_analyzer.py", [str(sample)])
    assert code == 0, stderr or stdout
    assert data is not None
    assert data.get("status") == "ok"
    summary = data.get("summary") or {}
    assert summary.get("demEvents", 0) >= 1 or len(data.get("dtcs") or []) >= 1


def test_doip_discover_simulation():
    code, data, stdout, stderr = run_script("doip_client.py", ["discover"], {})
    assert code == 0, stderr or stdout
    assert data is not None
    assert data.get("status") == "ok"
    assert data.get("mode") in ("simulation", "real", None) or "vehicles" in data
    vehicles = data.get("vehicles") or []
    assert isinstance(vehicles, list)


def test_check_deps_returns_json():
    code, data, stdout, stderr = run_script("check_deps.py")
    assert data is not None
    assert "ok" in data
    assert "modules" in data
