import * as vscode from 'vscode';
import * as os from 'os';
import { createJ2534Stub, getJ2534StatusMessage } from '../utils/j2534Adapter';
import { createDpduStubReport, getDpduStatusMessage } from '../utils/dpduAdapter';
import { appendAudit } from '../utils/auditLog';
import { runPythonScript } from '../utils/pythonRunner';

/** Lab status: stub + config path (no mandatory load). */
export async function showJ2534Status(): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('vehicleDebug');
  const libraryPath = (cfg.get<string>('j2534.libraryPath') || '').trim();
  const stub = createJ2534Stub();
  const result = await stub.openChannel({ protocol: 'ISO15765', baudRate: 500000 });
  appendAudit({ level: 'info', action: 'j2534.status', detail: result.message });
  const doc = await vscode.workspace.openTextDocument({
    content: JSON.stringify(
      {
        j2534: {
          status: stub.status,
          vendor: stub.vendor,
          configuredLibraryPath: libraryPath || null,
          openChannel: result,
          note: getJ2534StatusMessage(),
          platform: os.platform(),
          analysisOnly: true
        },
        dpdu: createDpduStubReport(),
        standards: ['SAE J2534-1', 'SAE J2534-2 (extensions)', 'ISO 22900 D-PDU'],
        nextSteps: [
          'Run J2534: Discover Drivers (registry) on Windows',
          'Set vehicleDebug.j2534.libraryPath to a FunctionLibrary DLL',
          'Run J2534: Probe Library (analysis-only) — Open/ReadVersion/Close only'
        ]
      },
      null,
      2
    ),
    language: 'json'
  });
  await vscode.window.showTextDocument(doc, { preview: true });
  vscode.window.showWarningMessage(getJ2534StatusMessage());
}

export async function showDpduStatus(): Promise<void> {
  const report = createDpduStubReport();
  appendAudit({ level: 'info', action: 'dpdu.status' });
  const doc = await vscode.workspace.openTextDocument({
    content: JSON.stringify(report, null, 2),
    language: 'json'
  });
  await vscode.window.showTextDocument(doc, { preview: true });
  vscode.window.showWarningMessage(getDpduStatusMessage());
}

/** Windows registry discovery — does not load any DLL. */
export async function discoverJ2534Drivers(): Promise<void> {
  const result = await runPythonScript('j2534_probe.py', ['discover'], {});
  const data = (result.data as any) || {};
  appendAudit({
    level: 'info',
    action: 'j2534.discover',
    detail: `status=${data.status} count=${data.driverCount ?? 0}`
  });

  const doc = await vscode.workspace.openTextDocument({
    content: JSON.stringify(data, null, 2),
    language: 'json'
  });
  await vscode.window.showTextDocument(doc, { preview: true });

  if (data.status === 'unsupported_os') {
    vscode.window.showWarningMessage(data.message || 'J2534 registry discovery is Windows-only');
    return;
  }
  if (data.status !== 'ok') {
    vscode.window.showErrorMessage(data.message || result.stderr || 'J2534 discover failed');
    return;
  }

  const count = data.driverCount || 0;
  const pick = await vscode.window.showInformationMessage(
    `J2534: ${count} driver(s) found in registry (discovery only — no DLL loaded).`,
    count > 0 ? 'Set libraryPath from first with file' : 'OK'
  );
  if (pick && pick.startsWith('Set libraryPath') && Array.isArray(data.drivers)) {
    const withFile = data.drivers.find((d: any) => d.libraryExists && d.FunctionLibrary);
    if (withFile?.FunctionLibrary) {
      const cfg = vscode.workspace.getConfiguration('vehicleDebug');
      await cfg.update(
        'j2534.libraryPath',
        withFile.FunctionLibrary,
        vscode.ConfigurationTarget.Workspace
      );
      vscode.window.showInformationMessage(
        `vehicleDebug.j2534.libraryPath → ${withFile.FunctionLibrary}`
      );
    } else {
      vscode.window.showWarningMessage('No driver entry had an existing FunctionLibrary file path.');
    }
  }
}

/** Analysis-only: Open / ReadVersion / Close. No channel, no writes. */
export async function probeJ2534Library(): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('vehicleDebug');
  let libraryPath = (cfg.get<string>('j2534.libraryPath') || '').trim();

  if (!libraryPath) {
    const uri = await vscode.window.showOpenDialog({
      canSelectMany: false,
      filters: { DLL: ['dll'], All: ['*'] },
      openLabel: 'Select J2534 FunctionLibrary DLL'
    });
    if (!uri?.[0]) {
      vscode.window.showWarningMessage(
        'Set vehicleDebug.j2534.libraryPath or pick a DLL to probe (analysis-only).'
      );
      return;
    }
    libraryPath = uri[0].fsPath;
    await cfg.update('j2534.libraryPath', libraryPath, vscode.ConfigurationTarget.Workspace);
  }

  const confirm = await vscode.window.showWarningMessage(
    'J2534 probe is analysis-only: Open / ReadVersion / Close. ' +
      'No channel connect, no writes, no programming. Continue?',
    { modal: true },
    'Probe'
  );
  if (confirm !== 'Probe') return;

  const py32 = (cfg.get<string>('j2534.pythonPath32') || '').trim();
  const result = await runPythonScript(
    'j2534_probe.py',
    ['probe'],
    { libraryPath },
    30_000,
    undefined,
    py32 || undefined
  );
  const data = (result.data as any) || {};
  appendAudit({
    level: 'info',
    action: 'j2534.probe',
    detail: `status=${data.status} lib=${libraryPath}`
  });

  const doc = await vscode.workspace.openTextDocument({
    content: JSON.stringify(data, null, 2),
    language: 'json'
  });
  await vscode.window.showTextDocument(doc, { preview: true });

  if (data.status === 'ok') {
    const ver = data.PassThruReadVersion || {};
    vscode.window.showInformationMessage(
      `J2534 probe OK — API ${ver.apiVersion || '?'} / DLL ${ver.dllVersion || '?'}`
    );
  } else {
    const extra = data.bitnessWarning ? ` ${data.bitnessWarning}` : '';
    vscode.window.showErrorMessage(
      (data.message || result.stderr || 'J2534 probe failed') + extra
    );
  }
}
