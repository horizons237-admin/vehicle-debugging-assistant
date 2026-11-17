# UML Activity Diagrams – Vehicle Debugging Assistant

Companion to BPMN Level-2 (`docs/bpmn/`). Same four processes, **UML Activity** notation for comparison.

| UML (PlantUML) | UML (Mermaid) | BPMN counterpart | Process |
|----------------|---------------|------------------|----------|
| `01_diagnostic_analysis.puml` | `01_diagnostic_analysis.mmd` | `01_diagnostic_analysis_l2.bpmn` | Diagnostische Analyse |
| `02_buslog_pipeline.puml` | `02_buslog_pipeline.mmd` | `02_buslog_pipeline_l2.bpmn` | Bus-Log Pipeline |
| `03_self_diagnostic.puml` | `03_self_diagnostic.mmd` | `03_self_diagnostic_l2.bpmn` | Self Diagnostic |
| `04_cicd_import.puml` | `04_cicd_import.mmd` | `04_cicd_import_l2.bpmn` | CI/CD Report Import |

## How to view

- **PlantUML:** https://www.plantuml.com/plantuml or VS Code PlantUML extension
- **Mermaid:** GitHub markdown preview, https://mermaid.live

## BPMN vs UML Activity (comparison)

| Aspect | BPMN 2.0 (Level 2) | UML Activity |
|--------|--------------------|--------------|
| **Primary audience** | Process / business + tooling | Software design / implementation |
| **Standard** | OMG BPMN | OMG UML |
| **Gateways** | Exclusive, Parallel (named) | Decision nodes / fork-join |
| **Lanes / pools** | First-class (roles) | Partitions (`|Role|`) |
| **Events** | Start/End/Intermediate rich | Start/stop; fewer event types |
| **Executable intent** | Often process engines | Design / documentation |
| **VDA use** | Ops & ALM workflows | Extension control flow |

**Same control flow** is modelled in both sets; choose BPMN for process stakeholders, UML for developers mapping to commands/modules.

## Safety

All paths = **analysis aid only** — no vehicle control, no ASIL confirmation.
