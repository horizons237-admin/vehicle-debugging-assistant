#!/usr/bin/env python3
"""Extract P0 buslog packs into repo root.

Supports:
  resources/p0_core3.b64
  resources/p0_core2.b64
  resources/p0_buslog_bundle.tar.gz.b64 (+ optional part1/part2)
  resources/sample_min.blf.b64
"""
from __future__ import annotations

import base64
import io
import tarfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
res = root / "resources"


def extract_b64_tar(path: Path) -> list[str]:
    data = base64.b64decode(path.read_text().strip())
    with tarfile.open(fileobj=io.BytesIO(data), mode="r:gz") as tar:
        names = tar.getnames()
        tar.extractall(path=root)
    return names


def main() -> None:
    extracted: list[str] = []
    for name in ("p0_core3.b64", "p0_core2.b64"):
        p = res / name
        if p.is_file():
            extracted.extend(extract_b64_tar(p))
            print("ok", name)

    single = res / "p0_buslog_bundle.tar.gz.b64"
    p1, p2 = res / "p0_buslog_bundle.tar.gz.b64.part1", res / "p0_buslog_bundle.tar.gz.b64.part2"
    if not single.is_file() and p1.is_file() and p2.is_file():
        single.write_text(p1.read_text().strip() + p2.read_text().strip() + "\n")
    if single.is_file():
        extracted.extend(extract_b64_tar(single))
        print("ok full bundle")

    blf_b64 = res / "sample_min.blf.b64"
    if blf_b64.is_file():
        out = res / "sample_min.blf"
        out.write_bytes(base64.b64decode(blf_b64.read_text().strip()))
        print("ok", out, out.stat().st_size)

    if not extracted and not blf_b64.is_file():
        raise SystemExit("no P0 packs found under resources/")
    print("extracted files:")
    for n in sorted(set(extracted)):
        print(" -", n)


if __name__ == "__main__":
    main()
