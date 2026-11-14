import * as vscode from 'vscode';
import { DtcTreeProvider } from '../providers/dtcTreeProvider';
import { ErrorTreeProvider } from '../providers/errorTreeProvider';
import { loadTriageRules, rankFindings } from '../utils/triageRules';
import { buildHealthSnapshot, snapshotToMarkdown } from '../utils/healthSnapshot';
import { setLastAction } from '../utils/sessionStore';

export async function exportHealthSnapshot(
  dtcProvider: DtcTreeProvider,
  errorProvider: ErrorTreeProvider
): Promise<void> {
  const rules = await loadTriageRules();
  const ranked = rankFindings(dtcProvider.getDtcs(), errorProvider.getErrors(), rules);
  const snap = buildHealthSnapshot(dtcProvider.getDtcs(), errorProvider.getErrors(), ranked, rules);

  const format = await vscode.window.showQuickPick(
    [
      { label: 'Markdown', description: 'Human-readable report', id: 'md' },
      { label: 'JSON', description: 'Machine-readable snapshot', id: 'json' },
      { label: 'Both', id: 'both' }
    ],
    { placeHolder: 'Export format' }
  );
  if (!format) return;

  const folder = vscode.workspace.workspaceFolders?.[0]?.uri;
  const base = `vehicle-health-${(snap.vehicle.vin || snap.vehicle.vehicleId || 'unknown').replace(/[^A-Z0-9]/gi, '_')}-${Date.now()}`;

  const md = snapshotToMarkdown(snap);
  const json = JSON.stringify(snap, null, 2);

  if (format.id === 'md' || format.id === 'both') {
    const uri = folder
      ? vscode.Uri.joinPath(folder, `${base}.md`)
      : await pickSave(`${base}.md`);
    if (uri) {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(md, 'utf8'));
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc, { preview: true });
    }
  }
  if (format.id === 'json' || format.id === 'both') {
    const uri = folder
      ? vscode.Uri.joinPath(folder, `${base}.json`)
      : await pickSave(`${base}.json`);
    if (uri) {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(json, 'utf8'));
    }
  }

  setLastAction('Exported health snapshot');
  vscode.window.showInformationMessage(
    `Health snapshot exported (${snap.summary.totalFindings} findings, top=${snap.summary.topPriority})`
  );
}

async function pickSave(name: string): Promise<vscode.Uri | undefined> {
  return vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file(name),
    filters: { All: ['*'] }
  });
}
