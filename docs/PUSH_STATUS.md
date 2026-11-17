# Push status — P0 complete (2026-11-17)

## On `main`

| Module / doc | Status |
|--------------|--------|
| CHANGELOG (SDLC/P3) | Done |
| wiki/Home 0.2.9 | Done |
| `asc_parser.py` | Done |
| `blf_decoder.py` | Done |
| `blf_probe.py` | Done |
| `can_flow_analyzer.py` | Done |
| `mf4_decoder.py` | Done |
| `mf4_probe.py` | Done |
| `buslog_bridge.py` | Done |
| `buslog_decoder.py` | Done |
| `docs/BLF.md`, `docs/MDF4.md` | Done |
| `sample_min.blf.b64` + restore script | Done |
| `apply_p0_buslog_bundle.py` | Done (optional recovery) |

## Local verification

```bash
python3 -m pytest tests/ -q
node tests/unit/run_unit_tests.js
python3 scripts/restore_sample_min_blf.py  # if binary missing
```

P0 buslog stack is on GitHub `main`.
