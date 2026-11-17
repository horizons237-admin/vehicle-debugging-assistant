import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { DtcTreeProvider, DtcTreeItem } from './providers/dtcTreeProvider';
import { ErrorTreeProvider, ErrorTreeItem } from './providers/errorTreeProvider';
import { SessionStatusProvider } from './providers/sessionStatusProvider';
import { ConnectionsTreeProvider } from './providers/connectionsTreeProvider';
import { StatusTreeProvider } from './providers/statusTreeProvider';
import { HealthTreeProvider } from './providers/healthTreeProvider';
import { SelfDiagnosticProvider } from './providers/selfDiagnosticProvider';
import { ConnectionManager } from './connections/connectionManager';
import { ConnectionKind } from './connections/types';
import { connectEcu, disconnectEcu } from './commands/connectEcu';
import { readDtcs } from './commands/readDtcs';
import { clearDtcs } from './commands/clearDtcs';
import { analyzeLog } from './commands/analyzeLog';
import { readDid } from './commands/readDid';
import { configureConnections, setConnectionSecret, testConnection } from './commands/configureConnections';
import { aiAnalyzeError, aiAnalyzeDtc, aiAnalyzeSelection, aiAnalyzeAllErrors } from './commands/aiAnalyze';
import { createTicketFromError, createTicketFromDtc } from './commands/createTicket';
import { exportReportToConfluence } from './commands/exportConfluence';
import { importCicdReport } from './commands/importCicdReport';
import { analyzeArxml } from './commands/analyzeArxml';
import { doipDiscover } from './commands/doipDiscover';
import { showReport } from './webviews/reportPanel';
import { showBpmnViewer } from './webviews/bpmnViewerPanel';
import { showDashboard } from './webviews/dashboardPanel';
import { getConfig } from './utils/config';
import { setExtensionPath } from './utils/pythonRunner';
import { getLastAiSummary, initSessionStore, setLastAction, onDidChangeSession } from './utils/sessionStore';
import { runAnomalyAssist } from './commands/anomalyAssistCmd';
import { openGovernancePanel, testGovernanceScopes } from './commands/governanceCmd';
import { exportPartnerPack } from './commands/partnerExportCmd';
import { importFleetOffline } from './commands/fleetOfflineCmd';
import { runOtaCorrelation, openOtaCampaignsFile } from './commands/otaCorrelationCmd';
import { runCyberChecklist } from './commands/cyberChecklistCmd';
import { exportIncidentPack } from './commands/incidentPackCmd';
import { readEvChargingStatus } from './commands/evStatusCmd';
import { runSelfDiagnosticCommand, exportSelfDiagnostic } from './commands/selfDiagCmd';
import { sovdDiscoverCommand } from './commands/sovdDiscover';
import { pullRemoteDiagnostics } from './commands/remoteDiagnosticsCmd';
import { showSessionTimeline } from './commands/showTimeline';
import { analyzeCanFlow } from './commands/canFlowCmd';
import { probeBuslogHeader, analyzeBuslogBinary, decodeBuslog } from './commands/buslogCmd';
import { parseAscLog, analyzeAscLog } from './commands/ascCmd';
import { loadDbcSymbols, annotateLogWithDbc } from './commands/dbcCmd';
import { setVinCommand, readVinFromDidCommand } from './commands/vehicleIdentity';
import { exportHealthSnapshot } from './commands/exportHealth';
import { readVehicleStatus } from './commands/readVehicleStatus';
import { openAuditLog } from './utils/auditLog';
import { diffHealthSnapshotFiles } from './commands/healthDiffCmd';
import { selectActiveEcu, addEcuTarget, removeEcuTarget, showActiveEcuInfo } from './commands/multiEcuCmd';
import { obdConnect, obdReadPids, obdReadDtcs, obdClearDtcs, obdReadVin } from './commands/obdCmd';
import { doipDiagnosticSession, doipReadDtcs } from './commands/doipDiagnosticCmd';
import { showJ2534Status, showDpduStatus } from './commands/j2534Cmd';
import { startCiReportWatch, stopCiReportWatch } from './commands/ciWatchCmd';
import {
  loadOdxDescription, applyOdxDtcsToView, readDtcExtended, readObdReadiness, readObdMode09, lookupJ2012
} from './commands/standardsCmd';
import { udsReadMemory, udsTesterPresent } from './commands/udsExtendedCmd';

