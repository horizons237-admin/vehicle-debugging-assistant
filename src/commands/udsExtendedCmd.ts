import * as vscode from 'vscode';
import { runPythonScript } from '../utils/pythonRunner';
import { appendAudit } from '../utils/auditLog';

/** Read-only UDS extensions (simulation-safe). */
export async function udsReadMemory(): Promise<void> {
  const address = await vscode.window.showInputBox({
    prompt: 'Memory address (hex)',
    value: '0x00000100'
  });
  if (!address) return;
  const size = await vscode.window.showInputBox({ prompt: 'Size (bytes, max 64)', value: '16' });
  const result = await runPythonScript('uds_client.py', ['read_memory'], {
    address,
    size: Number(size || 16)
  });
  const data = (result.data as any) || {};
  if (data.status !== 'ok') {
    vscode.window.showErrorMessage(data.message || result.stderr || 'read_memory failed');
    return;
  }
  const doc = await vscode.workspace.openTextDocument({
    content: JSON.stringify(data, null, 2),
    language: 'json'
  });
  await vscode.window.showTextDocument(doc);
  appendAudit({ level: 'info', action: 'uds.read_memory', detail: `${address} size=${size}` });
}

export async function udsTesterPresent(): Promise<void> {
  const result = await runPythonScript('uds_client.py', ['tester_present'], {});
  const data = (result.data as any) || {};
  vscode.window.showInformationMessage(`TesterPresent: ${data.status} (${data.mode})`);
  appendAudit({ level: 'info', action: 'uds.tester_present' });
}
