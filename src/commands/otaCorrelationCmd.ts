import * as vscode from 'vscode';
import { DtcTreeProvider } from '../providers/dtcTreeProvider';
import { ErrorTreeProvider } from '../providers/errorTreeProvider';
import { StatusTreeProvider } from '../providers/statusTreeProvider';
import {
  correlateWithOta,
  loadOtaCampaigns,
  otaCorrelationToMarkdown,
  ensureSampleOtaCampaignsFile
} from '../utils/otaCorrelation';
import { setLastAction } from '../utils/sessionStore';
import { assertScope } from '../utils/dataGovernance';

export async function runOtaCorrelation(
  dtcProvider: DtcTreeProvider,
  errorProvider: ErrorTreeProvider,
  statusProvider: StatusTreeProvider
): Promise<void> {
  if (!assertScope('local-only', 'ota-correlation')) return;

  ensureSampleOtaCampaignsFile();
  const campaigns = loadOtaCampaigns();
  const { softwareVersion, hits } = correlateWithOta(
    dtcProvider.getDtcs(),
    errorProvider.getErrors(),
    statusProvider.getSignals(),
    campaigns
  );
  const md = otaCorrelationToMarkdown(softwareVersion, hits, campaigns);
  const doc = await vscode.workspace.openTextDocument({ content: md, language: 'markdown' });
  await vscode.window.showTextDocument(doc, { preview: true });
  setLastAction(`OTA correlation (${hits.length} hits)`);
  vscode.window.showInformationMessage(
    `OTA correlation: ${hits.length} hit(s), SW=${softwareVersion || 'n/a'}`
  );
}

export async function openOtaCampaignsFile(): Promise<void> {
  const file = ensureSampleOtaCampaignsFile();
  if (!file) {
    vscode.window.showWarningMessage('Open a workspace folder to store ota-campaigns.json');
    return;
  }
  const doc = await vscode.workspace.openTextDocument(file);
  await vscode.window.showTextDocument(doc);
}
