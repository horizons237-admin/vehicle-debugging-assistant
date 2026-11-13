import * as vscode from 'vscode';
import { ConnectionManager } from '../connections/connectionManager';
import { CONNECTION_DEFS, ConnectionKind } from '../connections/types';
import { ConnectionsTreeProvider } from '../providers/connectionsTreeProvider';

export async function configureConnections(
  manager: ConnectionManager,
  tree?: ConnectionsTreeProvider
): Promise<void> {
  const pick = await vscode.window.showQuickPick(
    CONNECTION_DEFS.map((d) => ({
      label: d.label,
      description: d.group,
      detail: d.description,
      id: d.id
    })),
    { placeHolder: 'Choisir une connexion à configurer' }
  );
  if (!pick) return;

  const def = CONNECTION_DEFS.find((d) => d.id === pick.id)!;

  const action = await vscode.window.showQuickPick(
    [
      { label: '$(settings-gear) Ouvrir les paramètres', action: 'settings' },
      { label: '$(key) Définir token / mot de passe', action: 'secret' },
      { label: '$(debug-start) Tester la connexion', action: 'test' },
      { label: '$(info) Voir l’état actuel', action: 'status' }
    ],
    { placeHolder: `Action pour ${def.label}` }
  );
  if (!action) return;

  if (action.action === 'settings') {
    const query = def.settingsKeys[0] || 'vehicleDebug';
    await vscode.commands.executeCommand('workbench.action.openSettings', query);
  } else if (action.action === 'secret') {
    await setConnectionSecret(manager, def.id, tree);
  } else if (action.action === 'test') {
    await testConnection(manager, def.id, tree);
  } else if (action.action === 'status') {
    const state = manager.getState(def.id);
    const hasSecret = await manager.hasSecret(def);
    const configured = manager.isConfigured(def);
    vscode.window.showInformationMessage(
      `${def.label}: status=${state.status}, configured=${configured}, secret=${hasSecret ? 'set' : 'missing'}` +
        (state.message ? ` — ${state.message}` : '')
    );
  }
}

export async function setConnectionSecret(
  manager: ConnectionManager,
  id?: ConnectionKind,
  tree?: ConnectionsTreeProvider
): Promise<void> {
  let kind = id;
  if (!kind) {
    const pick = await vscode.window.showQuickPick(
      CONNECTION_DEFS.map((d) => ({ label: d.label, id: d.id })),
      { placeHolder: 'Connexion dont il faut définir le secret' }
    );
    if (!pick) return;
    kind = pick.id as ConnectionKind;
  }

  const def = CONNECTION_DEFS.find((d) => d.id === kind)!;
  const value = await vscode.window.showInputBox({
    prompt: `Token / mot de passe pour ${def.label}`,
    password: true,
    placeHolder: 'Coller le token API ou le mot de passe (stocké dans Secret Storage)',
    ignoreFocusOut: true
  });

  if (value === undefined) return;
  await manager.setSecret(def, value.trim());
  vscode.window.showInformationMessage(
    value.trim()
      ? `Secret enregistré pour ${def.label}`
      : `Secret effacé pour ${def.label}`
  );
  tree?.refresh();
}

export async function testConnection(
  manager: ConnectionManager,
  id?: ConnectionKind,
  tree?: ConnectionsTreeProvider
): Promise<void> {
  let kind = id;
  if (!kind) {
    const pick = await vscode.window.showQuickPick(
      CONNECTION_DEFS.map((d) => ({ label: d.label, id: d.id })),
      { placeHolder: 'Connexion à tester' }
    );
    if (!pick) return;
    kind = pick.id as ConnectionKind;
  }

  const def = CONNECTION_DEFS.find((d) => d.id === kind)!;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Test ${def.label}…`,
      cancellable: false
    },
    async () => {
      const state = await manager.test(kind!);
      tree?.refresh();
      if (state.status === 'ok') {
        vscode.window.showInformationMessage(state.message || `${def.label}: OK`);
      } else {
        vscode.window.showWarningMessage(state.message || `${def.label}: échec`);
      }
    }
  );
}
