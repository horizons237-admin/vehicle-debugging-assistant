# UML Activity diagrams

Same four processes as [BPMN](BPMN), in **UML Activity** form (PlantUML + Mermaid).

Repository: [`docs/uml/`](https://github.com/horizons237-admin/vehicle-debugging-assistant/tree/main/docs/uml)

| Process | PlantUML | Mermaid |
|---------|----------|---------|
| Diagnostic analysis | [`.puml`](https://github.com/horizons237-admin/vehicle-debugging-assistant/blob/main/docs/uml/01_diagnostic_analysis.puml) | [`.mmd`](https://github.com/horizons237-admin/vehicle-debugging-assistant/blob/main/docs/uml/01_diagnostic_analysis.mmd) |
| Bus-log pipeline | [`.puml`](https://github.com/horizons237-admin/vehicle-debugging-assistant/blob/main/docs/uml/02_buslog_pipeline.puml) | [`.mmd`](https://github.com/horizons237-admin/vehicle-debugging-assistant/blob/main/docs/uml/02_buslog_pipeline.mmd) |
| Self diagnostic | [`.puml`](https://github.com/horizons237-admin/vehicle-debugging-assistant/blob/main/docs/uml/03_self_diagnostic.puml) | [`.mmd`](https://github.com/horizons237-admin/vehicle-debugging-assistant/blob/main/docs/uml/03_self_diagnostic.mmd) |
| CI/CD import | [`.puml`](https://github.com/horizons237-admin/vehicle-debugging-assistant/blob/main/docs/uml/04_cicd_import.puml) | [`.mmd`](https://github.com/horizons237-admin/vehicle-debugging-assistant/blob/main/docs/uml/04_cicd_import.mmd) |

---

## 1. Diagnostic analysis

```mermaid
flowchart TD
  Start([Engineer starts analysis]) --> Connect[Connect ECU<br/>Sim / CAN / DoIP]
  Connect --> GMode{Transport?}
  GMode -->|simulation| Sim[Simulation Mode]
  GMode -->|UDS/DoIP| Uds[UDS Session<br/>0x10 / TesterPresent]
  GMode -->|OBD-II| Obd[OBD-II Lab<br/>PIDs / Mode 03/09]
  Sim --> ReadDtc[Read DTCs<br/>0x19 / OBD]
  Uds --> ReadDtc
  Obd --> ReadDtc
  ReadDtc --> Enrich[Enrich<br/>J2012 / ODX / Triage]
  Enrich --> Health[Vehicle Health + Timeline]
  Health --> GLlm{LLM analysis?}
  GLlm -->|yes| Llm[LLM Assist<br/>opt-in]
  GLlm -->|no| GTicket
  Llm --> GTicket{Create ticket?}
  GTicket -->|yes| Alm[Jira / CodeBeamer]
  GTicket -->|no| Export
  Alm --> Export[Export Report<br/>JSON / Confluence]
  Export --> End([Analysis complete])
```

---

## 2. Bus-log pipeline

```mermaid
flowchart TD
  Start([Log file available]) --> Select[Choose file<br/>blf / mf4 / asc / log]
  Select --> GFmt{Format?}
  GFmt -->|BLF| Blf[BLF Decoder]
  GFmt -->|MF4| Mf4[MF4 Decoder]
  GFmt -->|ASC| Asc[ASC Parser]
  GFmt -->|Text| Txt[Text/Candump]
  Blf --> Frames[Normalize frames]
  Mf4 --> Frames
  Asc --> Frames
  Txt --> Frames
  Frames --> Flow[CAN Flow Analyzer]
  Flow --> GDbc{DBC?}
  GDbc -->|yes| Dbc[DBC Annotation]
  GDbc -->|no| Report
  Dbc --> Report[JSON Report + Audit]
  Report --> End([Report ready])
```

---

## 3. Self diagnostic

```mermaid
flowchart TD
  Start([Extension active / Run]) --> Fork{{Parallel probes}}
  Fork --> R[Runtime VS Code / Python]
  Fork --> B[Backend scripts]
  Fork --> P[Live probes UDS/OBD/DoIP]
  Fork --> C[Config / integrations]
  R --> Join{{Aggregate}}
  B --> Join
  P --> Join
  C --> Join
  Join --> Tree[TreeView + StatusBar]
  Tree --> G{Overall?}
  G -->|ok| Ok([ok])
  G -->|warn| Warn([warn – inform user])
  G -->|error| Err([error – show blocker])
```

---

## 4. CI/CD report import

```mermaid
flowchart TD
  Start([CI report produced]) --> GIn{Input?}
  GIn -->|manual| Man[importCicdReport]
  GIn -->|Watch| Watch[startCiWatch]
  Man --> Val[Validate JSON schema]
  Watch --> Val
  Val --> GVal{Valid?}
  GVal -->|ok| Map[Map to TreeViews]
  Map --> Triage[Apply triage rules]
  Triage --> Ok([Findings visible])
  GVal -->|invalid| Rej[Audit + Notification]
  Rej --> Fail([Import aborted])
```

---

## Viewing PlantUML

1. Open [plantuml.com/plantuml](https://www.plantuml.com/plantuml/uml/)
2. Paste contents of a `.puml` file from the repo
3. Or use the VS Code **PlantUML** extension

See also: [BPMN](BPMN) · [Process diagrams overview](Process-Diagrams)
