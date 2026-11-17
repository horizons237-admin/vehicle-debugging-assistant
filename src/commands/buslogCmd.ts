import * as vscode from 'vscode';
import { runPythonScript } from '../utils/pythonRunner';
import { appendAudit } from '../utils/auditLog';

async function pickBuslog(): Promise<vscode.Uri | undefined> {
  const uris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: {
      'Bus logs': ['blf', 'mf4', 'mdf', 'asc'],
      ASC: ['asc'],
      BLF: ['blf'],
      MF4: ['mf4', 'mdf'],
      All: ['*']
    },
    openLabel: 'Open bus log'
  });
  return uris?.[0];
}

export async function probeBuslogHeader(): Promise<void> {
  const uri = await pickBuslog();
  if (!uri) return;
  const path = uri.fsPath;
  const lower = path.toLowerCase();
  const script = lower.endsWith('.mf4') || lower.endsWith('.mdf') ? 'mf4_probe.py' : 'blf_probe.py';
  const result = await runPythonScript(script, ['probe'], { path });
  const data = (result.data as any) || {};
  const doc = await vscode.workspace.openTextDocument({
    content: JSON.stringify(data, null, 2),
    language: 'json'
  });
  await vscode.window.showTextDocument(doc, { preview: true });
  appendAudit({ level: 'info', action: 'buslog.probe', detail: String(data.format || data.status) });
  if (data.status === 'ok') {
    vscode.window.showInformationMessage(`Bus log probe: ${data.format || 'ok'}`);
  } else {
    vscode.window.showWarningMessage(data.message || 'Probe failed');
  }
}

export async function decodeBuslog(): Promise<void> {
  const uri = await pickBuslog();
  if (!uri) return;
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Decoding BLF/MF4…',
      cancellable: false
    },
    async () => {
      const result = await runPythonScript(
        'buslog_decoder.py',
        ['decode'],
        { path: uri.fsPath, limit: 10000 },
        120_000
      );
      const data = (result.data as any) || {};
      const doc = await vscode.workspace.openTextDocument({
        content: JSON.stringify(data, null, 2),
        language: 'json'
      });
      await vscode.window.showTextDocument(doc, { preview: true });
      appendAudit({
        level: data.status === 'ok' ? 'info' : 'warn',
        action: 'buslog.decode',
        detail: `${data.format || ''} frames=${data.frameCount ?? 0}`
      });
      if (data.status === 'ok') {
        vscode.window.showInformationMessage(
          `Decoded ${data.format || 'log'}: ${data.frameCount ?? 0} frame(s) via ${data.decoder || 'decoder'}`
        );
      } else {
        vscode.window.showErrorMessage(data.message || 'Decode failed');
      }
    }
  );
}

export async function analyzeBuslogBinary(): Promise<void> {
  const uri = await pickBuslog();
  if (!uri) return;
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Decoding & analyzing BLF/MF4…',
      cancellable: false
    },
    async () => {
      const result = await runPythonScript(
        'buslog_decoder.py',
        ['analyze'],
        { path: uri.fsPath, limit: 10000 },
        120_000
      );
      const data = (result.data as any) || {};
      const doc = await vscode.workspace.openTextDocument({
        content: JSON.stringify(data, null, 2),
        language: 'json'
      });
      await vscode.window.showTextDocument(doc, { preview: true });
      const summary = data.analysis?.summary || data.message || data.status;
      appendAudit({
        level: data.status === 'ok' ? 'info' : 'warn',
        action: 'buslog.analyze',
        detail: String(summary).slice(0, 200)
      });
      if (data.status === 'ok') {
        vscode.window.showInformationMessage(
          `${data.format || 'LOG'}: ${data.frameCount ?? 0} frames — ${summary}`
        );
      } else {
        vscode.window.showErrorMessage(data.message || 'Analyze failed');
      }
    }
  );
}
