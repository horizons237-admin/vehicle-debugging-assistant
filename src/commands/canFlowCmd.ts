import * as vscode from 'vscode';
import { runPythonScript } from '../utils/pythonRunner';
import { appendAudit } from '../utils/auditLog';

export async function analyzeCanFlow(): Promise<void> {
  const uri = await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: { Log: ['log', 'txt', 'asc', 'csv'], All: ['*'] },
    openLabel: 'Analyze CAN flow'
  });
  if (!uri?.[0]) return;
  const result = await runPythonScript('can_flow_analyzer.py', ['analyze'], {
    path: uri[0].fsPath
  });
  const data = (result.data as any) || {};
  if (data.status !== 'ok') {
    vscode.window.showErrorMessage(data.message || result.stderr || 'CAN flow analysis failed');
    return;
  }
  appendAudit({
    level: 'info',
    action: 'can.flow',
    detail: data.summary
  });
  const doc = await vscode.workspace.openTextDocument({
    content: JSON.stringify(data, null, 2),
    language: 'json'
  });
  await vscode.window.showTextDocument(doc, { preview: true });
  vscode.window.showInformationMessage(`CAN flow: ${data.summary}`);
}
