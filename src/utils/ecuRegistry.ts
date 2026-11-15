import * as vscode from 'vscode';

export interface EcuTarget {
  id: string;
  name: string;
  txId: string;
  rxId: string;
  protocol: 'uds' | 'obd2' | 'doip';
  logicalAddress?: string;
}

const KEY = 'vehicleDebug.ecuTargets';
const ACTIVE_KEY = 'vehicleDebug.activeEcuId';

let memento: vscode.Memento | undefined;
let targets: EcuTarget[] = [];
let activeId: string | undefined;

const defaultTargets: EcuTarget[] = [
  { id: 'ecu-engine', name: 'Engine / ECM', txId: '0x7E0', rxId: '0x7E8', protocol: 'uds' },
  { id: 'ecu-tcm', name: 'Transmission', txId: '0x7E1', rxId: '0x7E9', protocol: 'uds' },
  { id: 'ecu-obd', name: 'OBD functional', txId: '0x7DF', rxId: '0x7E8', protocol: 'obd2' }
];

export function initEcuRegistry(state: vscode.Memento): void {
  memento = state;
  targets = state.get<EcuTarget[]>(KEY) || [...defaultTargets];
  activeId = state.get<string>(ACTIVE_KEY) || targets[0]?.id;
}

export function listEcus(): EcuTarget[] {
  return [...targets];
}

export function getActiveEcu(): EcuTarget | undefined {
  return targets.find((t) => t.id === activeId) || targets[0];
}

export function setActiveEcu(id: string): EcuTarget | undefined {
  const t = targets.find((x) => x.id === id);
  if (!t) return undefined;
  activeId = id;
  memento?.update(ACTIVE_KEY, id);
  return t;
}

export async function addOrUpdateEcu(ecu: EcuTarget): Promise<void> {
  const i = targets.findIndex((t) => t.id === ecu.id);
  if (i >= 0) targets[i] = ecu;
  else targets.push(ecu);
  await memento?.update(KEY, targets);
}

export async function removeEcu(id: string): Promise<void> {
  targets = targets.filter((t) => t.id !== id);
  if (activeId === id) activeId = targets[0]?.id;
  await memento?.update(KEY, targets);
  await memento?.update(ACTIVE_KEY, activeId);
}

export function getActiveAddressConfig(): { txId: string; rxId: string; protocol: string; name: string } {
  const a = getActiveEcu();
  return {
    txId: a?.txId || '0x7E0',
    rxId: a?.rxId || '0x7E8',
    protocol: a?.protocol || 'uds',
    name: a?.name || 'Default'
  };
}
