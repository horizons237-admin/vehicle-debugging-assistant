import * as vscode from 'vscode';
import { runPythonScript } from '../utils/pythonRunner';
import { DEFAULT_STATUS_DIDS, normalizeSignals } from '../utils/statusCatalog';
import { StatusTreeProvider } from '../providers/statusTreeProvider';
import { setLastAction, isEcuConnected } from '../utils/sessionStore';

export async function readVehicleStatus(statusProvider: StatusTreeProvider): Promise<void> {
  if (!isEcuConnected()) {
    const choice = await vscode.window.showWarningMessage(
      'Not connected. Connect in simulation to read status DIDs?',
      'Continue anyway',
      'Cancel'
    );
    if (choice !== 'Continue anyway') return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Reading vehicle status signals…',
      cancellable: true
    },
    async (progress, token) => {
      progress.report({ message: 'UDS read_status_batch' });
      const result = await runPythonScript(
        'uds_client.py',
        ['read_status_batch'],
        { dids: DEFAULT_STATUS_DIDS.map((d) => d.did) },
        undefined,
        token
      );

      if (token.isCancellationRequested || result.cancelled) {
        vscode.window.showInformationMessage('Status read cancelled');
        return;
      }

      const data = result.data as { signals?: any[]; status?: string } | undefined;
      if (result.success && data?.signals) {
        const signals = normalizeSignals(data.signals).map((s) => ({ ...s, source: 'uds' as const }));
        statusProvider.setSignals(signals);
        setLastAction(`Read status (${signals.length} signals)`);
        vscode.window.showInformationMessage(`Vehicle status: ${signals.length} signal(s)`);
        return;
      }

      vscode.window.showErrorMessage(
        `Status read failed: ${result.stderr || result.stdout || 'unknown'}`
      );
    }
  );
}
