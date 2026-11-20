# TypeScript / Node unit tests (no Extension Host)

## Run

```bash
npm run test:unit
# or
node tests/unit/run_unit_tests.js
```

## What is covered

| Suite | Checks |
|-------|--------|
| triageLogic | Priority ranking patterns |
| canErrorCodes | Structured CAN error codes |
| obd / p1 / p2 / standards / buslog | Command IDs in `package.json` |
| selfDiag | Self-diagnostic commands present |
| **smokeCriticalCommands** | 10 commands from SMOKE_EXTENSION_HOST.md |
| **j2534Contract** | Discover/Probe + settings |
| **noUnsafeCommands** | No flash/WriteMsgs/eCall-style command IDs |
| **redaction** | VIN / email mask contract |
| **llmUploadDefault** | Remote upload default false |

## What is **not** covered

- Real VS Code Extension Host activation (manual F5 smoke)
- Provider TreeView rendering
- Python backends (use `npm run test:python`)

## CI

`npm test` runs `test:python` then `test:unit`.

Full EH automation → 0.3 (e.g. `@vscode/test-electron`) when needed.
