import * as vscode from 'vscode';
import { runPythonScript } from '../utils/pythonRunner';
import { appendAudit } from '../utils/auditLog';

export async function loadDbcSymbols(): Promise<void> {
  const uri = await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: { DBC: ['dbc'], All: ['*'] },
    openLabel: 'Load DBC'
  });
  if (!uri?.[0]) return;
  const result = await runPythonScript('dbc_parser.py', ['parse'], { path: uri[0].fsPath });
  const data = (result.data as any) || {};
  if (data.status !== 'ok') {
    vscode.window.showErrorMessage(data.message || result.stderr || 'DBC parse failed');
    return;
  }
  const cfg = vscode.workspace.getConfiguration('vehicleDebug');
  await cfg.update('dbc.path', uri[0].fsPath, vscode.ConfigurationTarget.Workspace);
  appendAudit({ level: 'info', action: 'dbc.load', detail: `${data.messageCount} messages` });
  vscode.window.showInformationMessage(
    `DBC symbols loaded: ${data.messageCount} message(s) from ${uri[0].fsPath}`
  );
}

export async function annotateLogWithDbc(): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('vehicleDebug');
  let dbcPath = cfg.get<string>('dbc.path');
  if (!dbcPath) {
    await loadDbcSymbols();
    dbcPath = cfg.get<string>('dbc.path');
  }
  if (!dbcPath) return;
  const logUri = await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: { Log: ['log', 'txt', 'asc', 'csv'], All: ['*'] }
  });
  if (!logUri?.[0]) return;
  const result = await runPythonScript('dbc_parser.py', ['annotate'], {
    dbcPath,
    logPath: logUri[0].fsPath
  });
  const data = (result.data as any) || {};
  if (data.status !== 'ok') {
    vscode.window.showErrorMessage(data.message || 'annotate failed');
    return;
  }
  const doc = await vscode.workspace.openTextDocument({
    content: (data.annotatedLines || []).join('\n'),
    language: 'log'
  });
  await vscode.window.showTextDocument(doc);
  appendAudit({ level: 'info', action: 'dbc.annotate', detail: logUri[0].fsPath });
}
