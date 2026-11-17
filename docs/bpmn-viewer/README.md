# BPMN interactive viewer

Uses **[bpmn-visualization](https://github.com/process-analytics/bpmn-visualization-js)** (Process Analytics) via jsDelivr CDN.

## Open the viewer (no install)

**CDN (works from any browser, used by the wiki):**

https://cdn.jsdelivr.net/gh/horizons237-admin/vehicle-debugging-assistant@main/docs/bpmn-viewer/index.html

Diagrams are loaded from the same CDN (`docs/bpmn/*.bpmn`). Zoom and pan are enabled.

## Local preview

```bash
cd docs
python3 -m http.server 8080
# open http://localhost:8080/bpmn-viewer/
```

## GitHub Pages

After Pages is enabled for the `docs/` folder:

`https://horizons237-admin.github.io/vehicle-debugging-assistant/bpmn-viewer/`

Workflow: `.github/workflows/pages-docs.yml`

## VS Code extension

Command **Vehicle Debug: Show BPMN Viewer** opens the same diagrams in a webview panel (`src/webviews/bpmnViewerPanel.ts`).

## Library

- Upstream: https://github.com/process-analytics/bpmn-visualization-js
- CDN: `bpmn-visualization@0.47.0` (IIFE build)
