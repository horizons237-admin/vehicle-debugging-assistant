import * as vscode from 'vscode';

/**
 * Workspace-scoped session state for Vehicle Debugging Assistant.
 * ECU connection + vehicle identity (VIN) + last AI summary.
 */

export type TransportMode = 'can' | 'doip' | 'simulation';

export interface EcuSessionState {
  connected: boolean;
  mode: 'real' | 'simulation' | 'none';
  transport: TransportMode | 'none';
  sessionName: string;
  lastAction: string;
  connectedAt?: string;
  /** Vehicle Identification Number (17 chars) or lab vehicle id */
  vin?: string;
  vehicleId?: string;
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

export function initSessionStore(state: vscode.Memento): void {
  workspaceState = state;
  const saved = state.get<Partial<EcuSessionState>>(SESSION_KEY);
  if (saved) {
    session = {
      ...session,
      lastAction: saved.lastAction || '—',
      vin: saved.vin,
      vehicleId: saved.vehicleId,
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
    ...session,
    connected: options.connected,
    mode: options.mode ?? (options.connected ? session.mode : 'none'),
    transport: options.transport ?? (options.connected ? session.transport : 'none'),
    sessionName: options.sessionName ?? (options.connected ? session.sessionName : 'None'),
    lastAction: options.lastAction ?? session.lastAction,
    connectedAt: options.connected ? new Date().toISOString() : undefined
  };
  persistSoft();
  _onDidChange.fire(getEcuSession());
}

export function setVehicleIdentity(options: { vin?: string; vehicleId?: string }): void {
  const vin = options.vin?.trim().toUpperCase() || undefined;
  session = {
    ...session,
    vin: vin || (options.vehicleId ? undefined : session.vin),
    vehicleId: options.vehicleId?.trim() || (vin ? session.vehicleId : options.vehicleId),
    lastAction: vin ? `VIN set (${vin})` : session.lastAction
  };
  if (options.vehicleId && !vin) {
    session.vin = undefined;
    session.vehicleId = options.vehicleId.trim();
    session.lastAction = `Vehicle ID set (${session.vehicleId})`;
  }
  persistSoft();
  _onDidChange.fire(getEcuSession());
}

export function clearVehicleIdentity(): void {
  session = { ...session, vin: undefined, vehicleId: undefined };
  persistSoft();
  _onDidChange.fire(getEcuSession());
}

export function setLastAction(action: string): void {
  session = { ...session, lastAction: action };
  persistSoft();
  _onDidChange.fire(getEcuSession());
}

export function setLastAiSummary(text: string | undefined): void {
  lastAiSummary = text;
}

export function getLastAiSummary(): string | undefined {
  return lastAiSummary;
}

/** ISO-like VIN check: 17 chars, no I/O/Q */
export function isValidVin(vin: string): boolean {
  const v = vin.trim().toUpperCase();
  if (v.length !== 17) return false;
  if (/[IOQ]/.test(v)) return false;
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(v);
}

function persistSoft(): void {
  void workspaceState?.update(SESSION_KEY, {
    lastAction: session.lastAction,
    sessionName: session.sessionName,
    vin: session.vin,
    vehicleId: session.vehicleId
  });
}
