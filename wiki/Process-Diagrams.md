# Process diagrams (BPMN & UML)

Vehicle Debugging Assistant documents **four core processes** in two notations for stakeholders and developers.

| # | Process | BPMN Level 2 | UML Activity |
|---|---------|--------------|--------------|
| 1 | Diagnostic analysis | [BPMN](BPMN#1-diagnostic-analysis) | [UML](UML-Activity#1-diagnostic-analysis) |
| 2 | Bus-log pipeline | [BPMN](BPMN#2-bus-log-pipeline) | [UML](UML-Activity#2-bus-log-pipeline) |
| 3 | Self diagnostic | [BPMN](BPMN#3-self-diagnostic) | [UML](UML-Activity#3-self-diagnostic) |
| 4 | CI/CD report import | [BPMN](BPMN#4-cicd-report-import) | [UML](UML-Activity#4-cicd-report-import) |

## Source files in the repository

| Notation | Path |
|----------|------|
| BPMN 2.0 XML | [`docs/bpmn/`](https://github.com/horizons237-admin/vehicle-debugging-assistant/tree/main/docs/bpmn) |
| UML PlantUML | [`docs/uml/*.puml`](https://github.com/horizons237-admin/vehicle-debugging-assistant/tree/main/docs/uml) |
| UML Mermaid | [`docs/uml/*.mmd`](https://github.com/horizons237-admin/vehicle-debugging-assistant/tree/main/docs/uml) |
| Comparison index | [`docs/PROCESS_DIAGRAMS.md`](https://github.com/horizons237-admin/vehicle-debugging-assistant/blob/main/docs/PROCESS_DIAGRAMS.md) |

## BPMN vs UML (when to use which)

| Aspect | BPMN 2.0 (Level 2) | UML Activity |
|--------|--------------------|--------------|
| Audience | Process / ops / ALM | Software design / implementation |
| Gateways | Exclusive, Parallel | Decision / fork-join |
| Roles | Lanes | Partitions |
| VDA use | Workflow documentation | Mapping to VS Code commands & Python backends |

**Same control flow** is modelled in both sets.

## Safety

All paths are **analysis support only** — no vehicle control, no ASIL confirmation.
