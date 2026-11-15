import * as vscode from 'vscode';
import { DtcTreeProvider } from '../providers/dtcTreeProvider';
import { ErrorTreeProvider } from '../providers/errorTreeProvider';
import { StatusTreeProvider } from '../providers/statusTreeProvider';
import { buildSessionTimeline, timelineToMarkdown } from '../utils/timeline';
import { getEcuSession, setLastAction } from '../utils/sessionStore';

export async function showSessionTimeline(
  dtcProvider: DtcTreeProvider,
  errorProvider: ErrorTreeProvider,
  statusProvider: StatusTreeProvider
): Promise<void> {
  const s = getEcuSession();
  const sessionEvents: { timestamp: string; label: string }[] = [];
  if (s.connectedAt) {
    sessionEvents.push({ timestamp: s.connectedAt, label: `Connected (${s.mode}/${s.transport})` });
  }
  if (s.lastAction && s.lastAction !== '—') {
    sessionEvents.push({ timestamp: new Date().toISOString(), label: s.lastAction });
  }

  const events = buildSessionTimeline(
    dtcProvider.getDtcs(),
    errorProvider.getErrors(),
    statusProvider.getSignals(),
    sessionEvents
  );

  const md = timelineToMarkdown(events, s.vin || s.vehicleId);
  const doc = await vscode.workspace.openTextDocument({ content: md, language: 'markdown' });
  await vscode.window.showTextDocument(doc, { preview: true });
  setLastAction(`Timeline (${events.length} events)`);
}
