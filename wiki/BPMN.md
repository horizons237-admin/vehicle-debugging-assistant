# BPMN Level-2 diagrams

BPMN 2.0 process models (`isExecutable="false"`) with **BPMN DI** layout for interactive rendering.

## Interactive viewer (bpmn-visualization)

The project embeds **[bpmn-visualization](https://github.com/process-analytics/bpmn-visualization-js)** (Process Analytics) to render the diagrams in the browser and inside VS Code.

| Surface | How |
|---------|-----|
| **VS Code** | Command palette → **Vehicle Debug: Show BPMN Viewer** |
| **Static HTML** | Open [`docs/bpmn-viewer/index.html`](https://github.com/horizons237-admin/vehicle-debugging-assistant/blob/main/docs/bpmn-viewer/index.html) via a local server |
| **GitHub Pages** | After Pages is enabled on `/docs`: `/bpmn-viewer/` |

Local static preview:

```bash
cd docs
python3 -m http.server 8080
# http://localhost:8080/bpmn-viewer/
```

Library (CDN): `bpmn-visualization@0.47.0` from jsDelivr — same API as the [upstream repo](https://github.com/process-analytics/bpmn-visualization-js).

## Source files

Repository: [`docs/bpmn/`](https://github.com/horizons237-admin/vehicle-debugging-assistant/tree/main/docs/bpmn)

| # | Process | File |
|---|---------|------|
| 1 | Diagnostic analysis | [`01_diagnostic_analysis_l2.bpmn`](https://github.com/horizons237-admin/vehicle-debugging-assistant/blob/main/docs/bpmn/01_diagnostic_analysis_l2.bpmn) |
| 2 | Bus-log pipeline | [`02_buslog_pipeline_l2.bpmn`](https://github.com/horizons237-admin/vehicle-debugging-assistant/blob/main/docs/bpmn/02_buslog_pipeline_l2.bpmn) |
| 3 | Self diagnostic | [`03_self_diagnostic_l2.bpmn`](https://github.com/horizons237-admin/vehicle-debugging-assistant/blob/main/docs/bpmn/03_self_diagnostic_l2.bpmn) |
| 4 | CI/CD report import | [`04_cicd_import_l2.bpmn`](https://github.com/horizons237-admin/vehicle-debugging-assistant/blob/main/docs/bpmn/04_cicd_import_l2.bpmn) |

See also: [Process diagrams](Process-Diagrams) · [UML Activity](UML-Activity)
