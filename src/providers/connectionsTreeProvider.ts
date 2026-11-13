import * as vscode from 'vscode';
import { ConnectionManager } from '../connections/connectionManager';
import { CONNECTION_DEFS, ConnectionDef, ConnectionKind, ConnectionState } from '../connections/types';

type Node = GroupNode | ConnNode;

class GroupNode extends vscode.TreeItem {
  constructor(public readonly group: string, public readonly children: ConnNode[]) {
    super(group, vscode.TreeItemCollapsibleState.Expanded);
    this.contextValue = 'connectionGroup';
    this.iconPath = new vscode.ThemeIcon(
      group === 'ALM' ? 'folder-library' : group === 'Docs' ? 'book' : 'hubot'
    );
  }
}

class ConnNode extends vscode.TreeItem {
  constructor(
    public readonly def: ConnectionDef,
    public readonly state: ConnectionState
  ) {
    super(def.label, vscode.TreeItemCollapsibleState.None);
    this.description = statusLabel(state.status);
    this.tooltip = `${def.description}\nStatus: ${state.status}${state.message ? '\n' + state.message : ''}`;
    this.iconPath = statusIcon(state.status);
    this.contextValue = 'connection';
    this.command = {
      command: 'vehicleDebug.testConnection',
      title: 'Test Connection',
      arguments: [def.id]
    };
  }
}

function statusLabel(s: string): string {
  switch (s) {
    case 'ok': return '✓ OK';
    case 'error': return '✗ Error';
    case 'configured': return 'Configured';
    case 'disabled': return 'Not set';
    default: return '—';
  }
}

function statusIcon(s: string): vscode.ThemeIcon {
  switch (s) {
    case 'ok': return new vscode.ThemeIcon('pass', new vscode.ThemeColor('testing.iconPassed'));
    case 'error': return new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));
    case 'configured': return new vscode.ThemeIcon('circle-outline');
    case 'disabled': return new vscode.ThemeIcon('circle-slash');
    default: return new vscode.ThemeIcon('question');
  }
}

export class ConnectionsTreeProvider implements vscode.TreeDataProvider<Node> {
  private _onDidChangeTreeData = new vscode.EventEmitter<Node | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private manager: ConnectionManager) {
    manager.refreshConfiguredFlags();
  }

  refresh(): void {
    this.manager.refreshConfiguredFlags();
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: Node): vscode.TreeItem {
    return element;
  }

  getChildren(element?: Node): Thenable<Node[]> {
    if (element instanceof GroupNode) {
      return Promise.resolve(element.children);
    }

    const groups = ['ALM', 'Docs', 'AI'] as const;
    const nodes: GroupNode[] = [];
    for (const g of groups) {
      const defs = CONNECTION_DEFS.filter((d) => d.group === g);
      const children = defs.map((d) => {
        const st = this.manager.getState(d.id);
        return new ConnNode(d, st);
      });
      nodes.push(new GroupNode(g, children));
    }
    return Promise.resolve(nodes);
  }
}
