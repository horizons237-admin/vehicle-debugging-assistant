import * as vscode from 'vscode';
import { runPythonScript } from '../utils/pythonRunner';
import { normalizeSignals } from '../utils/statusCatalog';
import { StatusTreeProvider } from '../providers/statusTreeProvider';
import { setLastAction, isEcuConnected } from '../utils/sessionStore';

const EV_DIDS = [
  '0xF480',
  '0xF481',
  '0xF484',
  '0xF485',
  '0xF486',
  '0xF448',
  '0xF45C'
];

export async function readEvChargingStatus(statusProvider: StatusTreeProvider): Promise<void> {
  if (!isEcuConnected()) {
    const c = await vscode.window.showWarningMessage(
      'Not connected. Continue with simulation DIDs?',
      'Continue',
      'Cancel'
    );
    if (c !== 'Continue') return;
  }

  const result = await runPythonScript('uds_client.py', ['read_status_batch'], { dids: EV_DIDS });
  const data = result.data as { signals?: any[] } | undefined;
  if (result.success && data?.signals) {
    const signals = normalizeSignals(data.signals).map((s) => ({ ...s, source: 'uds' as const }));
    const byDid = new Map(statusProvider.getSignals().map((s) => [s.did, s]));
    for (const s of signals) byDid.set(s.did, s);
    statusProvider.setSignals([...byDid.values()]);
    setLastAction(`EV/charging status (${signals.length})`);
    vscode.window.showInformationMessage(`EV/charging signals: ${signals.length}`);
    return;
  }
  vscode.window.showErrorMessage(`EV status failed: ${result.stderr || result.stdout}`);
}
