import * as vscode from 'vscode';
import { DtcTreeProvider } from '../providers/dtcTreeProvider';
import { ErrorTreeProvider } from '../providers/errorTreeProvider';
import {
  detectAnomalies,
  updateBaselineFromSession,
  anomaliesToMarkdown,
  loadBaseline
} from '../utils/anomalyAssist';
import { setLastAction } from '../utils/sessionStore';
import { assertScope } from '../utils/dataGovernance';

export async function runAnomalyAssist(
  dtcProvider: DtcTreeProvider,
  errorProvider: ErrorTreeProvider
): Promise<void> {
  if (!assertScope('local-only', 'anomaly-assist')) return;

  const dtcs = dtcProvider.getDtcs();
  const errors = errorProvider.getErrors();
  const baselineSize = loadBaseline().length;

  const choice = await vscode.window.showQuickPick(
    [
      {
        label: 'Detect anomalies vs baseline',
        id: 'detect',
        description: `Baseline entries: ${baselineSize}`
      },
      {
        label: 'Update baseline from current session',
        id: 'update',
        description: 'Merge current DTCs/errors into local baseline'
      },
      { label: 'Detect then update baseline', id: 'both' }
    ],
    { placeHolder: 'Anomaly assist' }
  );
  if (!choice) return;

  if (choice.id === 'update' || choice.id === 'both') {
    try {
      const entries = updateBaselineFromSession(dtcs, errors);
      vscode.window.showInformationMessage(`Baseline updated (${entries.length} entries)`);
    } catch (e) {
      vscode.window.showErrorMessage(e instanceof Error ? e.message : String(e));
      return;
    }
  }

  if (choice.id === 'detect' || choice.id === 'both') {
    const flags = detectAnomalies(dtcs, errors);
    const md = anomaliesToMarkdown(flags);
    const doc = await vscode.workspace.openTextDocument({ content: md, language: 'markdown' });
    await vscode.window.showTextDocument(doc, { preview: true });
    setLastAction(`Anomaly assist (${flags.length} flags)`);
  }
}
