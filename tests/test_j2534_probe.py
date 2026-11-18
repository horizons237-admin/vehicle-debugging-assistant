"""J2534 discovery / analysis-only probe — safe on non-Windows CI."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "src" / "python" / "j2534_probe.py"


def _run(args: list[str], stdin: str | None = None) -> dict:
    proc = subprocess.run(
        [sys.executable, str(SCRIPT), *args],
        input=stdin,
        capture_output=True,
        text=True,
        timeout=15,
    )
    line = (proc.stdout or "").strip().splitlines()
    assert line, f"no stdout: stderr={proc.stderr!r}"
    return json.loads(line[-1])


def test_script_exists():
    assert SCRIPT.is_file()


def test_discover_on_non_windows_or_windows():
    data = _run(["discover"])
    assert data.get("analysisOnly") is True
    assert "drivers" in data
    if data.get("status") == "unsupported_os":
        assert data.get("os") != "Windows"
    else:
        assert data.get("status") == "ok"
        assert isinstance(data.get("driverCount"), int)


def test_probe_requires_library():
    data = _run(["probe"])
    assert data.get("analysisOnly") is True
    assert data.get("status") in ("error", "unsupported_os")


def test_probe_load_only_missing_dll():
    data = _run(["probe_load_only", "--library", "/nonexistent/j2534.dll"])
    assert data.get("analysisOnly") is True
    assert data.get("status") in ("error", "unsupported_os")
