import * as vscode from 'vscode';
import { DtcTreeProvider, DtcTreeItem } from './providers/dtcTreeProvider';
import { ErrorTreeProvider, ErrorTreeItem } from './providers/errorTreeProvider';
import { SessionStatusProvider } from './providers/sessionStatusProvider';
import { ConnectionsTreeProvider } from './providers/connectionsTreeProvider';
import { ConnectionManager } from './connections/connectionManager';
import { ConnectionKind } from './connections/types';
import { connectEcu, disconnectEcu } from './commands/connectEcu';
import { readDtcs } from './commands/readDtcs';
import { clearDtcs } from './commands/clearDtcs';
import { analyzeLog } from './commands/analyzeLog';
import { readDid } from './commands/readDid';
import {
  configureConnections,
  setConnectionSecret,
  testConnection
} from './commands/configureConnections';
import {
  aiAnalyzeError,
  aiAnalyzeDtc,
  aiAnalyzeSelection,
  aiAnalyzeAllErrors
} from './commands/aiAnalyze';
import { createTicketFromError, createTicketFromDtc } from './commands/createTicket';
import { exportReportToConfluence } from './commands/exportConfluence';
import { importCicdReport } from './commands/importCicdReport';
import { analyzeArxml } from './commands/analyzeArxml';
import { doipDiscover } from './commands/doipDiscover';
import { showReport } from './webviews/reportPanel';
import { getConfig } from './utils/config';
import { setExtensionPath } from './utils/pythonRunner';
import { getLastAiSummary, initSessionStore, setLastAction, onDidChangeSession } from './utils/sessionStore';

