import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const DIAGRAMS: { id: string; label: string; file: string }[] = [
  { id: '01', label: '01 – Diagnostic analysis', file: '01_diagnostic_analysis_l2.bpmn' },
  { id: '02', label: '02 – Bus-log pipeline', file: '02_buslog_pipeline_l2.bpmn' },
  { id: '03', label: '03 – Self diagnostic', file: '03_self_diagnostic_l2.bpmn' },
  { id: '04', label: '04 – CI/CD import', file: '04_cicd_import_l2.bpmn' },
];

function bpmnCandidates(extensionPath: string, file: string): string[] {
  return [
    path.join(extensionPath, 'resources', 'bpmn', file),
    path.join(extensionPath, 'docs', 'bpmn', file),
  ];
}

function readBpmn(extensionPath: string, file: string): string {
  for (const p of bpmnCandidates(extensionPath, file)) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf8');
    }
  }
  throw new Error('BPMN not found: ' + file);
}

function buildHtml(diagrams: { id: string; label: string; xml: string }[]): string {
  const payload = JSON.stringify(diagrams).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; script-src https://cdn.jsdelivr.net 'unsafe-inline'; style-src 'unsafe-inline'; connect-src https://cdn.jsdelivr.net; img-src data: https:;" />
  <title>VDA BPMN Viewer</title>
  <script src="https://cdn.jsdelivr.net/npm/bpmn-visualization@0.47.0/dist/bpmn-visualization.min.js"></script>
  <style>
    body { margin:0; font-family: var(--vscode-font-family); background: var(--vscode-editor-background); color: var(--vscode-foreground); }
    header { display:flex; gap:8px; align-items:center; padding:8px 12px; border-bottom:1px solid var(--vscode-widget-border); flex-wrap:wrap; }
    select, button { font: inherit; padding:6px 10px; }
    #bpmn-container { width:100%; height: calc(100vh - 48px); background:#fff; }
    #status { font-size:12px; opacity:.75; margin-left:auto; }
    .muted { opacity:.7; font-size:12px; }
  </style>
</head>
<body>
  <header>
    <strong>BPMN Viewer</strong>
    <span class="muted">bpmn-visualization</span>
    <select id="diagram"></select>
    <button type="button" id="reload">Reload</button>
    <span id="status"></span>
  </header>
  <div id="bpmn-container"></div>
  <script>
    const diagrams = ${payload};
    const select = document.getElementById('diagram');
    const status = document.getElementById('status');
    diagrams.forEach((d, i) => {
      const o = document.createElement('option');
      o.value = String(i);
      o.textContent = d.label;
      select.appendChild(o);
    });
    let viz = null;
    function ensure() {
      if (viz) return viz;
      const BpmnVisualization = (window.bpmnvisu && window.bpmnvisu.BpmnVisualization) || window.BpmnVisualization;
      if (!BpmnVisualization) throw new Error('CDN bpmn-visualization not available');
      viz = new BpmnVisualization({ container: 'bpmn-container', navigation: { enabled: true } });
      return viz;
    }
    function load(i) {
      const d = diagrams[i];
      status.textContent = 'Loading…';
      try {
        ensure().load(d.xml);
        status.textContent = d.label + ' (zoom/pan)';
      } catch (e) {
        status.textContent = String(e && e.message ? e.message : e);
      }
    }
    document.getElementById('reload').onclick = () => load(Number(select.value));
    select.onchange = () => load(Number(select.value));
    load(0);
  </script>
</body>
</html>`;
}

export function showBpmnViewer(context: vscode.ExtensionContext): void {
  const extensionPath = context.extensionPath;
  let diagrams: { id: string; label: string; xml: string }[];
  try {
    diagrams = DIAGRAMS.map((d) => ({
      id: d.id,
      label: d.label,
      xml: readBpmn(extensionPath, d.file),
    }));
  } catch (e) {
    void vscode.window.showErrorMessage(
      `BPMN files not found under docs/bpmn (${String(e)}). Ensure the extension includes docs/bpmn/*.bpmn.`
    );
    return;
  }

  const panel = vscode.window.createWebviewPanel(
    'vehicleDebug.bpmnViewer',
    'Vehicle Debug: BPMN Viewer',
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(extensionPath, 'resources', 'bpmn')),
        vscode.Uri.file(path.join(extensionPath, 'docs', 'bpmn')),
      ],
    }
  );
  panel.webview.html = buildHtml(diagrams);
}
