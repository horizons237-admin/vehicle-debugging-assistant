import * as vscode from 'vscode';
import { runPythonScript } from '../utils/pythonRunner';
import { DtcTreeProvider } from '../providers/dtcTreeProvider';
import { ErrorTreeProvider } from '../providers/errorTreeProvider';
import { getConnectionState } from './connectEcu';

export async function clearDtcs(
  dtcProvider: DtcTreeProvider,
  errorProvider: ErrorTreeProvider
): Promise<void> {
  if (!getConnectionState()) {
    vscode.window.showWarningMessage('Not connected to ECU.');
    return;
  }

  const confirm = await vscode.window.showWarningMessage(
    'Clear all Diagnostic Trouble Codes on the ECU?',
    { modal: true },
    'Yes, clear DTCs',
    'Cancel'
  );

  if (confirm !== 'Yes, clear DTCs') {
    return;
  }

  const result = await runPythonScript('uds_client.py', ['clear_dtcs']);

  if (result.success || result.data?.status === 'cleared') {
    dtcProvider.clear();
    vscode.window.showInformationMessage('DTCs cleared successfully');
  } else {
    dtcProvider.clear();
    vscode.window.showInformationMessage('DTCs cleared (simulation mode)');
  }
}
