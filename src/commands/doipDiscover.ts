import * as vscode from 'vscode';
import { runPythonScript } from '../utils/pythonRunner';
import { getConfig } from '../utils/config';

export async function doipDiscover(): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('vehicleDebug');
  const host = cfg.get<string>('doip.host', '192.168.0.10');
  const port = cfg.get<number>('doip.port', 13400);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'DoIP vehicle discovery…',
      cancellable: false
    },
    async () => {
      const result = await runPythonScript('doip_client.py', ['discover'], {
        timeout: 2.5,
        broadcast: '255.255.255.255',
        host,
        port
      });

      const vehicles = result.data?.vehicles || [];
      const channel = vscode.window.createOutputChannel('Vehicle Debug DoIP');
      channel.clear();
      channel.appendLine(`Mode: ${result.data?.mode || 'unknown'}`);
      channel.appendLine(`Message: ${result.data?.message || result.stderr || ''}`);
      channel.appendLine('');
      channel.appendLine(JSON.stringify(vehicles, null, 2));
      channel.show(true);

      if (!vehicles.length) {
        vscode.window.showWarningMessage('No DoIP vehicles found (and no simulation entry)');
        return;
      }

      const pick = await vscode.window.showQuickPick(
        vehicles.map((v: any) => ({
          label: v.vin || v.ip || 'Unknown',
          description: `${v.ip || '?'}:${v.port || 13400}`,
          detail: v.logicalAddress
            ? `LA ${v.logicalAddress}${v.mode ? ' · ' + v.mode : ''}`
            : v.mode || v.payloadType || '',
          vehicle: v
        })),
        { placeHolder: 'Select DoIP target (saves host/port to settings)' }
      );

      if (!pick) return;

      const v = (pick as any).vehicle;
      await cfg.update('doip.host', v.ip || host, vscode.ConfigurationTarget.Workspace);
      if (v.port) {
        await cfg.update('doip.port', Number(v.port), vscode.ConfigurationTarget.Workspace);
      }
      if (v.logicalAddress) {
        await cfg.update(
          'doip.logicalAddressEcu',
          String(v.logicalAddress),
          vscode.ConfigurationTarget.Workspace
        );
      }
      await cfg.update('transport', 'doip', vscode.ConfigurationTarget.Workspace);
      await cfg.update('doip.enabled', true, vscode.ConfigurationTarget.Workspace);

      vscode.window.showInformationMessage(
        `DoIP target set: ${v.ip || host} (transport=doip)`
      );
    }
  );
}
