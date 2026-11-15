import * as vscode from 'vscode';
import { StatusSignal } from '../utils/statusCatalog';

export class StatusTreeProvider implements vscode.TreeDataProvider<StatusItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<StatusItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private signals: StatusSignal[] = [];

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  clear(): void {
    this.signals = [];
    this.refresh();
  }

  setSignals(signals: StatusSignal[]): void {
    this.signals = signals;
    this.refresh();
  }

  getSignals(): StatusSignal[] {
    return this.signals;
  }

  getTreeItem(element: StatusItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: StatusItem): Thenable<StatusItem[]> {
    if (!element) {
      if (!this.signals.length) {
        return Promise.resolve([
          new StatusItem('No status signals', 'Run "Read Vehicle Status"', 'info')
        ]);
      }
      const byCat = new Map<string, StatusSignal[]>();
      for (const s of this.signals) {
        const list = byCat.get(s.category) || [];
        list.push(s);
        byCat.set(s.category, list);
      }
      const order = ['identity', 'energy', 'motion', 'thermal', 'body', 'other'];
      return Promise.resolve(
        order
          .filter((c) => byCat.has(c))
          .map((cat) => {
            const parent = new StatusItem(
              cat.toUpperCase(),
              `${byCat.get(cat)!.length}`,
              iconCat(cat),
              vscode.TreeItemCollapsibleState.Expanded
            );
            parent.category = cat;
            return parent;
          })
      );
    }

    if (element.category) {
      return Promise.resolve(
        this.signals
          .filter((s) => s.category === element.category)
          .map((s) => {
            const val = s.value == null ? '—' : `${s.value}${s.unit ? ' ' + s.unit : ''}`;
            const item = new StatusItem(s.name, val, 'symbol-ruler');
            item.tooltip = `${s.name} (${s.did})\n${val}\nsource=${s.source || 'uds'}`;
            return item;
          })
      );
    }
    return Promise.resolve([]);
  }
}

function iconCat(cat: string): string {
  switch (cat) {
    case 'energy':
      return 'zap';
    case 'motion':
      return 'dashboard';
    case 'thermal':
      return 'flame';
    case 'body':
      return 'lock';
    case 'identity':
      return 'tag';
    default:
      return 'circle-outline';
  }
}

export class StatusItem extends vscode.TreeItem {
  category?: string;
  constructor(
    label: string,
    description: string,
    icon: string,
    collapsible: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
  ) {
    super(label, collapsible);
    this.description = description;
    this.iconPath = new vscode.ThemeIcon(icon);
  }
}
