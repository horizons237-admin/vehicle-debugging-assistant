import * as vscode from 'vscode';
import { getConfig } from '../utils/config';

export class SessionStatusProvider implements vscode.TreeDataProvider<StatusItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<StatusItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private connected = false;
  private session = 'None';
  private lastAction = '—';

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  setConnected(value: boolean): void {
    this.connected = value;
    this.session = value ? getConfig().defaultSession : 'None';
    this.refresh();
  }

  setLastAction(action: string): void {
    this.lastAction = action;
    this.refresh();
  }

  getTreeItem(element: StatusItem): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<StatusItem[]> {
    const config = getConfig();
    const items: StatusItem[] = [
      new StatusItem(
        'Connection',
        this.connected ? 'Connected' : 'Disconnected',
        this.connected ? '$(check)' : '$(circle-slash)'
      ),
      new StatusItem('Session', this.session, '$(symbol-namespace)'),
      new StatusItem('Interface', `${config.canInterface} / ${config.canChannel}`, '$(plug)'),
      new StatusItem('TX / RX', `${config.txId} → ${config.rxId}`, '$(arrow-both)'),
      new StatusItem('Last action', this.lastAction, '$(history)')
    ];
    return Promise.resolve(items);
  }
}

class StatusItem extends vscode.TreeItem {
  constructor(label: string, description: string, icon: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.iconPath = new vscode.ThemeIcon(icon.replace('$(', '').replace(')', ''));
  }
}
