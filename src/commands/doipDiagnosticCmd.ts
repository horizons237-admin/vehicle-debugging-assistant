import * as vscode from 'vscode';
import { runPythonScript } from '../utils/pythonRunner';
import { DtcTreeProvider, DtcItem } from '../providers/dtcTreeProvider';
import { setEcuConnected, setLastAction } from '../utils/sessionStore';
import { appendAudit } from '../utils/auditLog';
import { getActiveAddressConfig } from '../utils/ecuRegistry';

export async function doipDiagnosticSession(): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('vehicleDebug');
  const result = await runPythonScript('doip_client.py', ['diagnostic_session'], {
    host: cfg.get('doip.host'),
    port: cfg.get('doip.port'),
    timeout: 1.5,
    session: 'extended'
  });
  const data = (result.data as any) || {};
  setEcuConnected({
    connected: true,
    mode: data.mode === 'real' ? 'real' : 'simulation',
    transport: 'doip',
    sessionName: 'DoIP',
    lastAction: 'DoIP diagnostic session'
  });
  appendAudit({
    level: 'info',
    action: 'doip.diagnostic_session',
    detail: `mode=${data.mode} routing=${JSON.stringify(data.routing || {})}`
  });
  vscode.window.showInformationMessage(
    `DoIP session: ${data.mode || 'n/a'} — ${data.message || ''}`
  );
}

export async function doipReadDtcs(dtcProvider: DtcTreeProvider): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('vehicleDebug');
  const ecu = getActiveAddressConfig();
  const result = await runPythonScript('doip_client.py', ['read_dtcs'], {
    host: cfg.get('doip.host'),
    port: cfg.get('doip.port'),
    timeout: 1.0,
    txId: ecu.txId,
    rxId: ecu.rxId
  });
  const data = (result.data as any) || {};
  if (!data.dtcs) {
    vscode.window.showErrorMessage(`DoIP DTCs failed: ${data.message || result.stderr}`);
    return;
  }
  const dtcs: DtcItem[] = data.dtcs.map((d: any) => ({
    code: d.code,
    status: d.status || 'Confirmed',
    description: d.description || '',
    severity: (d.severity || 'major') as DtcItem['severity']
  }));
  dtcProvider.setDtcs(dtcs);
  setLastAction(`DoIP DTCs ${dtcs.length} [${data.mode}]`);
  appendAudit({ level: 'info', action: 'doip.read_dtcs', detail: `${dtcs.length} dtcs mode=${data.mode}` });
  vscode.window.showInformationMessage(`DoIP: ${dtcs.length} DTC(s) (${data.mode})`);
}
