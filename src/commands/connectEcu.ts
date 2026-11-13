import * as vscode from 'vscode';
import { runPythonScript } from '../utils/pythonRunner';
import { getConfig } from '../utils/config';
import {
  isEcuConnected,
  setEcuConnected,
  TransportMode
} from '../utils/sessionStore';

export async function connectEcu(): Promise<boolean> {
  const config = getConfig();

  const ws = vscode.workspace.getConfiguration('vehicleDebug');
  const transport = (ws.get<string>('transport', 'can') || 'can') as TransportMode;
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

  const data = result.data as { status?: string; mode?: string } | undefined;

  if (result.success && (data?.status === 'connected' || data?.status === 'ok')) {
    const mode = data?.mode === 'simulation' ? 'simulation' : 'real';
    setEcuConnected({
      connected: true,
      mode,
      transport: mode === 'simulation' ? 'simulation' : transport,
      sessionName: config.defaultSession,
      lastAction: 'Connected'
    });
    return true;
  }

  if (
    (result.stderr &&
      (result.stderr.includes('No module named') ||
        result.stderr.includes('can') ||
        result.stderr.includes('udsoncan'))) ||
    !result.success
  ) {
    const choice = await vscode.window.showWarningMessage(
      'Hardware/Python dependencies not available. Enter simulation mode?',
      'Yes (Simulation)',
      'Cancel'
    );
    if (choice === 'Yes (Simulation)') {
      setEcuConnected({
        connected: true,
        mode: 'simulation',
        transport: 'simulation',
        sessionName: config.defaultSession,
        lastAction: 'Connected (simulation)'
      });
      vscode.window.showInformationMessage('Running in simulation mode (mock ECU)');
      return true;
    }
  }

  vscode.window.showErrorMessage(`Connection failed: ${result.stderr || result.stdout}`);
  return false;
}

export async function disconnectEcu(): Promise<void> {
  if (!isEcuConnected()) {
    return;
  }
  await runPythonScript('uds_client.py', ['disconnect']);
  setEcuConnected({
    connected: false,
    mode: 'none',
    transport: 'none',
    sessionName: 'None',
    lastAction: 'Disconnected'
  });
}

/** @deprecated Prefer isEcuConnected() from sessionStore */
export function getConnectionState(): boolean {
  return isEcuConnected();
}
