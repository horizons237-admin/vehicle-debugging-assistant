import * as vscode from 'vscode';
import { discoverSovdResources, fetchSovdResource } from '../connections/sovdClient';
import { setLastAction } from '../utils/sessionStore';

export async function sovdDiscoverCommand(): Promise<void> {
  const result = await discoverSovdResources();
  setLastAction(`SOVD discovery (${result.mode})`);

  const pick = await vscode.window.showQuickPick(
    result.resources.map((r) => ({
      label: r.name,
      description: r.type,
      detail: `${r.href} — ${r.description || ''}`,
      resource: r
    })),
    {
      title: `SOVD resources [${result.mode}] — ${result.baseUrl}`,
      placeHolder: 'Select a resource to fetch (read-only)'
    }
  );

  if (!pick) {
    const ch = vscode.window.createOutputChannel('Vehicle Debug SOVD');
    ch.clear();
    ch.appendLine(`SOVD discovery @ ${result.discoveredAt}`);
    ch.appendLine(`Mode: ${result.mode}  Base: ${result.baseUrl}`);
    for (const r of result.resources) {
      ch.appendLine(`- ${r.name} [${r.type}] ${r.href}`);
    }
    ch.show(true);
    return;
  }

  try {
    const payload = await fetchSovdResource(pick.resource.href);
    const doc = await vscode.workspace.openTextDocument({
      content: JSON.stringify({ resource: pick.resource, payload }, null, 2),
      language: 'json'
    });
    await vscode.window.showTextDocument(doc, { preview: true });
  } catch (e) {
    vscode.window.showErrorMessage(`SOVD fetch failed: ${e instanceof Error ? e.message : e}`);
  }
}
