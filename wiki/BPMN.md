# BPMN Level-2 diagrams

BPMN 2.0 XML process models (`isExecutable="false"`). Open with [bpmn.io](https://demo.bpmn.io), Camunda Modeler, or a VS Code BPMN extension.

Repository: [`docs/bpmn/`](https://github.com/horizons237-admin/vehicle-debugging-assistant/tree/main/docs/bpmn)

---

## 1. Diagnostic analysis

**File:** [`01_diagnostic_analysis_l2.bpmn`](https://github.com/horizons237-admin/vehicle-debugging-assistant/blob/main/docs/bpmn/01_diagnostic_analysis_l2.bpmn)

```text
Start → Connect ECU → [Sim | UDS/DoIP | OBD-II]
  → Read DTCs (0x19 / OBD) → Enrich (J2012 / ODX / Triage)
  → Health + Timeline → [LLM?] → [Ticket Jira/CodeBeamer?]
  → Export (JSON / Confluence) → End
```

- **Lanes:** Engineer · Extension VDA · ALM
- **Gateways:** Transport, LLM, Ticket (exclusive)

---

## 2. Bus-log pipeline

**File:** [`02_buslog_pipeline_l2.bpmn`](https://github.com/horizons237-admin/vehicle-debugging-assistant/blob/main/docs/bpmn/02_buslog_pipeline_l2.bpmn)

```text
Select file → [BLF | MF4 | ASC | Text]
  → Normalize frames → CAN Flow Analyzer
  → [DBC?] → JSON Report + Audit → End
```

- Commands: *Decode BLF/MF4*, *Parse ASC*, *Analyze CAN Bus Flow*

---

## 3. Self diagnostic

**File:** [`03_self_diagnostic_l2.bpmn`](https://github.com/horizons237-admin/vehicle-debugging-assistant/blob/main/docs/bpmn/03_self_diagnostic_l2.bpmn)

```text
Start → Parallel probes
  ├ Runtime (VS Code, Python)
  ├ Backend scripts
  ├ Live probes (UDS/OBD/DoIP/DBC)
  └ Config / integrations
→ Join → TreeView / StatusBar → [ok | warn | error]
```

- **Parallel gateway** for concurrent health checks

---

## 4. CI/CD report import

**File:** [`04_cicd_import_l2.bpmn`](https://github.com/horizons237-admin/vehicle-debugging-assistant/blob/main/docs/bpmn/04_cicd_import_l2.bpmn)

```text
CI report → [Manual | Folder Watch]
  → Schema validation → [ok → Map + Triage | invalid → Reject]
```

- Commands: *Import CI/CD Report*, *Start CI Watch*

---

## Viewing BPMN XML

1. Download the `.bpmn` file from the repo
2. Open at [demo.bpmn.io](https://demo.bpmn.io) → *Open file*
3. Or use Camunda Modeler for full layout editing

See also: [UML Activity](UML-Activity) · [Process diagrams overview](Process-Diagrams)
