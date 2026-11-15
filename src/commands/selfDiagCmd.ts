import * as vscode from 'vscode';
import { SelfDiagnosticProvider } from '../providers/selfDiagnosticProvider';
import { appendAudit } from '../utils/auditLog';
import { redactJson } from '../utils/redaction';

export async function runSelfDiagnosticCommand(
  provider: SelfDiagnosticProvider,
  statusBar?: vscode.StatusBarItem
): Promise<void> {
  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Vehicle Debug: self-diagnostic…', cancellable: false },
    async () => {
      const report = await provider.runAndRefresh(true);
      appendAudit({ level: report.overall === 'error' ? 'warn' : 'info', action: 'self_diagnostic', detail: report.summary });
      if (statusBar) {
        const icon = report.overall === 'error' ? '$(error)' : report.overall === 'warn' ? '$(warning)' : '$(pass)';
        statusBar.text = `${icon} VDA ${report.overall}`;
        statusBar.tooltip = `Self-diagnostic: ${report.summary}\nClick to re-run`;
        statusBar.command = 'vehicleDebug.runSelfDiagnostic';
      }
      const msg = `Self-diagnostic: ${report.summary}`;
      if (report.overall === 'error') vscode.window.showErrorMessage(msg);
      else if (report.overall === 'warn') vscode.window.showWarningMessage(msg);
      else vscode.window.showInformationMessage(msg);
    }
  );
}

export async function exportSelfDiagnostic(provider: SelfDiagnosticProvider): Promise<void> {
  let report = provider.getReport();
  if (!report) report = await provider.runAndRefresh(true);
  const doc = await vscode.workspace.openTextDocument({
    content: JSON.stringify(redactJson(report, { keepVinLast4: true }), null, 2),
    language: 'json'
  });
  await vscode.window.showTextDocument(doc);
}
