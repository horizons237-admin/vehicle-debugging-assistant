import * as vscode from 'vscode';
import { DtcTreeProvider } from '../providers/dtcTreeProvider';
import { ErrorTreeProvider } from '../providers/errorTreeProvider';
import { loadTriageRules, rankFindings } from '../utils/triageRules';
import { buildHealthSnapshot } from '../utils/healthSnapshot';
import { PARTNER_PACKS, buildPartnerPayload } from '../utils/partnerPacks';
import { assertScope, getGovernancePolicy } from '../utils/dataGovernance';
import { setLastAction } from '../utils/sessionStore';

export async function exportPartnerPack(
  dtcProvider: DtcTreeProvider,
  errorProvider: ErrorTreeProvider
): Promise<void> {
  const policy = getGovernancePolicy();
  if (!policy.allowPartnerExport) {
    vscode.window.showWarningMessage('Governance: partner export disabled');
    return;
  }
  if (!assertScope('alm', 'partner-pack-export')) return;

  const packPick = await vscode.window.showQuickPick(
    PARTNER_PACKS.map((p) => ({
      label: p.title,
      description: p.id,
      detail: p.description,
      pack: p
    })),
    { placeHolder: 'Partner data pack' }
  );
  if (!packPick) return;

  const rules = await loadTriageRules();
  const ranked = rankFindings(dtcProvider.getDtcs(), errorProvider.getErrors(), rules);
  const snap = buildHealthSnapshot(dtcProvider.getDtcs(), errorProvider.getErrors(), ranked, rules);
  const payload = buildPartnerPayload(packPick.pack, snap, ranked);

  const folder = vscode.workspace.workspaceFolders?.[0]?.uri;
  const name = `partner-${packPick.pack.id}-${Date.now()}.json`;
  const uri = folder
    ? vscode.Uri.joinPath(folder, name)
    : await vscode.window.showSaveDialog({ defaultUri: vscode.Uri.file(name) });
  if (!uri) return;

  await vscode.workspace.fs.writeFile(uri, Buffer.from(JSON.stringify(payload, null, 2), 'utf8'));
  const doc = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(doc, { preview: true });
  setLastAction(`Partner pack ${packPick.pack.id}`);
  vscode.window.showInformationMessage(
    `Partner pack "${packPick.pack.title}" exported (${(payload.findings as any[]).length} findings)`
  );
}
