import * as vscode from 'vscode';
import { AnalyzedError } from '../providers/errorTreeProvider';
import { DtcItem } from '../providers/dtcTreeProvider';

export function showReport(
  context: vscode.ExtensionContext,
  errors: AnalyzedError[],
  dtcs: DtcItem[]
): void {
  const panel = vscode.window.createWebviewPanel(
    'vehicleDebugReport',
    'Vehicle Debug – Analysis Report',
    vscode.ViewColumn.One,
    { enableScripts: true }
  );

  panel.webview.html = getReportHtml(errors, dtcs);
}

function getReportHtml(errors: AnalyzedError[], dtcs: DtcItem[]): string {
  const errorRows = errors
    .map(
      (e) => `
      <tr class="sev-${e.severity}">
        <td>${e.category}</td>
        <td>${e.severity}</td>
        <td>${e.asilImpact || '—'}</td>
        <td>${e.source}</td>
        <td>${escapeHtml(e.description)}</td>
        <td>${e.recommendation || '—'}</td>
      </tr>`
    )
    .join('');

  const dtcRows = dtcs
    .map(
      (d) => `
      <tr class="sev-${d.severity}">
        <td>${d.code}</td>
        <td>${d.status}</td>
        <td>${d.severity}</td>
        <td>${escapeHtml(d.description)}</td>
        <td>${escapeHtml(d.freezeFrame || '—')}</td>
      </tr>`
    )
    .join('');

  const criticalCount = errors.filter((e) => e.severity === 'critical').length;
  const majorCount = errors.filter((e) => e.severity === 'major').length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 20px; }
    h1, h2 { color: var(--vscode-foreground); }
    table { border-collapse: collapse; width: 100%; margin-bottom: 24px; }
    th, td { border: 1px solid var(--vscode-panel-border); padding: 8px 12px; text-align: left; }
    th { background: var(--vscode-editor-inactiveSelectionBackground); }
    .sev-critical { background: color-mix(in srgb, var(--vscode-errorForeground) 15%, transparent); }
    .sev-major { background: color-mix(in srgb, var(--vscode-editorWarning-foreground) 12%, transparent); }
    .summary { display: flex; gap: 24px; margin-bottom: 20px; }
    .card { padding: 12px 18px; border-radius: 6px; background: var(--vscode-editor-inactiveSelectionBackground); }
    .card strong { font-size: 1.4em; display: block; }
  </style>
</head>
<body>
  <h1>Vehicle Debugging Assistant – Analysis Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>

  <div class="summary">
    <div class="card"><strong>${errors.length}</strong> Analyzed errors</div>
    <div class="card"><strong>${criticalCount}</strong> Critical</div>
    <div class="card"><strong>${majorCount}</strong> Major</div>
    <div class="card"><strong>${dtcs.length}</strong> DTCs</div>
  </div>

  <h2>Classified Errors</h2>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th>Severity</th>
        <th>ASIL</th>
        <th>Source</th>
        <th>Description</th>
        <th>Recommendation</th>
      </tr>
    </thead>
    <tbody>
      ${errorRows || '<tr><td colspan="6">No errors</td></tr>'}
    </tbody>
  </table>

  <h2>Diagnostic Trouble Codes</h2>
  <table>
    <thead>
      <tr>
        <th>Code</th>
        <th>Status</th>
        <th>Severity</th>
        <th>Description</th>
        <th>Freeze Frame</th>
      </tr>
    </thead>
    <tbody>
      ${dtcRows || '<tr><td colspan="5">No DTCs</td></tr>'}
    </tbody>
  </table>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
