#!/usr/bin/env python3
"""Restore resources/sample_min.blf from sample_min.blf.b64 if binary missing."""
from pathlib import Path
import base64
root = Path(__file__).resolve().parents[1]
b64p = root / "resources" / "sample_min.blf.b64"
out = root / "resources" / "sample_min.blf"
if not b64p.is_file():
    raise SystemExit(f"missing {b64p}")
out.write_bytes(base64.b64decode(b64p.read_text().strip()))
print("wrote", out, out.stat().st_size)
