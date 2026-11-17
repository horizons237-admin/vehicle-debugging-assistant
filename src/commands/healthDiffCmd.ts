import * as vscode from 'vscode';
import * as fs from 'fs';
import { diffHealthSnapshots } from '../utils/healthDiff';
import { appendAudit } from '../utils/auditLog';
import { redactJson } from '../utils/redaction';

export async function diffHealthSnapshotFiles(): Promise<void> {
  const beforeUri = await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: { JSON: ['json'] },
    openLabel: 'Before snapshot'
  });
  if (!beforeUri?.[0]) return;
  const afterUri = await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: { JSON: ['json'] },
    openLabel: 'After snapshot'
  });
  if (!afterUri?.[0]) return;

  const before = JSON.parse(fs.readFileSync(beforeUri[0].fsPath, 'utf8'));
  const after = JSON.parse(fs.readFileSync(afterUri[0].fsPath, 'utf8'));
  const diff = diffHealthSnapshots(before, after);

  const report = {
    summary: diff.summary,
    added: diff.added,
    removed: diff.removed,
    changed: diff.changed,
    generatedAt: new Date().toISOString()
  };
  const safe = redactJson(report, { keepVinLast4: true });
  const doc = await vscode.workspace.openTextDocument({
    content: JSON.stringify(safe, null, 2),
    language: 'json'
  });
  await vscode.window.showTextDocument(doc);
  appendAudit({ level: 'info', action: 'health.diff', detail: diff.summary });
  vscode.window.showInformationMessage(`Health diff: ${diff.summary}`);
}
