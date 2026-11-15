import * as vscode from 'vscode';
import { UN_R155_AIDE_ITEMS, checklistToMarkdown } from '../utils/cyberChecklist';
import { setLastAction } from '../utils/sessionStore';
import { assertScope } from '../utils/dataGovernance';

export async function runCyberChecklist(): Promise<void> {
  if (!assertScope('local-only', 'cyber-checklist')) return;

  const checked: Record<string, boolean> = {};
  const notes: Record<string, string> = {};

  const mode = await vscode.window.showQuickPick(
    [
      { label: 'Export empty checklist template', id: 'template' },
      { label: 'Interactive check (QuickPick multi)', id: 'interactive' }
    ],
    { placeHolder: 'Cyber / UN R155 aide' }
  );
  if (!mode) return;

  if (mode.id === 'interactive') {
    const selected = await vscode.window.showQuickPick(
      UN_R155_AIDE_ITEMS.map((i) => ({
        label: i.text,
        description: i.section,
        detail: i.id,
        picked: false,
        item: i
      })),
      { canPickMany: true, title: 'Mark items considered done (aide only)' }
    );
    for (const s of selected || []) {
      checked[s.item.id] = true;
    }
  }

  const md = checklistToMarkdown(checked, notes);
  const doc = await vscode.workspace.openTextDocument({ content: md, language: 'markdown' });
  await vscode.window.showTextDocument(doc, { preview: true });
  setLastAction('Cyber checklist exported');
}
