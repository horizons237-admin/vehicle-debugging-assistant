import * as vscode from 'vscode';
import { runPythonScript } from '../utils/pythonRunner';
import { DtcTreeProvider, DtcItem } from '../providers/dtcTreeProvider';
import { appendAudit } from '../utils/auditLog';
import { setLastAction, setVehicleIdentity } from '../utils/sessionStore';

export async function loadOdxDescription(): Promise<void> {
  const uri = await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: { ODX: ['odx', 'pdx', 'xml'], All: ['*'] },
    openLabel: 'Load ODX'
  });
  if (!uri?.[0]) return;
  const result = await runPythonScript('odx_parser.py', ['parse'], { path: uri[0].fsPath });
  const data = (result.data as any) || {};
  if (data.status !== 'ok') {
    vscode.window.showErrorMessage(data.message || result.stderr || 'ODX parse failed');
    return;
  }
  const cfg = vscode.workspace.getConfiguration('vehicleDebug');
  await cfg.update('odx.path', uri[0].fsPath, vscode.ConfigurationTarget.Workspace);
  const s = data.summary || {};
  appendAudit({
    level: 'info',
    action: 'odx.load',
    detail: `layers=${s.layers} dtcs=${s.dtcs} dids=${s.dids}`
  });
  const doc = await vscode.workspace.openTextDocument({
    content: JSON.stringify(data, null, 2),
    language: 'json'
  });
  await vscode.window.showTextDocument(doc, { preview: true });
  vscode.window.showInformationMessage(
    `ODX lab: ${s.dtcs || 0} DTC(s), ${s.dids || 0} DID(s), ${s.layers || 0} layer(s)`
  );
}

/** Apply ODX DTC list into the DTC tree (data-driven lab). */
export async function applyOdxDtcsToView(dtcProvider: DtcTreeProvider): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('vehicleDebug');
  let odxPath = cfg.get<string>('odx.path');
  if (!odxPath) {
    await loadOdxDescription();
    odxPath = cfg.get<string>('odx.path');
  }
  if (!odxPath) return;
  const result = await runPythonScript('odx_parser.py', ['list_dtcs'], { path: odxPath });
  const data = (result.data as any) || {};
  const raw = data.dtcs || [];
  const enriched = await runPythonScript('j2012_lookup.py', ['enrich'], { dtcs: raw });
  const ed = (enriched.data as any) || {};
  const list = ed.dtcs || raw;
  const dtcs: DtcItem[] = list.map((d: any) => ({
    code: d.code || d.display,
    status: 'Defined',
    description: d.j2012 || d.description || '',
    severity: 'major' as const
  }));
  dtcProvider.setDtcs(dtcs);
  setLastAction(`ODX DTCs ${dtcs.length}`);
  appendAudit({ level: 'info', action: 'odx.apply_dtcs', detail: String(dtcs.length) });
  vscode.window.showInformationMessage(`ODX → DTC view: ${dtcs.length} code(s)`);
}

export async function readDtcExtended(dtcProvider: DtcTreeProvider): Promise<void> {
  const pick = await vscode.window.showQuickPick(
    [
      { label: '0x02 reportDTCByStatusMask', sub: '0x02' },
      { label: '0x01 reportNumberOfDTCByStatusMask', sub: '0x01' },
      { label: '0x04 reportDTCSnapshotIdentification', sub: '0x04' },
      { label: '0x06 reportDTCExtendedDataRecord', sub: '0x06' },
      { label: '0x0A reportSupportedDTC', sub: '0x0A' }
    ],
    { placeHolder: 'UDS 0x19 sub-function (lab)' }
  );
  if (!pick) return;
  const result = await runPythonScript('uds_client.py', ['read_dtc_extended'], {
    subFunction: pick.sub,
    statusMask: '0xFF'
  });
  const data = (result.data as any) || {};
  if (data.dtcs) {
    const enrich = await runPythonScript('j2012_lookup.py', ['enrich'], { dtcs: data.dtcs });
    const list = ((enrich.data as any)?.dtcs || data.dtcs) as any[];
    const dtcs: DtcItem[] = list.map((d: any) => ({
      code: d.code,
      status: d.status || 'Confirmed',
      description: d.j2012 || d.description || '',
      severity: (d.severity || 'major') as DtcItem['severity'],
      freezeFrame: d.snapshotRecords?.[0]?.data || d.freezeFrame
    }));
    dtcProvider.setDtcs(dtcs);
  }
  const doc = await vscode.workspace.openTextDocument({
    content: JSON.stringify(data, null, 2),
    language: 'json'
  });
  await vscode.window.showTextDocument(doc, { preview: true });
  setLastAction(`UDS 0x19 ${pick.sub}`);
  appendAudit({ level: 'info', action: 'uds.0x19', detail: pick.sub });
  vscode.window.showInformationMessage(`UDS 0x19 ${pick.sub} (${data.mode || 'n/a'})`);
}

export async function readObdReadiness(): Promise<void> {
  const result = await runPythonScript('obd_client.py', ['read_readiness'], {});
  const data = (result.data as any) || {};
  if (data.status !== 'ok') {
    vscode.window.showErrorMessage(data.message || result.stderr || 'readiness failed');
    return;
  }
  const doc = await vscode.workspace.openTextDocument({
    content: JSON.stringify(data, null, 2),
    language: 'json'
  });
  await vscode.window.showTextDocument(doc, { preview: true });
  const incomplete = (data.incomplete || []).join(', ') || 'none';
  appendAudit({ level: 'info', action: 'obd.readiness', detail: `ready=${data.ready}` });
  vscode.window.showInformationMessage(
    data.ready
      ? 'OBD readiness: all available monitors complete (lab)'
      : `OBD readiness incomplete: ${incomplete}`
  );
}

export async function readObdMode09(): Promise<void> {
  const result = await runPythonScript('obd_client.py', ['read_mode09'], {});
  const data = (result.data as any) || {};
  if (data.vin) {
    setVehicleIdentity({ vin: data.vin });
  }
  const doc = await vscode.workspace.openTextDocument({
    content: JSON.stringify(data, null, 2),
    language: 'json'
  });
  await vscode.window.showTextDocument(doc, { preview: true });
  appendAudit({ level: 'info', action: 'obd.mode09' });
  vscode.window.showInformationMessage(
    `OBD Mode 09: VIN ${data.vin || 'n/a'}, ${(data.calibrationIds || []).length} CALID(s)`
  );
}

export async function lookupJ2012(): Promise<void> {
  const code = await vscode.window.showInputBox({
    prompt: 'DTC code (e.g. P0420)',
    placeHolder: 'P0420'
  });
  if (!code) return;
  const result = await runPythonScript('j2012_lookup.py', ['lookup'], { code });
  const data = (result.data as any) || {};
  vscode.window.showInformationMessage(
    data.found ? `${data.code}: ${data.description}` : data.description || 'Not found'
  );
}
