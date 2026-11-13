import * as vscode from 'vscode';
import { runPythonScript } from '../utils/pythonRunner';
import { getConnectionState } from './connectEcu';

const COMMON_DIDS = [
  { label: 'VIN (0xF190)', did: '0xF190' },
  { label: 'Part Number (0xF187)', did: '0xF187' },
  { label: 'Supplier (0xF18A)', did: '0xF18A' },
  { label: 'Hardware Number (0xF191)', did: '0xF191' },
  { label: 'Software Version (0xF195)', did: '0xF195' },
  { label: 'Custom DID...', did: 'custom' }
];

export async function readDid(): Promise<void> {
  if (!getConnectionState()) {
    vscode.window.showWarningMessage('Not connected to ECU. Connect first.');
    return;
  }

  const picked = await vscode.window.showQuickPick(COMMON_DIDS, {
    placeHolder: 'Select Data Identifier to read'
  });
  if (!picked) {
    return;
  }

  let did = picked.did;
  if (did === 'custom') {
    const input = await vscode.window.showInputBox({
      prompt: 'Enter DID (hex, e.g. 0xF190)',
      value: '0xF190'
    });
    if (!input) {
      return;
    }
    did = input.trim();
  }

  const result = await runPythonScript('uds_client.py', ['read_did'], { did });

  if (result.success && result.data?.value) {
    const msg = `${result.data.name || did}: ${result.data.value}`;
    vscode.window.showInformationMessage(msg);
    const channel = vscode.window.createOutputChannel('Vehicle Debug');
    channel.appendLine(`[DID] ${msg} (mode: ${result.data.mode || 'unknown'})`);
    channel.show(true);
  } else {
    vscode.window.showErrorMessage(`Read DID failed: ${result.stderr || result.stdout}`);
  }
}
