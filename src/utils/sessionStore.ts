import * as vscode from 'vscode';

/**
 * Workspace-scoped session state for Vehicle Debugging Assistant (P2).
 * Single source of truth for ECU connection, transport mode, and last AI summary.
 */

export type TransportMode = 'can' | 'doip' | 'simulation';

export interface EcuSessionState {
  connected: boolean;
  mode: 'real' | 'simulation' | 'none';
  transport: TransportMode | 'none';
  sessionName: string;
  lastAction: string;
  connectedAt?: string;
}

const SESSION_KEY = 'vehicleDebug.ecuSession';

let workspaceState: vscode.Memento | undefined;
let lastAiSummary: string | undefined;

let session: EcuSessionState = {
  connected: false,
  mode: 'none',
  transport: 'none',
  sessionName: 'None',
  lastAction: '—'
};

const _onDidChange = new vscode.EventEmitter<EcuSessionState>();
export const onDidChangeSession = _onDidChange.event;

/** Call once from activate() with ExtensionContext.workspaceState */
export function initSessionStore(state: vscode.Memento): void {
  workspaceState = state;
  const saved = state.get<EcuSessionState>(SESSION_KEY);
  if (saved) {
    session = {
      ...session,
      lastAction: saved.lastAction || '—',
      sessionName: 'None',
      connected: false,
      mode: 'none',
      transport: 'none'
    };
  }
}

export function getEcuSession(): EcuSessionState {
  return { ...session };
}

export function isEcuConnected(): boolean {
  return session.connected;
}

export function setEcuConnected(options: {
  connected: boolean;
  mode?: 'real' | 'simulation' | 'none';
  transport?: TransportMode | 'none';
  sessionName?: string;
  lastAction?: string;
}): void {
  session = {
    connected: options.connected,
    mode: options.mode ?? (options.connected ? session.mode : 'none'),
    transport: options.transport ?? (options.connected ? session.transport : 'none'),
    sessionName: options.sessionName ?? (options.connected ? session.sessionName : 'None'),
    lastAction: options.lastAction ?? session.lastAction,
    connectedAt: options.connected ? new Date().toISOString() : undefined
  };
  void workspaceState?.update(SESSION_KEY, {
    lastAction: session.lastAction,
    sessionName: session.sessionName
  });
  _onDidChange.fire(getEcuSession());
}

export function setLastAction(action: string): void {
  session = { ...session, lastAction: action };
  void workspaceState?.update(SESSION_KEY, {
    lastAction: session.lastAction,
    sessionName: session.sessionName
  });
  _onDidChange.fire(getEcuSession());
}

export function setLastAiSummary(text: string | undefined): void {
  lastAiSummary = text;
}

export function getLastAiSummary(): string | undefined {
  return lastAiSummary;
}
