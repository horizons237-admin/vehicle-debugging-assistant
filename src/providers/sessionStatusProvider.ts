import * as vscode from 'vscode';
import { getConfig } from '../utils/config';
import { getEcuSession, onDidChangeSession } from '../utils/sessionStore';

export class SessionStatusProvider implements vscode.TreeDataProvider<StatusItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<StatusItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private readonly _sub: vscode.Disposable;

  constructor() {
    this._sub = onDidChangeSession(() => this.refresh());
  }

  dispose(): void {
    this._sub.dispose();
    this._onDidChangeTreeData.dispose();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  setConnected(_value: boolean): void {
    this.refresh();
  }

  setLastAction(_action: string): void {
    this.refresh();
  }

  getTreeItem(element: StatusItem): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<StatusItem[]> {
    const config = getConfig();
    const s = getEcuSession();
    const modeLabel =
      s.mode === 'simulation' ? 'Simulation' : s.mode === 'real' ? 'Real' : '—';

    const items: StatusItem[] = [
      new StatusItem(
        'Connection',
        s.connected ? `Connected (${modeLabel})` : 'Disconnected',
        s.connected ? 'check' : 'circle-slash'
      ),
      new StatusItem('VIN / Vehicle', s.vin || s.vehicleId || '—', 'tag'),
      new StatusItem('Session', s.sessionName || 'None', 'symbol-namespace'),
      new StatusItem('Transport', s.transport === 'none' ? '—' : s.transport, 'radio-tower'),
      new StatusItem('Interface', `${config.canInterface} / ${config.canChannel}`, 'plug'),
      new StatusItem('TX / RX', `${config.txId} → ${config.rxId}`, 'arrow-both'),
      new StatusItem('Last action', s.lastAction || '—', 'history')
    ];
    return Promise.resolve(items);
  }
}

class StatusItem extends vscode.TreeItem {
  constructor(label: string, description: string, icon: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.iconPath = new vscode.ThemeIcon(icon);
  }
}
