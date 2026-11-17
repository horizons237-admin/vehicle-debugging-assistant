import * as vscode from 'vscode';
import { runPythonScript } from '../utils/pythonRunner';
import { appendAudit } from '../utils/auditLog';

async function pickAsc(): Promise<vscode.Uri | undefined> {
  const uris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: { ASC: ['asc'], Log: ['asc', 'log', 'txt'], All: ['*'] },
    openLabel: 'Open ASC'
  });
  return uris?.[0];
}

export async function parseAscLog(): Promise<void> {
  const uri = await pickAsc();
  if (!uri) return;
  const result = await runPythonScript('asc_parser.py', ['parse'], {
    path: uri.fsPath,
    limit: 100000
  });
  const data = (result.data as any) || {};
  const doc = await vscode.workspace.openTextDocument({
    content: JSON.stringify(data, null, 2),
    language: 'json'
  });
  await vscode.window.showTextDocument(doc, { preview: true });
  appendAudit({
    level: data.status === 'ok' ? 'info' : 'warn',
    action: 'asc.parse',
    detail: `frames=${data.frameCount ?? 0}`
  });
  if (data.status === 'ok') {
    vscode.window.showInformationMessage(`ASC: ${data.frameCount} frame(s)`);
  } else {
    vscode.window.showErrorMessage(data.message || 'ASC parse failed');
  }
}

export async function analyzeAscLog(): Promise<void> {
  const uri = await pickAsc();
  if (!uri) return;
  const result = await runPythonScript('asc_parser.py', ['analyze'], {
    path: uri.fsPath
  });
  const data = (result.data as any) || {};
  const doc = await vscode.workspace.openTextDocument({
    content: JSON.stringify(data, null, 2),
    language: 'json'
  });
  await vscode.window.showTextDocument(doc, { preview: true });
  const summary = data.analysis?.summary || data.status;
  appendAudit({ level: 'info', action: 'asc.analyze', detail: String(summary).slice(0, 200) });
  vscode.window.showInformationMessage(`ASC analyze: ${summary}`);
}
