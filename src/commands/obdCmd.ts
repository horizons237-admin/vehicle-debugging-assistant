import * as vscode from 'vscode';
import { runPythonScript } from '../utils/pythonRunner';
import { DtcTreeProvider, DtcItem } from '../providers/dtcTreeProvider';
import { StatusTreeProvider } from '../providers/statusTreeProvider';
import { StatusSignal } from '../utils/statusCatalog';
import { setEcuConnected, setVehicleIdentity } from '../utils/sessionStore';
import { getConfig } from '../utils/config';

function asData(result: { success: boolean; data?: unknown; stderr: string }): any {
  return (result.data as any) || {};
}

export async function obdConnect(): Promise<void> {
  const transport = vscode.workspace.getConfiguration('vehicleDebug').get('transport', 'simulation');
  const forceSimulation = transport === 'simulation';
  const result = await runPythonScript('obd_client.py', ['connect'], {
    transport,
    forceSimulation,
    interface: vscode.workspace.getConfiguration('vehicleDebug').get('canInterface'),
    channel: vscode.workspace.getConfiguration('vehicleDebug').get('canChannel')
  });
  const data = asData(result);
  if (data.status === 'ok' || data.mode === 'simulation') {
    setEcuConnected({
      connected: true,
      mode: 'simulation',
      transport: 'simulation',
      sessionName: 'OBD-II',
      lastAction: 'OBD-II connected (simulation)'
    });
    vscode.window.showInformationMessage(`OBD-II: ${data.message || data.mode || 'ready'}`);
    return;
  }
  if (data.code === 'OBD_DEPS_MISSING' || data.fallback === 'simulation') {
    const choice = await vscode.window.showWarningMessage(
      `${data.message || 'OBD adapter unavailable'}. Continue in simulation?`,
      'Simulation',
      'Cancel'
    );
    if (choice === 'Simulation') {
      await runPythonScript('obd_client.py', ['connect'], { forceSimulation: true });
      setEcuConnected({
        connected: true,
        mode: 'simulation',
        transport: 'simulation',
        sessionName: 'OBD-II',
        lastAction: 'OBD-II simulation'
      });
      vscode.window.showInformationMessage('OBD-II simulation ready');
    }
    return;
  }
  vscode.window.showErrorMessage(
    `OBD-II connect failed [${data.code || 'ERR'}]: ${data.message || result.stderr || 'unknown'}`
  );
}

export async function obdReadPids(statusProvider: StatusTreeProvider): Promise<void> {
  const result = await runPythonScript('obd_client.py', ['read_pids'], {});
  const data = asData(result);
  if (!result.success && !data.signals) {
    vscode.window.showErrorMessage(`OBD PIDs failed: ${data.message || result.stderr}`);
    return;
  }
  const signals: StatusSignal[] = (data.signals || []).map((s: any) => ({
    did: `PID_${s.pid || '?'}`,
    name: s.name || `PID ${s.pid}`,
    value: s.value ?? null,
    unit: s.unit || '',
    category: 'obd2',
    source: 'mock' as const,
    timestamp: new Date().toISOString()
  }));
  statusProvider.setSignals(signals);
  setEcuConnected({ connected: true, lastAction: `OBD PIDs ${signals.length}` });
  vscode.window.showInformationMessage(`OBD-II: ${signals.length} PID(s) [${data.mode || 'sim'}]`);
}

export async function obdReadDtcs(dtcProvider: DtcTreeProvider): Promise<void> {
  const result = await runPythonScript('obd_client.py', ['read_dtcs'], {});
  const data = asData(result);
  if (!data.dtcs) {
    vscode.window.showErrorMessage(`OBD DTCs failed: ${data.message || result.stderr}`);
    return;
  }
  const dtcs: DtcItem[] = data.dtcs.map((d: any) => ({
    code: d.code,
    status: d.status || 'Confirmed',
    description: d.description || '',
    severity: (d.severity || 'major') as DtcItem['severity'],
    freezeFrame: d.freezeFrame
  }));
  dtcProvider.setDtcs(dtcs);
  setEcuConnected({ connected: true, lastAction: `OBD DTCs ${dtcs.length}` });
  vscode.window.showInformationMessage(`OBD-II: ${dtcs.length} DTC(s)`);
}

export async function obdClearDtcs(): Promise<void> {
  const confirm = await vscode.window.showWarningMessage(
    'Clear OBD-II DTCs? (simulation does not write hardware)',
    { modal: true },
    'Clear'
  );
  if (confirm !== 'Clear') return;
  const result = await runPythonScript('obd_client.py', ['clear_dtcs'], {});
  const data = asData(result);
  vscode.window.showInformationMessage(data.message || `OBD clear: ${data.status}`);
}

export async function obdReadVin(): Promise<void> {
  const result = await runPythonScript('obd_client.py', ['read_vin'], {});
  const data = asData(result);
  if (data.vin) {
    setVehicleIdentity({ vin: data.vin });
    vscode.window.showInformationMessage(`VIN (OBD Mode 09): ${data.vin}`);
  } else {
    vscode.window.showErrorMessage(`OBD VIN failed: ${data.message || result.stderr}`);
  }
}
