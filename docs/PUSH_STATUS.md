# Push status — P0 (2026-11-17)

## Done on `main`

| Item | Status |
|------|--------|
| CHANGELOG (SDLC/P3 + full 0.2.x narrative) | Done — pytest `test_sdlc_docs` green |
| wiki/Home version **0.2.9** | Done |
| `src/python/asc_parser.py` | Done |
| `src/python/buslog_decoder.py` | Done (earlier) |
| `src/python/mf4_probe.py` | Done |
| `scripts/apply_p0_buslog_bundle.py` | Done |
| `resources/sample_min.blf.b64` | Done |
| `scripts/restore_sample_min_blf.py` | Done |
| BPMN / UML / wiki process pages | Done |

## Still local-only (need direct push or `apply_p0_buslog_bundle`)

After clone, if these are missing:

```bash
python3 scripts/apply_p0_buslog_bundle.py
```

Requires local packs under `resources/` (`p0_core3.b64` / `p0_core2.b64` or parts).

| File | Role |
|------|------|
| `src/python/blf_decoder.py` | BLF lite decoder |
| `src/python/can_flow_analyzer.py` | CAN/UDS flow analysis |
| `src/python/mf4_decoder.py` | MF4 facade |
| `src/python/blf_probe.py` | BLF header probe |
| `src/python/buslog_bridge.py` | Binary→text bridge |
| `docs/BLF.md`, `docs/MDF4.md` | Format docs |
| `resources/sample_min.blf` | Binary sample (restore from `.b64`) |

## Local verification

```bash
python3 -m pytest tests/ -q   # all green after CHANGELOG fix
node tests/unit/run_unit_tests.js
```
