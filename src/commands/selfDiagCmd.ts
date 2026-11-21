import * as vscode from 'vscode';
import { SelfDiagnosticProvider } from '../providers/selfDiagnosticProvider';
import { appendAudit } from '../utils/auditLog';
import { redactJson } from '../utils/redaction';
import { t } from '../utils/i18n';

export async function runSelfDiagnosticCommand(
  provider: SelfDiagnosticProvider,
  statusBar?: vscode.StatusBarItem
): Promise<void> {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: t('selfdiag.progress'),
      cancellable: false
    },
    async () => {
      const report = await provider.runAndRefresh(true);
      appendAudit({
        level: report.overall === 'error' ? 'warn' : 'info',
        action: 'self_diagnostic',
        detail: report.summary
      });
      if (statusBar) {
        const icon =
          report.overall === 'error'
            ? '$(error)'
            : report.overall === 'warn'
              ? '$(warning)'
              : '$(pass)';
        statusBar.text = `${icon} VDA ${report.overall}`;
        statusBar.tooltip = t('selfdiag.tooltip', { summary: report.summary });
        statusBar.command = 'vehicleDebug.runSelfDiagnostic';
      }
      const msg = t('selfdiag.done', { summary: report.summary });
      if (report.overall === 'error') {
        vscode.window.showErrorMessage(msg);
      } else if (report.overall === 'warn') {
        vscode.window.showWarningMessage(msg);
      } else {
        vscode.window.showInformationMessage(msg);
      }
    }
  );
}

export async function exportSelfDiagnostic(provider: SelfDiagnosticProvider): Promise<void> {
  let report = provider.getReport();
  if (!report) {
    report = await provider.runAndRefresh(true);
  }
  const safe = redactJson(report, { keepVinLast4: true });
  const doc = await vscode.workspace.openTextDocument({
    content: JSON.stringify(safe, null, 2),
    language: 'json'
  });
  await vscode.window.showTextDocument(doc);
}
