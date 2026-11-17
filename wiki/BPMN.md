# BPMN Level-2 diagrams

BPMN 2.0 process models (`isExecutable="false"`) with **BPMN DI** layout for interactive rendering via **[bpmn-visualization](https://github.com/process-analytics/bpmn-visualization-js)** (Process Analytics).

## Interactive viewer

| Surface | URL / action |
|---------|----------------|
| **Live viewer (CDN)** | [Open BPMN viewer](https://cdn.jsdelivr.net/gh/horizons237-admin/vehicle-debugging-assistant@main/docs/bpmn-viewer/index.html) |
| **GitHub Pages** (after enable) | `https://horizons237-admin.github.io/vehicle-debugging-assistant/bpmn-viewer/` |
| **VS Code** | Command palette → **Vehicle Debug: Show BPMN Viewer** |
| **Local** | `cd docs && python3 -m http.server 8080` → http://localhost:8080/bpmn-viewer/ |

The viewer loads the library from jsDelivr (`bpmn-visualization@0.47.0`) and the diagram XML either from the same origin or from the repo CDN. Zoom and pan are enabled.

> **Tip for wiki readers:** click the **Live viewer (CDN)** link above — no install required.

---

## Source files

Repository path: [`docs/bpmn/`](https://github.com/horizons237-admin/vehicle-debugging-assistant/tree/main/docs/bpmn)

| # | Process | File |
|---|---------|------|
| 1 | Diagnostic analysis | [`01_diagnostic_analysis_l2.bpmn`](https://github.com/horizons237-admin/vehicle-debugging-assistant/blob/main/docs/bpmn/01_diagnostic_analysis_l2.bpmn) |
| 2 | Bus-log pipeline | [`02_buslog_pipeline_l2.bpmn`](https://github.com/horizons237-admin/vehicle-debugging-assistant/blob/main/docs/bpmn/02_buslog_pipeline_l2.bpmn) |
| 3 | Self diagnostic | [`03_self_diagnostic_l2.bpmn`](https://github.com/horizons237-admin/vehicle-debugging-assistant/blob/main/docs/bpmn/03_self_diagnostic_l2.bpmn) |
| 4 | CI/CD report import | [`04_cicd_import_l2.bpmn`](https://github.com/horizons237-admin/vehicle-debugging-assistant/blob/main/docs/bpmn/04_cicd_import_l2.bpmn) |

### 1. Diagnostic analysis

```text
Start → Connect ECU → [Sim | UDS/DoIP | OBD-II]
  → Read DTCs → Enrich → Health + Timeline → [LLM?] → [Ticket?]
  → Export → End
```

### 2. Bus-log pipeline

```text
Select file → [BLF | MF4 | ASC | Text] → Normalize → CAN Flow → [DBC?] → Report
```

### 3. Self diagnostic

```text
Start → Parallel probes → Join → TreeView / StatusBar → [ok | warn | error]
```

### 4. CI/CD report import

```text
CI report → [Manual | Watch] → Schema validation → Map + Triage | Reject
```

---

## Library

- Upstream: [process-analytics/bpmn-visualization-js](https://github.com/process-analytics/bpmn-visualization-js)
- CDN used by the project: `https://cdn.jsdelivr.net/npm/bpmn-visualization@0.47.0/dist/bpmn-visualization.min.js`
- Integration points:
  - Static HTML: `docs/bpmn-viewer/index.html`
  - VS Code webview: `src/webviews/bpmnViewerPanel.ts` (command `vehicleDebug.showBpmnViewer`)

## Other tools

- [demo.bpmn.io](https://demo.bpmn.io) — open a `.bpmn` file
- Camunda Modeler — full editing
- UML Activity counterparts: [UML Activity](UML-Activity)

See also: [Process diagrams overview](Process-Diagrams)
