import * as vscode from 'vscode';
import { ConnectionManager } from '../connections/connectionManager';
import { AnalyzedError } from '../providers/errorTreeProvider';
import { DtcItem } from '../providers/dtcTreeProvider';

type ConfEnv = 'vwif' | 'devstack';

export async function exportReportToConfluence(
  manager: ConnectionManager,
  errors: AnalyzedError[],
  dtcs: DtcItem[],
  aiSummary?: string
): Promise<void> {
  const envPick = await vscode.window.showQuickPick(
    [
      { label: 'Confluence VWIF', env: 'vwif' as ConfEnv },
      { label: 'Confluence DevStack', env: 'devstack' as ConfEnv }
    ],
    { placeHolder: 'Publier le rapport vers…' }
  );
  if (!envPick) return;

  const env = envPick.env;
  const base = manager.getSetting(`vehicleDebug.confluence.${env}.baseUrl`).replace(/\/$/, '');
  const spaceKey = manager.getSetting(`vehicleDebug.confluence.${env}.spaceKey`);
  const def = manager.getDefs().find((d) => d.id === `confluence-${env}`)!;
  const token = await manager.getSecret(def);

  if (!base || !spaceKey) {
    vscode.window.showWarningMessage(
      `Confluence ${env}: URL ou spaceKey manquant. Ouvrez les settings.`
    );
    await vscode.commands.executeCommand(
      'workbench.action.openSettings',
      `vehicleDebug.confluence.${env}`
    );
    return;
  }
  if (!token) {
    vscode.window.showWarningMessage(
      `Token Confluence ${env} manquant – utilisez "Set Connection Token / Password".`
    );
    return;
  }

  const titleDefault = `Vehicle Debug Report – ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`;
  const title =
    (await vscode.window.showInputBox({
      prompt: 'Titre de la page Confluence',
      value: titleDefault,
      ignoreFocusOut: true
    })) || titleDefault;

  const storage = await vscode.window.showQuickPick(
    [
      { label: 'Storage Format (Confluence Cloud / moderne)', id: 'storage' },
      { label: 'Wiki Markup (Server / Data Center legacy)', id: 'wiki' }
    ],
    { placeHolder: 'Format du corps de page' }
  );
  if (!storage) return;

  const body =
    storage.id === 'wiki'
      ? buildWikiBody(errors, dtcs, aiSummary)
      : buildStorageBody(errors, dtcs, aiSummary);

  const representation = storage.id === 'wiki' ? 'wiki' : 'storage';

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Publication Confluence ${env}…`,
      cancellable: false
    },
    async () => {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        };

        const payload = {
          type: 'page',
          title,
          space: { key: spaceKey },
          body: {
            storage: {
              value: body,
              representation
            }
          }
        };

        let res = await fetch(`${base}/rest/api/content`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        if (res.status === 401) {
          headers['Authorization'] = `Basic ${Buffer.from(`:${token}`).toString('base64')}`;
          res = await fetch(`${base}/rest/api/content`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
          });
        }

        if (!res.ok) {
          const t = await res.text();
          throw new Error(`HTTP ${res.status}: ${t.slice(0, 400)}`);
        }

        const data = (await res.json()) as any;
        const pageId = data.id;
        const links = data._links || {};
        const webui = links.webui || `/pages/viewpage.action?pageId=${pageId}`;
        const baseWeb = links.base || base;
        const url = webui.startsWith('http') ? webui : `${baseWeb}${webui}`;

        const open = await vscode.window.showInformationMessage(
          `Page Confluence créée (id: ${pageId})`,
          'Ouvrir'
        );
        if (open === 'Ouvrir') {
          vscode.env.openExternal(vscode.Uri.parse(url));
        }
      } catch (e: any) {
        vscode.window.showErrorMessage(`Export Confluence échoué: ${e?.message || e}`);
      }
    }
  );
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildStorageBody(
  errors: AnalyzedError[],
  dtcs: DtcItem[],
  aiSummary?: string
): string {
  const errRows = errors
    .map(
      (e) =>
        `<tr><td>${escapeXml(e.category)}</td><td>${escapeXml(e.severity)}</td><td>${escapeXml(
          e.asilImpact || '—'
        )}</td><td>${escapeXml(e.source)}</td><td>${escapeXml(e.description)}</td></tr>`
    )
    .join('');

  const dtcRows = dtcs
    .map(
      (d) =>
        `<tr><td>${escapeXml(d.code)}</td><td>${escapeXml(d.status)}</td><td>${escapeXml(
          d.severity
        )}</td><td>${escapeXml(d.description)}</td><td>${escapeXml(
          d.freezeFrame || '—'
        )}</td></tr>`
    )
    .join('');

  const aiBlock = aiSummary
    ? `<h2>Analyse IA</h2><ac:structured-macro ac:name="code"><ac:plain-text-body><![CDATA[${aiSummary.slice(
        0,
        15000
      )}]]></ac:plain-text-body></ac:structured-macro>`
    : '';

  return `
<h1>Vehicle Debugging Assistant – Analysis Report</h1>
<p><em>Generated: ${escapeXml(new Date().toLocaleString())}</em></p>
<p>
  <strong>${errors.length}</strong> errors ·
  <strong>${dtcs.length}</strong> DTCs ·
  Critical: <strong>${errors.filter((e) => e.severity === 'critical').length}</strong>
</p>
${aiBlock}
<h2>Classified Errors</h2>
<table>
  <tbody>
    <tr><th>Category</th><th>Severity</th><th>ASIL</th><th>Source</th><th>Description</th></tr>
    ${errRows || '<tr><td colspan="5">None</td></tr>'}
  </tbody>
</table>
<h2>Diagnostic Trouble Codes</h2>
<table>
  <tbody>
    <tr><th>Code</th><th>Status</th><th>Severity</th><th>Description</th><th>Freeze Frame</th></tr>
    ${dtcRows || '<tr><td colspan="5">None</td></tr>'}
  </tbody>
</table>
<p><em>Exported from Vehicle Debugging Assistant (VS Code)</em></p>
`.trim();
}

function buildWikiBody(errors: AnalyzedError[], dtcs: DtcItem[], aiSummary?: string): string {
  const lines: string[] = [
    'h1. Vehicle Debugging Assistant – Analysis Report',
    `Generated: ${new Date().toLocaleString()}`,
    '',
    `*Errors:* ${errors.length} | *DTCs:* ${dtcs.length} | *Critical:* ${
      errors.filter((e) => e.severity === 'critical').length
    }`,
    ''
  ];

  if (aiSummary) {
    lines.push('h2. Analyse IA', '{code}', aiSummary.slice(0, 15000), '{code}', '');
  }

  lines.push('h2. Classified Errors', '||Category||Severity||ASIL||Source||Description||');
  for (const e of errors) {
    lines.push(
      `|${e.category}|${e.severity}|${e.asilImpact || '—'}|${e.source}|${e.description.replace(
        /\|/g,
        '/'
      )}|`
    );
  }
  if (errors.length === 0) lines.push('|None| | | | |');

  lines.push('', 'h2. DTCs', '||Code||Status||Severity||Description||Freeze Frame||');
  for (const d of dtcs) {
    lines.push(
      `|${d.code}|${d.status}|${d.severity}|${d.description.replace(/\|/g, '/')}|${
        d.freezeFrame || '—'
      }|`
    );
  }
  if (dtcs.length === 0) lines.push('|None| | | | |');

  lines.push('', '_Exported from Vehicle Debugging Assistant (VS Code)_');
  return lines.join('\n');
}