let dtcProvider: DtcTreeProvider;
let errorProvider: ErrorTreeProvider;
let sessionProvider: SessionStatusProvider;
let connectionsProvider: ConnectionsTreeProvider;
let connectionManager: ConnectionManager;
let statusBar: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  console.log('Vehicle Debugging Assistant is now active');
  setExtensionPath(context.extensionPath);
  initSessionStore(context.workspaceState);

  connectionManager = new ConnectionManager(context);
  dtcProvider = new DtcTreeProvider();
  errorProvider = new ErrorTreeProvider();
  sessionProvider = new SessionStatusProvider();
  connectionsProvider = new ConnectionsTreeProvider(connectionManager);

  context.subscriptions.push(
    onDidChangeSession((s) => {
      updateStatusBar(s.connected);
      sessionProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('vehicleDebug.dtcView', dtcProvider),
    vscode.window.registerTreeDataProvider('vehicleDebug.errorView', errorProvider),
    vscode.window.registerTreeDataProvider('vehicleDebug.sessionView', sessionProvider),
    vscode.window.registerTreeDataProvider('vehicleDebug.connectionsView', connectionsProvider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vehicleDebug.connectEcu', async () => {
      const success = await connectEcu();
      if (success) {
        sessionProvider.setConnected(true);
        setLastAction('Connected');
        updateStatusBar(true);
        vscode.window.showInformationMessage('Connected to ECU');
        await readDtcs(dtcProvider, errorProvider);
        setLastAction('Read DTCs');
      }
    }),

    vscode.commands.registerCommand('vehicleDebug.disconnectEcu', async () => {
      await disconnectEcu();
      sessionProvider.setConnected(false);
      setLastAction('Disconnected');
      updateStatusBar(false);
      dtcProvider.clear();
      errorProvider.clear();
      vscode.window.showInformationMessage('Disconnected from ECU');
    }),

    vscode.commands.registerCommand('vehicleDebug.readDtcs', async () => {
      await readDtcs(dtcProvider, errorProvider);
      setLastAction('Read DTCs');
    }),

    vscode.commands.registerCommand('vehicleDebug.clearDtcs', async () => {
      await clearDtcs(dtcProvider, errorProvider);
      setLastAction('Cleared DTCs');
    }),

    vscode.commands.registerCommand('vehicleDebug.analyzeLog', async () => {
      await analyzeLog(errorProvider);
      setLastAction('Analyzed log');
    }),

    vscode.commands.registerCommand('vehicleDebug.readDid', async () => {
      await readDid();
      setLastAction('Read DID');
    }),

    vscode.commands.registerCommand('vehicleDebug.showReport', async () => {
      showReport(context, errorProvider.getErrors(), dtcProvider.getDtcs());
    }),

    vscode.commands.registerCommand('vehicleDebug.refreshViews', () => {
      dtcProvider.refresh();
      errorProvider.refresh();
      sessionProvider.refresh();
      connectionsProvider.refresh();
    }),

    vscode.commands.registerCommand('vehicleDebug.openSampleLog', async () => {
      const sample = vscode.Uri.joinPath(context.extensionUri, 'resources', 'sample_trace.log');
      try {
        const doc = await vscode.workspace.openTextDocument(sample);
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage('Sample log opened – use "Analyze Log File" on it');
      } catch {
        vscode.window.showWarningMessage('Sample log not found');
      }
    }),

    vscode.commands.registerCommand('vehicleDebug.configureConnections', async () => {
      await configureConnections(connectionManager, connectionsProvider);
    }),
    vscode.commands.registerCommand('vehicleDebug.testConnection', async (id?: ConnectionKind) => {
      await testConnection(connectionManager, id, connectionsProvider);
    }),
    vscode.commands.registerCommand('vehicleDebug.setConnectionSecret', async (id?: ConnectionKind) => {
      await setConnectionSecret(connectionManager, id, connectionsProvider);
    }),

    vscode.commands.registerCommand('vehicleDebug.aiAnalyzeSelection', async () => {
      await aiAnalyzeSelection(connectionManager);
    }),
    vscode.commands.registerCommand('vehicleDebug.aiAnalyzeAll', async () => {
      await aiAnalyzeAllErrors(
        connectionManager,
        errorProvider.getErrors(),
        dtcProvider.getDtcs()
      );
    }),
    vscode.commands.registerCommand('vehicleDebug.aiAnalyzeError', async (item?: ErrorTreeItem) => {
      const err = item?.error;
      if (!err) {
        const errors = errorProvider.getErrors();
        if (errors.length === 0) {
          vscode.window.showWarningMessage('Aucune erreur à analyser');
          return;
        }
        await aiAnalyzeError(connectionManager, errors[0]);
        return;
      }
      await aiAnalyzeError(connectionManager, err);
    }),
    vscode.commands.registerCommand('vehicleDebug.aiAnalyzeDtc', async (item?: DtcTreeItem) => {
      const dtc = item?.dtc;
      if (!dtc) {
        const dtcs = dtcProvider.getDtcs();
        if (dtcs.length === 0) {
          vscode.window.showWarningMessage('Aucun DTC à analyser');
          return;
        }
        await aiAnalyzeDtc(connectionManager, dtcs[0]);
        return;
      }
      await aiAnalyzeDtc(connectionManager, dtc);
    }),

    vscode.commands.registerCommand('vehicleDebug.createTicketFromError', async (item?: ErrorTreeItem) => {
      const err = item?.error || errorProvider.getErrors()[0];
      if (!err) {
        vscode.window.showWarningMessage('Aucune erreur');
        return;
      }
      await createTicketFromError(connectionManager, err);
    }),
    vscode.commands.registerCommand('vehicleDebug.createTicketFromDtc', async (item?: DtcTreeItem) => {
      const dtc = item?.dtc || dtcProvider.getDtcs()[0];
      if (!dtc) {
        vscode.window.showWarningMessage('Aucun DTC');
        return;
      }
      await createTicketFromDtc(connectionManager, dtc);
    }),

    vscode.commands.registerCommand('vehicleDebug.exportConfluence', async () => {
      await exportReportToConfluence(
        connectionManager,
        errorProvider.getErrors(),
        dtcProvider.getDtcs(),
        getLastAiSummary()
      );
    }),

    vscode.commands.registerCommand('vehicleDebug.importCicdReport', async () => {
      await importCicdReport(errorProvider, dtcProvider);
      setLastAction('Imported CI/CD report');
    }),

    vscode.commands.registerCommand('vehicleDebug.analyzeArxml', async () => {
      await analyzeArxml(errorProvider, dtcProvider);
      setLastAction('Analyzed ARXML');
    }),

    vscode.commands.registerCommand('vehicleDebug.doipDiscover', async () => {
      await doipDiscover();
      setLastAction('DoIP discovery');
    })
  );

  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBar.text = '$(car) Vehicle Debug';
  statusBar.tooltip = 'Vehicle Debugging Assistant';
  statusBar.command = 'vehicleDebug.connectEcu';
  statusBar.show();
  context.subscriptions.push(statusBar);

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('vehicleDebug')) {
        connectionsProvider.refresh();
      }
    })
  );

  vscode.window.showInformationMessage(
    `Vehicle Debugging Assistant ready (Python: ${getConfig().pythonPath})`
  );
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

export function deactivate() {}
