import * as vscode from 'vscode';
import { createJ2534Stub, getJ2534StatusMessage } from '../utils/j2534Adapter';
import { createDpduStubReport, getDpduStatusMessage } from '../utils/dpduAdapter';
import { appendAudit } from '../utils/auditLog';

export async function showJ2534Status(): Promise<void> {
  const stub = createJ2534Stub();
  const result = await stub.openChannel({ protocol: 'ISO15765', baudRate: 500000 });
  appendAudit({ level: 'info', action: 'j2534.status', detail: result.message });
  const doc = await vscode.workspace.openTextDocument({
    content: JSON.stringify(
      {
        j2534: {
          status: stub.status,
          vendor: stub.vendor,
          openChannel: result,
          note: getJ2534StatusMessage()
        },
        dpdu: createDpduStubReport(),
        standards: ['SAE J2534', 'ISO 22900 D-PDU']
      },
      null,
      2
    ),
    language: 'json'
  });
  await vscode.window.showTextDocument(doc, { preview: true });
  vscode.window.showWarningMessage(getJ2534StatusMessage());
}

export async function showDpduStatus(): Promise<void> {
  const report = createDpduStubReport();
  appendAudit({ level: 'info', action: 'dpdu.status' });
  const doc = await vscode.workspace.openTextDocument({
    content: JSON.stringify(report, null, 2),
    language: 'json'
  });
  await vscode.window.showTextDocument(doc, { preview: true });
  vscode.window.showWarningMessage(getDpduStatusMessage());
}
