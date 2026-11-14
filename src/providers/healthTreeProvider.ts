import * as vscode from 'vscode';
import { RankedFinding, loadTriageRules, rankFindings } from '../utils/triageRules';
import { getEcuSession } from '../utils/sessionStore';
import { DtcTreeProvider } from './dtcTreeProvider';
import { ErrorTreeProvider } from './errorTreeProvider';

export class HealthTreeProvider implements vscode.TreeDataProvider<HealthItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<HealthItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private ranked: RankedFinding[] = [];

  constructor(
    private readonly dtcProvider: DtcTreeProvider,
    private readonly errorProvider: ErrorTreeProvider
  ) {}

  refresh(): void {
    void this.rebuild();
  }

  async rebuild(): Promise<void> {
    const rules = await loadTriageRules();
    this.ranked = rankFindings(this.dtcProvider.getDtcs(), this.errorProvider.getErrors(), rules);
    this._onDidChangeTreeData.fire();
  }

  getRanked(): RankedFinding[] {
    return this.ranked;
  }

  getTreeItem(element: HealthItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: HealthItem): Promise<HealthItem[]> {
    if (!element) {
      await this.rebuild();
      const s = getEcuSession();
      const header = new HealthItem(
        `Health — VIN ${s.vin || 'not set'}`,
        `${this.ranked.length} finding(s) | mode ${s.mode}`,
        'pulse',
        vscode.TreeItemCollapsibleState.Expanded
      );
      header.contextValue = 'healthRoot';

      if (this.ranked.length === 0) {
        return [
          header,
          new HealthItem('No findings yet', 'Read DTCs or analyze log/ARXML', 'info')
        ];
      }

      const byPri = new Map<string, RankedFinding[]>();
      for (const f of this.ranked) {
        const list = byPri.get(f.priority) || [];
        list.push(f);
        byPri.set(f.priority, list);
      }

      const order = ['critical', 'high', 'medium', 'low', 'info'];
      const groups: HealthItem[] = [header];
      for (const p of order) {
        const list = byPri.get(p);
        if (!list?.length) continue;
        const g = new HealthItem(
          `${p.toUpperCase()} (${list.length})`,
          '',
          iconFor(p),
          vscode.TreeItemCollapsibleState.Expanded
        );
        g.priority = p;
        groups.push(g);
      }
      return groups;
    }

    if (element.priority) {
      return this.ranked
        .filter((f) => f.priority === element.priority)
        .map((f) => {
          const item = new HealthItem(f.label, f.actionHint || f.detail || f.source, iconFor(f.priority));
          item.finding = f;
          item.tooltip = new vscode.MarkdownString(
            `**${f.priority}** \`${f.kind}\`\n\n${f.label}\n\n${f.actionHint || ''}`
          );
          return item;
        });
    }

    return [];
  }
}

function iconFor(p: string): string {
  switch (p) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    default:
      return 'circle-outline';
  }
}

export class HealthItem extends vscode.TreeItem {
  priority?: string;
  finding?: RankedFinding;

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
