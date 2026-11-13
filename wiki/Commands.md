# Catalogue des commandes

Toutes les commandes sont préfixées **Vehicle Debug** dans la palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).

## Connexion & diagnostic

| Commande | ID |
|----------|-----|
| Connect to ECU | `vehicleDebug.connectEcu` |
| Disconnect ECU | `vehicleDebug.disconnectEcu` |
| Read DTCs | `vehicleDebug.readDtcs` |
| Clear DTCs | `vehicleDebug.clearDtcs` |
| Read Data Identifier (DID) | `vehicleDebug.readDid` |
| DoIP: Vehicle Discovery | `vehicleDebug.doipDiscover` |

## Analyse

| Commande | ID |
|----------|-----|
| Analyze Log File | `vehicleDebug.analyzeLog` |
| Open Sample Trace Log | `vehicleDebug.openSampleLog` |
| Analyze ARXML (DEM/DCM/DTC) | `vehicleDebug.analyzeArxml` |
| Import CI/CD Analysis Report | `vehicleDebug.importCicdReport` |
| Show Analysis Report | `vehicleDebug.showReport` |
| Refresh Views | `vehicleDebug.refreshViews` |

## Intelligence artificielle

| Commande | ID |
|----------|-----|
| AI: Analyze Selection / Log | `vehicleDebug.aiAnalyzeSelection` |
| AI: Analyze All Errors & DTCs | `vehicleDebug.aiAnalyzeAll` |
| AI: Analyze This Error | `vehicleDebug.aiAnalyzeError` |
| AI: Analyze This DTC | `vehicleDebug.aiAnalyzeDtc` |

## ALM & documentation

| Commande | ID |
|----------|-----|
| Configure Connections… | `vehicleDebug.configureConnections` |
| Test Selected Connection | `vehicleDebug.testConnection` |
| Set Connection Token / Password | `vehicleDebug.setConnectionSecret` |
| Create Ticket from Error | `vehicleDebug.createTicketFromError` |
| Create Ticket from DTC | `vehicleDebug.createTicketFromDtc` |
| Export Report to Confluence | `vehicleDebug.exportConfluence` |

## Menus contextuels

- Vue **Errors** : analyser IA / créer ticket sur un item
- Vue **DTCs** : analyser IA / créer ticket sur un DTC
- Titre des vues : refresh, read DTCs, configure / test connection