let dtcProvider: DtcTreeProvider;
let errorProvider: ErrorTreeProvider;
let sessionProvider: SessionStatusProvider;
let connectionsProvider: ConnectionsTreeProvider;
let statusProvider: StatusTreeProvider;
let healthProvider: HealthTreeProvider;
let selfDiagProvider: SelfDiagnosticProvider;
let connectionManager: ConnectionManager;
let statusBar: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  setExtensionPath(context.extensionPath);
  initSessionStore(context.workspaceState);
  connectionManager = new ConnectionManager(context);
  dtcProvider = new DtcTreeProvider();
  errorProvider = new ErrorTreeProvider();
  sessionProvider = new SessionStatusProvider();
  connectionsProvider = new ConnectionsTreeProvider(connectionManager);
  statusProvider = new StatusTreeProvider();
  healthProvider = new HealthTreeProvider(dtcProvider, errorProvider);
  selfDiagProvider = new SelfDiagnosticProvider();

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('vehicleDebug.dtcView', dtcProvider),
    vscode.window.registerTreeDataProvider('vehicleDebug.errorView', errorProvider),
    vscode.window.registerTreeDataProvider('vehicleDebug.sessionView', sessionProvider),
    vscode.window.registerTreeDataProvider('vehicleDebug.connectionsView', connectionsProvider),
    vscode.window.registerTreeDataProvider('vehicleDebug.healthView', healthProvider),
    vscode.window.registerTreeDataProvider('vehicleDebug.selfDiagView', selfDiagProvider),
    onDidChangeSession(() => { sessionProvider.refresh(); healthProvider.refresh(); updateStatusBar(false); })
  );

  const reg = (id: string, fn: (...a: any[]) => any) => vscode.commands.registerCommand(id, fn);

  context.subscriptions.push(
    reg('vehicleDebug.connectEcu', async () => {
      if (await connectEcu()) { updateStatusBar(true); setLastAction('Connected ECU'); await readDtcs(dtcProvider, errorProvider); healthProvider.refresh(); }
    }),
    reg('vehicleDebug.disconnectEcu', async () => {
      await disconnectEcu(); updateStatusBar(false); dtcProvider.clear(); errorProvider.clear(); statusProvider.clear(); healthProvider.refresh(); setLastAction('Disconnected ECU');
    }),
    reg('vehicleDebug.readDtcs', async () => { await readDtcs(dtcProvider, errorProvider); healthProvider.refresh(); }),
    reg('vehicleDebug.clearDtcs', async () => { await clearDtcs(dtcProvider, errorProvider); healthProvider.refresh(); }),
    reg('vehicleDebug.analyzeLog', async () => { await analyzeLog(errorProvider); healthProvider.refresh(); }),
    reg('vehicleDebug.readDid', async () => { await readDid(); }),
    reg('vehicleDebug.showReport', async () => { showReport(context, errorProvider.getErrors(), dtcProvider.getDtcs()); }),
    reg('vehicleDebug.refreshViews', () => {
      dtcProvider.refresh(); errorProvider.refresh(); sessionProvider.refresh(); connectionsProvider.refresh();
      statusProvider.refresh(); healthProvider.refresh(); selfDiagProvider.refresh();
    }),
    reg('vehicleDebug.openSampleLog', async () => {
      try {
        const sample = vscode.Uri.joinPath(context.extensionUri, 'resources', 'sample_trace.log');
        await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(sample));
      } catch { vscode.window.showWarningMessage('Sample log not found'); }
    }),
    reg('vehicleDebug.configureConnections', async () => { await configureConnections(connectionManager); connectionsProvider.refresh(); }),
    reg('vehicleDebug.testConnection', async (id?: ConnectionKind) => { await testConnection(connectionManager, id); }),
    reg('vehicleDebug.setConnectionSecret', async (id?: ConnectionKind) => { await setConnectionSecret(connectionManager, id); }),
    reg('vehicleDebug.aiAnalyzeSelection', async () => { await aiAnalyzeSelection(); }),
    reg('vehicleDebug.aiAnalyzeAll', async () => { await aiAnalyzeAllErrors(errorProvider.getErrors(), dtcProvider.getDtcs()); }),
    reg('vehicleDebug.aiAnalyzeError', async (item?: ErrorTreeItem) => { const e = item?.error || errorProvider.getErrors()[0]; if (e) await aiAnalyzeError(e); }),
    reg('vehicleDebug.aiAnalyzeDtc', async (item?: DtcTreeItem) => { const d = item?.dtc || dtcProvider.getDtcs()[0]; if (d) await aiAnalyzeDtc(d); }),
    reg('vehicleDebug.createTicketFromError', async (item?: ErrorTreeItem) => { const e = item?.error || errorProvider.getErrors()[0]; if (e) await createTicketFromError(e); }),
    reg('vehicleDebug.createTicketFromDtc', async (item?: DtcTreeItem) => { const d = item?.dtc || dtcProvider.getDtcs()[0]; if (d) await createTicketFromDtc(d); }),
    reg('vehicleDebug.exportConfluence', async () => { await exportReportToConfluence(errorProvider.getErrors(), dtcProvider.getDtcs(), getLastAiSummary()); }),
    reg('vehicleDebug.importCicdReport', async () => { await importCicdReport(errorProvider, dtcProvider); healthProvider.refresh(); setLastAction('Imported CI/CD report'); }),
    reg('vehicleDebug.analyzeArxml', async () => { await analyzeArxml(errorProvider, dtcProvider); healthProvider.refresh(); }),
    reg('vehicleDebug.doipDiscover', async () => { await doipDiscover(); }),
    reg('vehicleDebug.setVin', async () => { await setVinCommand(); sessionProvider.refresh(); healthProvider.refresh(); }),
    reg('vehicleDebug.readVinFromDid', async () => { await readVinFromDidCommand(); sessionProvider.refresh(); healthProvider.refresh(); }),
    reg('vehicleDebug.refreshHealth', async () => { healthProvider.refresh(); }),
    reg('vehicleDebug.exportHealthSnapshot', async () => { await exportHealthSnapshot(dtcProvider, errorProvider); }),
    reg('vehicleDebug.diffHealthSnapshots', async () => { await diffHealthSnapshotFiles(); }),
    reg('vehicleDebug.openTriageRules', async () => {
      const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const p = root ? path.join(root, 'resources', 'sample_triage_rules.json') : path.join(context.extensionPath, 'resources', 'sample_triage_rules.json');
      if (!fs.existsSync(p) && root) {
        const sample = path.join(context.extensionPath, 'resources', 'sample_triage_rules.json');
        if (fs.existsSync(sample)) fs.copyFileSync(sample, p);
      }
      if (fs.existsSync(p)) await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(p));
      else vscode.window.showWarningMessage('Triage rules sample not found');
    }),
    reg('vehicleDebug.readVehicleStatus', async () => { await readVehicleStatus(statusProvider); healthProvider.refresh(); }),
    reg('vehicleDebug.anomalyAssist', async () => { await runAnomalyAssist(dtcProvider, errorProvider); }),
    reg('vehicleDebug.openGovernance', async () => { await openGovernancePanel(); }),
    reg('vehicleDebug.testGovernance', async () => { await testGovernanceScopes(); }),
    reg('vehicleDebug.exportPartnerPack', async () => { await exportPartnerPack(dtcProvider, errorProvider); }),
    reg('vehicleDebug.importFleetOffline', async () => { await importFleetOffline(); }),
    reg('vehicleDebug.otaCorrelation', async () => { await runOtaCorrelation(dtcProvider, errorProvider, statusProvider); }),
    reg('vehicleDebug.openOtaCampaigns', async () => { await openOtaCampaignsFile(); }),
    reg('vehicleDebug.cyberChecklist', async () => { await runCyberChecklist(); }),
    reg('vehicleDebug.exportIncidentPack', async () => { await exportIncidentPack(dtcProvider, errorProvider, statusProvider); }),
    reg('vehicleDebug.readEvStatus', async () => { await readEvChargingStatus(statusProvider); }),
    reg('vehicleDebug.runSelfDiagnostic', async () => { await runSelfDiagnosticCommand(selfDiagProvider, statusBar); }),
    reg('vehicleDebug.exportSelfDiagnostic', async () => { await exportSelfDiagnostic(selfDiagProvider); }),
    reg('vehicleDebug.sovdDiscover', async () => { await sovdDiscoverCommand(); }),
    reg('vehicleDebug.pullRemoteDiagnostics', async () => { await pullRemoteDiagnostics(dtcProvider, statusProvider, errorProvider, healthProvider); }),
    reg('vehicleDebug.showTimeline', async () => { await showSessionTimeline(); }),
    reg('vehicleDebug.showBpmnViewer', () => showBpmnViewer(context)),
    reg('vehicleDebug.showDashboard', () => {
      showDashboard({ errorCount: errorProvider.getErrors().length, dtcCount: dtcProvider.getDtcs().length, healthTop: healthProvider.getRanked().slice(0, 5).map((r) => r.label) });
    }),
    reg('vehicleDebug.openAuditLog', async () => { await openAuditLog(); }),
    reg('vehicleDebug.analyzeCanFlow', async () => { await analyzeCanFlow(); }),
    reg('vehicleDebug.probeBuslog', async () => { await probeBuslogHeader(); }),
    reg('vehicleDebug.decodeBuslog', async () => { await decodeBuslog(); }),
    reg('vehicleDebug.analyzeBuslogBinary', async () => { await analyzeBuslogBinary(); }),
    reg('vehicleDebug.parseAsc', async () => { await parseAscLog(); }),
    reg('vehicleDebug.analyzeAsc', async () => { await analyzeAscLog(); }),
    reg('vehicleDebug.loadDbc', async () => { await loadDbcSymbols(); }),
    reg('vehicleDebug.annotateLogWithDbc', async () => { await annotateLogWithDbc(); }),
    reg('vehicleDebug.selectActiveEcu', async () => { await selectActiveEcu(); sessionProvider.refresh(); }),
    reg('vehicleDebug.addEcuTarget', async () => { await addEcuTarget(); }),
    reg('vehicleDebug.removeEcuTarget', async () => { await removeEcuTarget(); }),
    reg('vehicleDebug.showActiveEcu', () => { showActiveEcuInfo(); }),
    reg('vehicleDebug.obdConnect', async () => { await obdConnect(); sessionProvider.refresh(); }),
    reg('vehicleDebug.obdReadDtcs', async () => { await obdReadDtcs(dtcProvider); healthProvider.refresh(); }),
    reg('vehicleDebug.obdReadPids', async () => { await obdReadPids(statusProvider); healthProvider.refresh(); }),
    reg('vehicleDebug.obdReadVin', async () => { await obdReadVin(); sessionProvider.refresh(); }),
    reg('vehicleDebug.obdClearDtcs', async () => { await obdClearDtcs(); }),
    reg('vehicleDebug.doipDiagnosticSession', async () => { await doipDiagnosticSession(); }),
    reg('vehicleDebug.doipReadDtcs', async () => { await doipReadDtcs(dtcProvider); healthProvider.refresh(); }),
    reg('vehicleDebug.j2534Status', async () => { await showJ2534Status(); }),
    reg('vehicleDebug.dpduStatus', async () => { await showDpduStatus(); }),
    reg('vehicleDebug.startCiWatch', async () => { await startCiReportWatch(errorProvider, dtcProvider); }),
    reg('vehicleDebug.stopCiWatch', () => { stopCiReportWatch(); }),
    reg('vehicleDebug.loadOdx', async () => { await loadOdxDescription(); }),
    reg('vehicleDebug.applyOdxDtcs', async () => { await applyOdxDtcsToView(dtcProvider); healthProvider.refresh(); }),
    reg('vehicleDebug.readDtcExtended', async () => { await readDtcExtended(dtcProvider); healthProvider.refresh(); }),
    reg('vehicleDebug.readObdReadiness', async () => { await readObdReadiness(); }),
    reg('vehicleDebug.readObdMode09', async () => { await readObdMode09(); }),
    reg('vehicleDebug.lookupJ2012', async () => { await lookupJ2012(); }),
    reg('vehicleDebug.udsReadMemory', async () => { await udsReadMemory(); }),
    reg('vehicleDebug.udsTesterPresent', async () => { await udsTesterPresent(); })
  );

  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBar.text = '$(car) Vehicle Debug';
  statusBar.tooltip = 'Vehicle Debugging Assistant';
  statusBar.command = 'vehicleDebug.connectEcu';
  statusBar.show();
  context.subscriptions.push(statusBar);
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('vehicleDebug')) connectionsProvider.refresh();
  }));
  context.subscriptions.push({ dispose: () => stopCiReportWatch() });
  void selfDiagProvider.runAndRefresh(false).then(() => selfDiagProvider.refresh());
  vscode.window.showInformationMessage(`Vehicle Debugging Assistant ready (Python: ${getConfig().pythonPath})`);
}

function updateStatusBar(connected: boolean) {
  if (!statusBar) return;
  if (connected) {
    statusBar.text = '$(car) Vehicle Debug: Connected';
    statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    statusBar.command = 'vehicleDebug.disconnectEcu';
  } else {
    statusBar.text = '$(car) Vehicle Debug';
    statusBar.backgroundColor = undefined;
    statusBar.command = 'vehicleDebug.connectEcu';
  }
}

export function deactivate() {
  stopCiReportWatch();
}
