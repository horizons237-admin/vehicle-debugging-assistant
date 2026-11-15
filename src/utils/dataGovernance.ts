import * as vscode from 'vscode';

export type DataScope = 'local-only' | 'alm' | 'llm-remote';

export interface GovernancePolicy {
  allowAlmExport: boolean;
  allowLlmRemote: boolean;
  allowPartnerExport: boolean;
  redactVin: boolean;
  redactLocation: boolean;
}

const AUDIT_CHANNEL = 'Vehicle Debug Governance';

export function getGovernancePolicy(): GovernancePolicy {
  const c = vscode.workspace.getConfiguration('vehicleDebug');
  const allowRemoteLlm =
    c.get<boolean>('llm.allowRemoteDataUpload', false) === true &&
    c.get<boolean>('llm.remote.enabled', false) === true;
  return {
    allowAlmExport: c.get<boolean>('governance.allowAlmExport', true),
    allowLlmRemote: allowRemoteLlm,
    allowPartnerExport: c.get<boolean>('governance.allowPartnerExport', true),
    redactVin: c.get<boolean>('governance.redactVin', false),
    redactLocation: c.get<boolean>('governance.redactLocation', true)
  };
}

export function assertScope(scope: DataScope, action: string): boolean {
  const p = getGovernancePolicy();
  if (scope === 'local-only') {
    audit('allow', scope, action);
    return true;
  }
  if (scope === 'alm') {
    if (!p.allowAlmExport) {
      audit('deny', scope, action);
      vscode.window.showWarningMessage(`Governance: ALM export blocked (${action})`);
      return false;
    }
    audit('allow', scope, action);
    return true;
  }
  if (scope === 'llm-remote') {
    if (!p.allowLlmRemote) {
      audit('deny', scope, action);
      vscode.window.showWarningMessage(
        `Governance: remote LLM blocked — enable llm.remote + allowRemoteDataUpload (${action})`
      );
      return false;
    }
    audit('allow', scope, action);
    return true;
  }
  return false;
}

export function audit(decision: 'allow' | 'deny', scope: DataScope, action: string): void {
  const ch = vscode.window.createOutputChannel(AUDIT_CHANNEL);
  ch.appendLine(`${new Date().toISOString()}  ${decision.toUpperCase()}  scope=${scope}  action=${action}`);
}

export function showGovernancePanel(): void {
  const p = getGovernancePolicy();
  const md = [
    '# Data governance',
    '',
    '| Scope / flag | Value |',
    '|--------------|-------|',
    `| ALM export | ${p.allowAlmExport} |`,
    `| Remote LLM | ${p.allowLlmRemote} |`,
    `| Partner export | ${p.allowPartnerExport} |`,
    `| Redact VIN | ${p.redactVin} |`,
    `| Redact location | ${p.redactLocation} |`,
    '',
    'Audit trail: Output channel **Vehicle Debug Governance**.',
    '',
    'Settings: `vehicleDebug.governance.*`, `vehicleDebug.llm.allowRemoteDataUpload`.'
  ].join('\n');
  void vscode.workspace
    .openTextDocument({ content: md, language: 'markdown' })
    .then((doc) => vscode.window.showTextDocument(doc, { preview: true }));
}

export function redactForExport<T extends Record<string, unknown>>(
  payload: T,
  policy = getGovernancePolicy()
): T {
  const clone = JSON.parse(JSON.stringify(payload)) as T;
  if (policy.redactVin) walkRedact(clone, ['vin', 'VIN', 'vehicleId']);
  if (policy.redactLocation) {
    walkRedact(clone, ['lat', 'lon', 'latitude', 'longitude', 'position', 'gps', 'geocode']);
  }
  return clone;
}

function walkRedact(obj: any, keys: string[]): void {
  if (!obj || typeof obj !== 'object') return;
  for (const k of Object.keys(obj)) {
    if (keys.some((x) => x.toLowerCase() === k.toLowerCase())) obj[k] = '[REDACTED]';
    else walkRedact(obj[k], keys);
  }
}
