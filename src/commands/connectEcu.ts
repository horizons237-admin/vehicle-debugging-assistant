import * as vscode from 'vscode';
import { runPythonScript } from '../utils/pythonRunner';
import { getConfig } from '../utils/config';

let isConnected = false;

export async function connectEcu(): Promise<boolean> {
  const config = getConfig();

  const ws = vscode.workspace.getConfiguration('vehicleDebug');
  const transport = ws.get<string>('transport', 'can');
  const doipEnabled = ws.get<boolean>('doip.enabled', false) || transport === 'doip';

  let result;
  if (doipEnabled && transport !== 'simulation') {
    result = await runPythonScript('doip_client.py', ['connect'], {
      host: ws.get<string>('doip.host', '192.168.0.10'),
      port: ws.get<number>('doip.port', 13400),
      logicalAddressTester: ws.get<string>('doip.logicalAddressTester', '0x0E00'),
      logicalAddressEcu: ws.get<string>('doip.logicalAddressEcu', '0x0E80'),
      session: config.defaultSession
    });
  } else {
    result = await runPythonScript('uds_client.py', ['connect'], {
      interface: config.canInterface,
      channel: config.canChannel,
      tx_id: config.txId,
      rx_id: config.rxId,
      session: config.defaultSession,
      transport
    });
  }

  if (result.success && (result.data?.status === 'connected' || result.data?.status === 'ok')) {
    isConnected = true;
    return true;
  }

  if (result.stderr.includes('No module named') || result.stderr.includes('can') || !result.success) {
    const choice = await vscode.window.showWarningMessage(
      'Hardware/Python dependencies not available. Enter simulation mode?',
      'Yes (Simulation)',
      'Cancel'
    );
    if (choice === 'Yes (Simulation)') {
      isConnected = true;
      vscode.window.showInformationMessage('Running in simulation mode (mock ECU)');
      return true;
    }
  }

  vscode.window.showErrorMessage(`Connection failed: ${result.stderr || result.stdout}`);
  return false;
}

export async function disconnectEcu(): Promise<void> {
  if (!isConnected) {
    return;
  }
  await runPythonScript('uds_client.py', ['disconnect']);
  isConnected = false;
}

export function getConnectionState(): boolean {
  return isConnected;
}
