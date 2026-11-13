import * as vscode from 'vscode';
import * as path from 'path';
import { runPythonScript } from '../utils/pythonRunner';
import { ErrorTreeProvider, AnalyzedError } from '../providers/errorTreeProvider';
import { getConfig } from '../utils/config';

export async function analyzeLog(errorProvider: ErrorTreeProvider): Promise<void> {
  const uris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    openLabel: 'Analyze Log',
    filters: {
      'Log / Trace files': ['log', 'asc', 'blf', 'csv', 'txt', 'json'],
      'All files': ['*']
    }
  });

  if (!uris || uris.length === 0) {
    return;
  }

  const filePath = uris[0].fsPath;
  const config = getConfig();

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Analyzing ${path.basename(filePath)}…`,
      cancellable: false
    },
    async () => {
      const result = await runPythonScript('log_analyzer.py', [filePath], {
        enableSafetyClassification: config.enableSafetyClassification
      });

      if (!result.success) {
        vscode.window.showErrorMessage(`Log analysis failed: ${result.stderr || result.stdout}`);
        return;
      }

      const errors: AnalyzedError[] = (result.data?.errors || []).map((e: any, i: number) => ({
        id: e.id || `log-${i}-${Date.now()}`,
        category: e.category || 'unknown',
        severity: e.severity || 'major',
        asilImpact: e.asilImpact,
        source: e.source || 'log',
        description: e.description || e.message || 'Log finding',
        recommendation: e.recommendation,
        evidence: e.evidence || { file: path.basename(filePath) },
        timestamp: e.timestamp || new Date().toISOString()
      }));

      errorProvider.setErrors([...errors, ...errorProvider.getErrors()]);
      vscode.window.showInformationMessage(
        `Log analysis: ${errors.length} finding(s) from ${path.basename(filePath)}`
      );
    }
  );
}
