import * as vscode from 'vscode';
import { DiagItem, DiagReport, DiagStatus, runSelfDiagnostic } from '../utils/selfDiagnostic';

export class SelfDiagnosticProvider implements vscode.TreeDataProvider<DiagTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<DiagTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private report: DiagReport | undefined;
  private refreshing = false;

  refresh(): void { this._onDidChangeTreeData.fire(); }
  getReport(): DiagReport | undefined { return this.report; }

  async runAndRefresh(deep = true): Promise<DiagReport> {
    if (this.refreshing) {
      return this.report || { generatedAt: '', overall: 'info', items: [], summary: 'busy' };
    }
    this.refreshing = true;
    try {
      this.report = await runSelfDiagnostic({ deep });
      this.refresh();
      return this.report;
    } finally {
      this.refreshing = false;
    }
  }

  getTreeItem(element: DiagTreeItem): vscode.TreeItem { return element; }

  getChildren(element?: DiagTreeItem): Thenable<DiagTreeItem[]> {
    if (!this.report) {
      return Promise.resolve([new DiagTreeItem('Run “Self Diagnostic” to probe features', 'info', 'Vehicle Debug: Run Self Diagnostic', 'root')]);
    }
    if (!element) {
      const groups = [...new Set(this.report.items.map((i) => i.group))];
      const header = new DiagTreeItem(`Overall: ${this.report.overall.toUpperCase()}`, this.report.overall, this.report.summary, 'overall');
      return Promise.resolve([
        header,
        ...groups.map((g) => {
          const item = new DiagTreeItem(g, 'info', '', 'group');
          item.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
          (item as any).groupName = g;
          return item;
        })
      ]);
    }
    if (element.kind === 'group') {
      const g = (element as any).groupName as string;
      return Promise.resolve(this.report.items.filter((i) => i.group === g).map((i) => DiagTreeItem.fromItem(i)));
    }
    return Promise.resolve([]);
  }
}

export class DiagTreeItem extends vscode.TreeItem {
  constructor(label: string, public status: DiagStatus, detail: string, public kind: 'root' | 'overall' | 'group' | 'item') {
    super(label, kind === 'group' ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None);
    this.description = detail;
    this.tooltip = detail;
    this.iconPath = iconFor(status);
  }
  static fromItem(i: DiagItem): DiagTreeItem {
    const t = new DiagTreeItem(i.label, i.status, i.detail, 'item');
    t.tooltip = [i.detail, i.hint].filter(Boolean).join('\n');
    t.description = i.detail;
    return t;
  }
}

function iconFor(s: DiagStatus): vscode.ThemeIcon {
  switch (s) {
    case 'ok': return new vscode.ThemeIcon('pass');
    case 'warn': return new vscode.ThemeIcon('warning');
    case 'error': return new vscode.ThemeIcon('error');
    case 'skip': return new vscode.ThemeIcon('circle-outline');
    default: return new vscode.ThemeIcon('info');
  }
}
