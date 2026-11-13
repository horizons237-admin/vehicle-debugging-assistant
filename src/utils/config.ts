import * as vscode from 'vscode';

export interface VehicleDebugConfig {
  pythonPath: string;
  /** Max time for a single Python backend call (ms). Default 60000. */
  pythonTimeoutMs: number;
  canInterface: string;
  canChannel: string;
  txId: string;
  rxId: string;
  defaultSession: string;
  enableSafetyClassification: boolean;
  logLevel: string;
}

export function getConfig(): VehicleDebugConfig {
  const cfg = vscode.workspace.getConfiguration('vehicleDebug');
  return {
    pythonPath: cfg.get<string>('pythonPath', 'python3'),
    pythonTimeoutMs: cfg.get<number>('pythonTimeoutMs', 60_000),
    canInterface: cfg.get<string>('canInterface', 'socketcan'),
    canChannel: cfg.get<string>('canChannel', 'can0'),
    txId: cfg.get<string>('txId', '0x7E0'),
    rxId: cfg.get<string>('rxId', '0x7E8'),
    defaultSession: cfg.get<string>('defaultSession', 'extended'),
    enableSafetyClassification: cfg.get<boolean>('enableSafetyClassification', true),
    logLevel: cfg.get<string>('logLevel', 'info')
  };
}
