import * as vscode from 'vscode';
import { t } from '../utils/i18n';
import { getEcuSession } from '../utils/sessionStore';
import { getActiveEcu } from '../utils/ecuRegistry';

export function showDashboard(summary: {
  errorCount: number;
  dtcCount: number;
  healthTop?: string[];
}): void {
  const panel = vscode.window.createWebviewPanel(
    'vehicleDebug.dashboard',
    t('dashboard.title'),
    vscode.ViewColumn.Beside,
    { enableScripts: false }
  );
  const session = getEcuSession();
  const ecu = getActiveEcu();
  const top =
    (summary.healthTop || []).map((x) => `<li>${escapeHtml(x)}</li>`).join('') || '<li>—</li>';
  panel.webview.html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<style>
 body{font-family:var(--vscode-font-family);padding:16px;color:var(--vscode-foreground);background:var(--vscode-editor-background)}
 .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
 .card{border:1px solid var(--vscode-widget-border);border-radius:8px;padding:12px}
 .n{font-size:28px;font-weight:700}
 .muted{opacity:.7;font-size:12px}
</style></head><body>
 <h2>${escapeHtml(t('dashboard.title'))}</h2>
 <p class="muted">${escapeHtml(t('safety.disclaimer'))}</p>
 <div class="grid">
  <div class="card"><div class="muted">Errors</div><div class="n">${summary.errorCount}</div></div>
  <div class="card"><div class="muted">DTCs</div><div class="n">${summary.dtcCount}</div></div>
  <div class="card"><div class="muted">Session</div><div class="n" style="font-size:16px">${session.connected ? session.mode : 'offline'}</div>
   <div class="muted">${escapeHtml(ecu?.name || '—')} ${escapeHtml(session.vin || '')}</div></div>
 </div>
 <h3>Top health</h3>
 <ul>${top}</ul>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
