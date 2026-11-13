import * as vscode from 'vscode';

export type ErrorCategory =
  | 'software_bug'
  | 'communication'
  | 'safety_mechanism'
  | 'configuration'
  | 'timing'
  | 'unknown';

export interface AnalyzedError {
  id: string;
  category: ErrorCategory;
  severity: 'critical' | 'major' | 'minor';
  asilImpact?: string;
  source: string;
  description: string;
  recommendation?: string;
  evidence?: Record<string, unknown>;
  timestamp: string;
}

export class ErrorTreeProvider implements vscode.TreeDataProvider<ErrorTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ErrorTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private errors: AnalyzedError[] = [];

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  setErrors(errors: AnalyzedError[]): void {
    this.errors = errors;
    this.refresh();
  }

  getErrors(): AnalyzedError[] {
    return this.errors;
  }

  clear(): void {
    this.errors = [];
    this.refresh();
  }

  getTreeItem(element: ErrorTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<ErrorTreeItem[]> {
    return Promise.resolve(this.errors.map((e) => new ErrorTreeItem(e)));
  }
}

export class ErrorTreeItem extends vscode.TreeItem {
  constructor(public readonly error: AnalyzedError) {
    super(`[${error.severity}] ${error.category}`, vscode.TreeItemCollapsibleState.None);
    this.description = error.description.slice(0, 80);
    this.tooltip = `${error.description}\nASIL: ${error.asilImpact || 'N/A'}\nSource: ${error.source}`;
    this.contextValue = 'analyzedError';
    this.iconPath = new vscode.ThemeIcon(
      error.severity === 'critical' ? 'error' : error.severity === 'major' ? 'warning' : 'info'
    );
  }
}
