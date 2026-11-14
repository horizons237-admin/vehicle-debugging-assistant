import * as vscode from 'vscode';
import {
  isValidVin,
  setVehicleIdentity,
  getEcuSession,
  clearVehicleIdentity,
  isEcuConnected,
  setLastAction
} from '../utils/sessionStore';
import { runPythonScript } from '../utils/pythonRunner';

export async function setVinCommand(): Promise<void> {
  const current = getEcuSession().vin || getEcuSession().vehicleId;
  const vin = await vscode.window.showInputBox({
    prompt: 'Vehicle VIN (17 characters) or leave empty to clear',
    value: current || '',
    placeHolder: 'e.g. WVWZZZ1JZXW000001',
    validateInput: (v) => {
      if (!v || !v.trim()) return null;
      const t = v.trim().toUpperCase();
      if (t.length === 17 && !isValidVin(t)) {
        return 'VIN should be 17 chars without I/O/Q';
      }
      if (t.length > 32) return 'Max 32 characters for lab vehicle id';
      return null;
    }
  });
  if (vin === undefined) return;
  if (!vin.trim()) {
    clearVehicleIdentity();
    vscode.window.showInformationMessage('VIN cleared');
    return;
  }
  const t = vin.trim().toUpperCase();
  if (t.length === 17) {
    setVehicleIdentity({ vin: t });
  } else {
    setVehicleIdentity({ vehicleId: t });
  }
  vscode.window.showInformationMessage(`Vehicle identity set: ${t}`);
}

export async function readVinFromDidCommand(): Promise<void> {
  if (!isEcuConnected()) {
    const choice = await vscode.window.showWarningMessage(
      'Not connected to ECU. Enter VIN manually?',
      'Enter VIN',
      'Cancel'
    );
    if (choice === 'Enter VIN') {
      await setVinCommand();
    }
    return;
  }

  const result = await runPythonScript('uds_client.py', ['read_did'], {
    did: '0xF190'
  });

  const data = result.data as { value?: string; did?: string; status?: string } | undefined;
  let vin: string | undefined;

  if (result.success && data?.value) {
    vin = String(data.value).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }

  if (!vin) {
    const sim = await vscode.window.showInformationMessage(
      'DID F190 not available. Use simulation VIN or enter manually?',
      'Simulation VIN',
      'Enter manually',
      'Cancel'
    );
    if (sim === 'Simulation VIN') {
      vin = 'WVWZZZSIMULAT0001'.slice(0, 17);
    } else if (sim === 'Enter manually') {
      await setVinCommand();
      return;
    } else {
      return;
    }
  }

  if (vin.length > 17) vin = vin.slice(0, 17);
  setVehicleIdentity({ vin });
  setLastAction(`VIN from DID F190 (${vin})`);
  vscode.window.showInformationMessage(`VIN: ${vin}`);
}
