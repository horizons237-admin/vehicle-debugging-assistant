import * as vscode from 'vscode';
import { DtcTreeProvider } from '../providers/dtcTreeProvider';
import { ErrorTreeProvider } from '../providers/errorTreeProvider';
import { StatusTreeProvider } from '../providers/statusTreeProvider';
import { buildIncidentPack, incidentPackToMarkdown } from '../utils/incidentPack';
import { setLastAction } from '../utils/sessionStore';
import { assertScope } from '../utils/dataGovernance';

export async function exportIncidentPack(
  dtcProvider: DtcTreeProvider,
  errorProvider: ErrorTreeProvider,
  statusProvider: StatusTreeProvider
): Promise<void> {
  if (!assertScope('alm', 'incident-pack-export')) return;

  const narrative = await vscode.window.showInputBox({
    prompt: 'Optional incident narrative (lab/dev)',
    placeHolder: 'e.g. Customer report: warning light after overnight charge'
  });

  const pack = buildIncidentPack(
    dtcProvider.getDtcs(),
    errorProvider.getErrors(),
    statusProvider.getSignals(),
    { narrative: narrative || undefined }
  );

  const format = await vscode.window.showQuickPick(
    [
      { label: 'Markdown', id: 'md' },
      { label: 'JSON', id: 'json' },
      { label: 'Both', id: 'both' }
    ],
    { placeHolder: 'Incident pack format' }
  );
  if (!format) return;

  const folder = vscode.workspace.workspaceFolders?.[0]?.uri;
  const base = `incident-pack-${Date.now()}`;
  const md = incidentPackToMarkdown(pack);
  const json = JSON.stringify(pack, null, 2);

  if (format.id === 'md' || format.id === 'both') {
    const uri = folder
      ? vscode.Uri.joinPath(folder, `${base}.md`)
      : await vscode.window.showSaveDialog({ defaultUri: vscode.Uri.file(`${base}.md`) });
    if (uri) {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(md, 'utf8'));
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc, { preview: true });
    }
  }
  if (format.id === 'json' || format.id === 'both') {
    const uri = folder
      ? vscode.Uri.joinPath(folder, `${base}.json`)
      : await vscode.window.showSaveDialog({ defaultUri: vscode.Uri.file(`${base}.json`) });
    if (uri) {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(json, 'utf8'));
    }
  }

  setLastAction('Exported lab incident pack');
  vscode.window.showInformationMessage(
    'Lab incident pack exported (not eCall — analysis/dev only)'
  );
}
