# Process diagrams – BPMN & UML

Vehicle Debugging Assistant documents **four core processes** in two notations:

1. **Diagnostische Analyse** – connect → DTC → health → optional LLM/ticket → export
2. **Bus-Log Pipeline** – BLF/MF4/ASC/text → frames → flow → optional DBC → report
3. **Self Diagnostic** – parallel probes → aggregate → ok/warn/error
4. **CI/CD Import** – manual/watch → validate → map/triage or reject

| # | BPMN | UML PlantUML | UML Mermaid |
|---|------|--------------|-------------|
| 1 | [docs/bpmn/01_…](bpmn/01_diagnostic_analysis_l2.bpmn) | [docs/uml/01_….puml](uml/01_diagnostic_analysis.puml) | [docs/uml/01_….mmd](uml/01_diagnostic_analysis.mmd) |
| 2 | [docs/bpmn/02_…](bpmn/02_buslog_pipeline_l2.bpmn) | [docs/uml/02_….puml](uml/02_buslog_pipeline.puml) | [docs/uml/02_….mmd](uml/02_buslog_pipeline.mmd) |
| 3 | [docs/bpmn/03_…](bpmn/03_self_diagnostic_l2.bpmn) | [docs/uml/03_….puml](uml/03_self_diagnostic.puml) | [docs/uml/03_….mmd](uml/03_self_diagnostic.mmd) |
| 4 | [docs/bpmn/04_…](bpmn/04_cicd_import_l2.bpmn) | [docs/uml/04_….puml](uml/04_cicd_import.puml) | [docs/uml/04_….mmd](uml/04_cicd_import.mmd) |

See [uml/README.md](uml/README.md) for BPMN ↔ UML notation comparison.
