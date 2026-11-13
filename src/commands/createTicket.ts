import * as vscode from 'vscode';
import { ConnectionManager } from '../connections/connectionManager';
import { AnalyzedError } from '../providers/errorTreeProvider';
import { DtcItem } from '../providers/dtcTreeProvider';

type TicketTarget = 'jira-vwif' | 'jira-devstack' | 'codebeamer';

export async function createTicketFromError(
  manager: ConnectionManager,
  error: AnalyzedError
): Promise<void> {
  const target = await pickTarget(manager);
  if (!target) return;

  const summary = `[VehicleDebug][${error.severity}] ${error.category}: ${error.description.slice(0, 80)}`;
  const body = buildErrorBody(error);

  if (target.startsWith('jira')) {
    await createJiraIssue(manager, target as 'jira-vwif' | 'jira-devstack', summary, body);
  } else {
    await createCodebeamerItem(manager, summary, body);
  }
}

export async function createTicketFromDtc(
  manager: ConnectionManager,
  dtc: DtcItem
): Promise<void> {
  const target = await pickTarget(manager);
  if (!target) return;

  const summary = `[VehicleDebug][DTC] ${dtc.code} – ${dtc.description.slice(0, 60)}`;
  const body = [
    `*DTC:* ${dtc.code}`,
    `*Status:* ${dtc.status}`,
    `*Severity:* ${dtc.severity}`,
    `*Description:* ${dtc.description}`,
    dtc.freezeFrame ? `*Freeze frame:* ${dtc.freezeFrame}` : '',
    '',
    '_Créé depuis Vehicle Debugging Assistant (VS Code)_'
  ]
    .filter(Boolean)
    .join('\n');

  if (target.startsWith('jira')) {
    await createJiraIssue(manager, target as 'jira-vwif' | 'jira-devstack', summary, body);
  } else {
    await createCodebeamerItem(manager, summary, body);
  }
}

async function pickTarget(manager: ConnectionManager): Promise<TicketTarget | undefined> {
  const options: { label: string; id: TicketTarget; detail: string }[] = [];

  for (const id of ['jira-vwif', 'jira-devstack', 'codebeamer'] as TicketTarget[]) {
    const def = manager.getDefs().find((d) => d.id === id)!;
    const configured = manager.isConfigured(def);
    options.push({
      label: def.label,
      id,
      detail: configured ? 'Configured' : 'Not configured – will open settings if chosen'
    });
  }

  const pick = await vscode.window.showQuickPick(options, {
    placeHolder: 'Créer le ticket dans…'
  });
  return pick?.id;
}

async function createJiraIssue(
  manager: ConnectionManager,
  env: 'jira-vwif' | 'jira-devstack',
  summary: string,
  description: string
): Promise<void> {
  const key = env === 'jira-vwif' ? 'vwif' : 'devstack';
  const base = manager.getSetting(`vehicleDebug.jira.${key}.baseUrl`).replace(/\/$/, '');
  const email = manager.getSetting(`vehicleDebug.jira.${key}.email`);
  const projectKey = manager.getSetting(`vehicleDebug.jira.${key}.projectKey`);
  const def = manager.getDefs().find((d) => d.id === env)!;
  const token = await manager.getSecret(def);

  if (!base || !email || !projectKey || !token) {
    vscode.window.showWarningMessage(
      `Jira ${key} incomplet (URL, email, projectKey, token). Configurez puis réessayez.`
    );
    await vscode.commands.executeCommand(
      'workbench.action.openSettings',
      `vehicleDebug.jira.${key}`
    );
    return;
  }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Création ticket Jira…' },
    async () => {
      try {
        const auth = Buffer.from(`${email}:${token}`).toString('base64');
        const res = await fetch(`${base}/rest/api/2/issue`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            fields: {
              project: { key: projectKey },
              summary,
              description,
              issuetype: { name: 'Bug' }
            }
          })
        });

        if (!res.ok) {
          const t = await res.text();
          throw new Error(`HTTP ${res.status}: ${t.slice(0, 300)}`);
        }
        const data = (await res.json()) as any;
        const keyCreated = data.key || data.id;
        const url = `${base}/browse/${keyCreated}`;
        const open = await vscode.window.showInformationMessage(
          `Ticket Jira créé: ${keyCreated}`,
          'Ouvrir'
        );
        if (open === 'Ouvrir') {
          vscode.env.openExternal(vscode.Uri.parse(url));
        }
      } catch (e: any) {
        vscode.window.showErrorMessage(`Création Jira échouée: ${e?.message || e}`);
      }
    }
  );
}

async function createCodebeamerItem(
  manager: ConnectionManager,
  summary: string,
  description: string
): Promise<void> {
  const base = manager.getSetting('vehicleDebug.codebeamer.baseUrl').replace(/\/$/, '');
  const user = manager.getSetting('vehicleDebug.codebeamer.username');
  const projectId = manager.getSetting('vehicleDebug.codebeamer.projectId');
  const def = manager.getDefs().find((d) => d.id === 'codebeamer')!;
  const pass = await manager.getSecret(def);

  if (!base || !user || !projectId || !pass) {
    vscode.window.showWarningMessage(
      'CodeBeamer incomplet (URL, username, projectId, password). Configurez puis réessayez.'
    );
    await vscode.commands.executeCommand('workbench.action.openSettings', 'vehicleDebug.codebeamer');
    return;
  }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Création item CodeBeamer…' },
    async () => {
      try {
        const auth = Buffer.from(`${user}:${pass}`).toString('base64');
        const res = await fetch(`${base}/cb/rest/v3/items`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            name: summary,
            description,
            project: projectId.match(/^\d+$/) ? Number(projectId) : projectId
          })
        });

        if (!res.ok) {
          const t = await res.text();
          throw new Error(`HTTP ${res.status}: ${t.slice(0, 300)}`);
        }
        const data = (await res.json()) as any;
        const id = data.id || data.item?.id || '?';
        vscode.window.showInformationMessage(`Item CodeBeamer créé (id: ${id})`);
      } catch (e: any) {
        vscode.window.showErrorMessage(`Création CodeBeamer échouée: ${e?.message || e}`);
      }
    }
  );
}

function buildErrorBody(error: AnalyzedError): string {
  return [
    `*Category:* ${error.category}`,
    `*Severity:* ${error.severity}`,
    `*ASIL impact:* ${error.asilImpact || 'N/A'}`,
    `*Source:* ${error.source}`,
    `*Description:* ${error.description}`,
    `*Recommendation:* ${error.recommendation || 'N/A'}`,
    `*Timestamp:* ${error.timestamp}`,
    '',
    '{code}',
    JSON.stringify(error.evidence || {}, null, 2),
    '{code}',
    '',
    '_Créé depuis Vehicle Debugging Assistant (VS Code)_'
  ].join('\n');
}
