import * as vscode from 'vscode';
import { parseFleetFile, rankFleet, fleetToMarkdown } from '../utils/fleetOffline';
import { setLastAction } from '../utils/sessionStore';
import { assertScope } from '../utils/dataGovernance';

export async function importFleetOffline(): Promise<void> {
  if (!assertScope('local-only', 'fleet-offline-import')) return;

  const uris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    openLabel: 'Import fleet file',
    filters: { 'Fleet data': ['json', 'csv'], All: ['*'] }
  });
  if (!uris?.length) return;

  try {
    const vehicles = parseFleetFile(uris[0].fsPath);
    if (!vehicles.length) {
      vscode.window.showWarningMessage('No vehicles found in file');
      return;
    }
    const ranked = await rankFleet(vehicles);
    const md = fleetToMarkdown(ranked);
    const doc = await vscode.workspace.openTextDocument({ content: md, language: 'markdown' });
    await vscode.window.showTextDocument(doc, { preview: true });

    const folder = vscode.workspace.workspaceFolders?.[0]?.uri;
    if (folder) {
      const out = vscode.Uri.joinPath(folder, `fleet-ranked-${Date.now()}.json`);
      await vscode.workspace.fs.writeFile(
        out,
        Buffer.from(
          JSON.stringify(
            ranked.map((v) => ({
              vin: v.vin,
              topPriority: v.topPriority,
              findingCount: v.findingCount,
              findings: v.findings.map((f) => ({
                priority: f.priority,
                label: f.label,
                kind: f.kind
              }))
            })),
            null,
            2
          ),
          'utf8'
        )
      );
    }

    setLastAction(`Fleet offline (${ranked.length} vehicles)`);
    vscode.window.showInformationMessage(
      `Fleet ranked: ${ranked.length} vehicle(s) — top=${ranked[0]?.topPriority || 'n/a'}`
    );
  } catch (e) {
    vscode.window.showErrorMessage(`Fleet import failed: ${e instanceof Error ? e.message : e}`);
  }
}
