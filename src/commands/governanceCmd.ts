import * as vscode from 'vscode';
import { showGovernancePanel, assertScope, audit } from '../utils/dataGovernance';
import { setLastAction } from '../utils/sessionStore';

export async function openGovernancePanel(): Promise<void> {
  showGovernancePanel();
  audit('allow', 'local-only', 'open-governance-panel');
  setLastAction('Opened governance panel');
}

export async function testGovernanceScopes(): Promise<void> {
  assertScope('local-only', 'self-test-local');
  assertScope('alm', 'self-test-alm');
  assertScope('llm-remote', 'self-test-llm-remote');
  vscode.window.showInformationMessage(
    'Governance self-test written to Output → Vehicle Debug Governance'
  );
  setLastAction('Governance self-test');
}
