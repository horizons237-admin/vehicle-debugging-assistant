# Extension Host smoke (0.3 plan)

## Today (manual)

Follow [SMOKE_EXTENSION_HOST.md](SMOKE_EXTENSION_HOST.md) after `npm run compile` + **F5**.

Node contracts for the same 10 command IDs: `npm run test:unit` (`smokeCriticalCommands`).

## Target (automated)

Use `@vscode/test-electron` when ready to invest in CI minutes:

```bash
npm i -D @vscode/test-electron
# tests/eh/smoke.cjs — launch VS Code, execute commands via vscode.commands.executeCommand
```

Suggested first automated assertions:

1. Extension activates without throw  
2. `vehicleDebug.runSelfDiagnostic` completes  
3. `vehicleDebug.connectEcu` (simulation)  
4. No command id in banned list (already in Node unit tests)

## Why not fully wired in 0.2.9

- Downloads VS Code binary on CI agents  
- Flaky without display / xvfb on some runners  
- Node unit tests already lock **command contracts** and **safety titles**

## CI policy (recommended)

| Job | Gate |
|-----|------|
| pytest + `test:unit` | Required on every PR |
| EH smoke | Nightly or pre-release only |
