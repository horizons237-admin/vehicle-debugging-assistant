import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export type AuditLevel = 'info' | 'warn' | 'security';
export interface AuditEntry {
  ts: string;
  level: AuditLevel;
  action: string;
  detail?: string;
  scope?: string;
}

function auditPath(): string | undefined {
  const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!folder) return undefined;
  const dir = path.join(folder, '.vehicle-debug');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'audit.log');
}

export function appendAudit(entry: Omit<AuditEntry, 'ts'> & { ts?: string }): void {
  const line: AuditEntry = {
    ts: entry.ts || new Date().toISOString(),
    level: entry.level,
    action: entry.action,
    detail: entry.detail,
    scope: entry.scope
  };
  const file = auditPath();
  if (file) {
    try { fs.appendFileSync(file, JSON.stringify(line) + '\n', 'utf8'); } catch { /* lab */ }
  }
}

export async function openAuditLog(): Promise<void> {
  const file = auditPath();
  if (!file || !fs.existsSync(file)) {
    appendAudit({ level: 'info', action: 'audit.init', detail: 'log created' });
  }
  const p = auditPath();
  if (p) {
    const doc = await vscode.workspace.openTextDocument(p);
    await vscode.window.showTextDocument(doc);
  }
}
