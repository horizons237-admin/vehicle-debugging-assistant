import * as vscode from 'vscode';
import * as path from 'path';
import { appendAudit } from '../utils/auditLog';

let watcher: vscode.FileSystemWatcher | undefined;

export async function startCiReportWatch(
  _errorProvider: any,
  _dtcProvider: any
): Promise<void> {
  const folder = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    openLabel: 'Watch CI reports folder'
  });
  if (!folder?.[0]) return;
  stopCiReportWatch();
  const pattern = new vscode.RelativePattern(folder[0], '**/*.{json}');
  watcher = vscode.workspace.createFileSystemWatcher(pattern);
  const handler = async (uri: vscode.Uri) => {
    const name = path.basename(uri.fsPath).toLowerCase();
    if (!name.includes('cicd') && !name.includes('vda') && !name.includes('report')) {
      return;
    }
    appendAudit({ level: 'info', action: 'ci.watch.import', detail: uri.fsPath });
    vscode.window.showInformationMessage(`CI watch: new report ${path.basename(uri.fsPath)}`);
    try {
      await vscode.commands.executeCommand('vehicleDebug.importCicdReport');
    } catch {
      /* user may cancel */
    }
  };
  watcher.onDidCreate(handler);
  watcher.onDidChange(handler);
  appendAudit({ level: 'info', action: 'ci.watch.start', detail: folder[0].fsPath });
  vscode.window.showInformationMessage(`CI report watch started: ${folder[0].fsPath}`);
}

export function stopCiReportWatch(): void {
  watcher?.dispose();
  watcher = undefined;
  vscode.window.showInformationMessage('CI report watch stopped');
}
