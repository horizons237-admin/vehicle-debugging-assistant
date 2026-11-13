import * as vscode from 'vscode';

export interface DtcItem {
  code: string;
  status: string;
  description: string;
  severity: 'critical' | 'major' | 'minor' | 'info';
  freezeFrame?: string;
}

export class DtcTreeProvider implements vscode.TreeDataProvider<DtcTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<DtcTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private dtcs: DtcItem[] = [];

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  clear(): void {
    this.dtcs = [];
    this.refresh();
  }

  setDtcs(dtcs: DtcItem[]): void {
    this.dtcs = dtcs;
    this.refresh();
  }

  getDtcs(): DtcItem[] {
    return this.dtcs;
  }

  getTreeItem(element: DtcTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: DtcTreeItem): Thenable<DtcTreeItem[]> {
    if (element) {
      if (element.dtc) {
        const children: DtcTreeItem[] = [
          new DtcTreeItem(
            element.dtc.description,
            'Description',
            vscode.TreeItemCollapsibleState.None,
            'info'
          )
        ];
        if (element.dtc.freezeFrame) {
          children.push(
            new DtcTreeItem(
              `Freeze frame: ${element.dtc.freezeFrame}`,
              'Snapshot at fault time',
              vscode.TreeItemCollapsibleState.None,
              'info'
            )
          );
        }
        return Promise.resolve(children);
      }
      return Promise.resolve([]);
    }

    if (this.dtcs.length === 0) {
      return Promise.resolve([
        new DtcTreeItem('No DTCs', 'Connect to ECU and read DTCs', vscode.TreeItemCollapsibleState.None, 'info')
      ]);
    }

    return Promise.resolve(
      this.dtcs.map(
        (d) =>
          new DtcTreeItem(
            `${d.code} — ${d.status}`,
            d.description,
            d.freezeFrame
              ? vscode.TreeItemCollapsibleState.Collapsed
              : vscode.TreeItemCollapsibleState.None,
            d.severity,
            d
          )
      )
    );
  }
}

export class DtcTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly tooltip: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly severity: string,
    public readonly dtc?: DtcItem
  ) {
    super(label, collapsibleState);
    this.tooltip = tooltip;
    this.description = dtc?.description;

    switch (severity) {
      case 'critical':
        this.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
        break;
      case 'major':
        this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('editorWarning.foreground'));
        break;
      case 'minor':
        this.iconPath = new vscode.ThemeIcon('info');
        break;
      default:
        this.iconPath = new vscode.ThemeIcon('circle-outline');
    }

    this.contextValue = dtc ? 'dtc' : 'dtcDetail';
  }
}
