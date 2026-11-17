import * as vscode from 'vscode';
import {
  listEcus,
  getActiveEcu,
  setActiveEcu,
  addOrUpdateEcu,
  removeEcu,
  EcuTarget
} from '../utils/ecuRegistry';
import { setLastAction } from '../utils/sessionStore';

export async function selectActiveEcu(): Promise<void> {
  const items = listEcus().map((e) => ({
    label: e.name,
    description: `${e.txId} → ${e.rxId} · ${e.protocol}`,
    detail: e.id,
    ecu: e
  }));
  const pick = await vscode.window.showQuickPick(items, { placeHolder: 'Select active ECU target' });
  if (!pick) return;
  setActiveEcu(pick.ecu.id);
  setLastAction(`Active ECU: ${pick.ecu.name}`);
  vscode.window.showInformationMessage(`Active ECU: ${pick.ecu.name} (${pick.ecu.txId}/${pick.ecu.rxId})`);
}

export async function addEcuTarget(): Promise<void> {
  const name = await vscode.window.showInputBox({ prompt: 'ECU name', value: 'Body Controller' });
  if (!name) return;
  const txId = await vscode.window.showInputBox({ prompt: 'TX ID', value: '0x7E2' });
  if (!txId) return;
  const rxId = await vscode.window.showInputBox({ prompt: 'RX ID', value: '0x7EA' });
  if (!rxId) return;
  const protocol = (await vscode.window.showQuickPick(['uds', 'obd2', 'doip'], {
    placeHolder: 'Protocol'
  })) as EcuTarget['protocol'] | undefined;
  if (!protocol) return;
  const id = `ecu-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;
  await addOrUpdateEcu({ id, name, txId, rxId, protocol });
  setActiveEcu(id);
  setLastAction(`Added ECU ${name}`);
  vscode.window.showInformationMessage(`ECU added and activated: ${name}`);
}

export async function removeEcuTarget(): Promise<void> {
  const items = listEcus().map((e) => ({ label: e.name, description: e.id, ecu: e }));
  const pick = await vscode.window.showQuickPick(items, { placeHolder: 'Remove ECU target' });
  if (!pick) return;
  await removeEcu(pick.ecu.id);
  setLastAction(`Removed ECU ${pick.ecu.name}`);
  vscode.window.showInformationMessage(`Removed ${pick.ecu.name}`);
}

export function showActiveEcuInfo(): void {
  const a = getActiveEcu();
  if (!a) {
    vscode.window.showWarningMessage('No active ECU');
    return;
  }
  vscode.window.showInformationMessage(
    `Active: ${a.name} | ${a.protocol} | TX ${a.txId} RX ${a.rxId}`
  );
}
