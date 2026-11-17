# BPMN Level-2 Diagramme – Vehicle Debugging Assistant

BPMN 2.0 XML (nicht ausführbar, Dokumentationsprozesse).  
Öffnen z. B. mit [bpmn.io](https://demo.bpmn.io), Camunda Modeler, VS Code BPMN Preview.

| Datei | Prozess |
|-------|---------|
| `01_diagnostic_analysis_l2.bpmn` | Diagnostische Analyse (Connect → DTC → Health → LLM → ALM) |
| `02_buslog_pipeline_l2.bpmn` | Bus-Log Pipeline (BLF/MF4/ASC/Text → Flow → DBC → Report) |
| `03_self_diagnostic_l2.bpmn` | Self Diagnostic (parallele Probes → Overall Status) |
| `04_cicd_import_l2.bpmn` | CI/CD Report Import (manuell/Watch → Validate → Triage) |

## Level-2 Merkmale

- **Exclusive Gateways** für Format-/Entscheidungszweige
- **Parallel Gateway** beim Self-Diagnostic
- Aufgaben mit Bezug zu konkreten VDA-Commands/Modulen
- Explizite Endzustände (ok / warn / error / Reject)

## Safety-Hinweis (übergreifend)

Alle Pfade sind **Analyse-Unterstützung** – keine Fahrzeugsteuerung, keine ASIL-Bestätigung.
