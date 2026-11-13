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
      title: `Analyzing ${path.basename(filePath)}...`,
      cancellable: true
    },
    async (progress, token) => {
      progress.report({ message: 'Running log analyzer…' });
      const result = await runPythonScript(
        'log_analyzer.py',
        [filePath],
        { enable_safety: config.enableSafetyClassification },
        undefined,
        token
      );

      if (token.isCancellationRequested || result.cancelled) {
        vscode.window.showInformationMessage('Log analysis cancelled');
        return;
      }

      let errors: AnalyzedError[] = [];

      if (result.success && result.data && (result.data as { errors?: AnalyzedError[] }).errors) {
        errors = (result.data as { errors: AnalyzedError[] }).errors;
      } else {
        progress.report({ message: 'Fallback text analysis…' });
        errors = await simpleTextAnalysis(filePath);
        vscode.window.showInformationMessage('Basic text analysis used (Python analyzer unavailable)');
      }

      if (errors.length > 0) {
        errorProvider.setErrors([...errors, ...errorProvider.getErrors()]);
        vscode.window.showInformationMessage(`Analysis complete: ${errors.length} error(s) found`);
      } else {
        vscode.window.showInformationMessage('No significant errors detected in the log');
      }
    }
  );
}

async function simpleTextAnalysis(filePath: string): Promise<AnalyzedError[]> {
  const content = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
  const text = Buffer.from(content).toString('utf8');
  const errors: AnalyzedError[] = [];
  const lines = text.split('\n');

  const patterns: {
    regex: RegExp;
    category: AnalyzedError['category'];
    severity: AnalyzedError['severity'];
    desc: string;
  }[] = [
    { regex: /NRC\s*0x([0-9A-Fa-f]{2})/i, category: 'communication', severity: 'major', desc: 'Negative Response Code detected' },
    { regex: /timeout|P2\*|no response/i, category: 'timing', severity: 'major', desc: 'Timing / timeout issue' },
    { regex: /DTC\s*([PBCU][0-9A-Fa-f]{4})/i, category: 'safety_mechanism', severity: 'major', desc: 'DTC referenced in log' },
    { regex: /watchdog|WdgM|deadline/i, category: 'safety_mechanism', severity: 'critical', desc: 'Watchdog / deadline supervision event' },
    { regex: /segfault|exception|assert|fatal/i, category: 'software_bug', severity: 'critical', desc: 'Software exception or fatal error' },
    { regex: /MISRA|violation/i, category: 'software_bug', severity: 'minor', desc: 'Coding guideline violation mentioned' }
  ];

  lines.forEach((line, idx) => {
    for (const p of patterns) {
      if (p.regex.test(line)) {
        errors.push({
          id: `log-${idx}-${Date.now()}`,
          category: p.category,
          severity: p.severity,
          source: 'log',
          description: `${p.desc}: ${line.trim().substring(0, 120)}`,
          evidence: { line: idx + 1, content: line.trim() },
          recommendation: 'Review surrounding context and correlate with DTC / test results',
          timestamp: new Date().toISOString()
        });
        break;
      }
    }
  });

  return errors.slice(0, 50);
}
