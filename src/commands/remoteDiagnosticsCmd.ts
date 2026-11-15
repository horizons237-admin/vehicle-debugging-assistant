import * as vscode from 'vscode';
import { fetchRemoteVehicleHealth } from '../connections/remoteDiagnostics';
import { DtcTreeProvider } from '../providers/dtcTreeProvider';
import { StatusTreeProvider } from '../providers/statusTreeProvider';
import { ErrorTreeProvider } from '../providers/errorTreeProvider';
import { setLastAction, setVehicleIdentity } from '../utils/sessionStore';
import { HealthTreeProvider } from '../providers/healthTreeProvider';

export async function pullRemoteDiagnostics(
  dtcProvider: DtcTreeProvider,
  statusProvider: StatusTreeProvider,
  errorProvider: ErrorTreeProvider,
  healthProvider?: HealthTreeProvider
): Promise<void> {
  const health = await fetchRemoteVehicleHealth();
  dtcProvider.setDtcs([
    ...health.dtcs,
    ...dtcProvider.getDtcs().filter((d) => !health.dtcs.some((x) => x.code === d.code))
  ]);
  statusProvider.setSignals(health.signals);
  if (health.vin && health.vin !== 'UNKNOWN') {
    if (health.vin.length === 17) {
      setVehicleIdentity({ vin: health.vin });
    } else {
      setVehicleIdentity({ vehicleId: health.vin });
    }
  }
  setLastAction(`Remote diagnostics (${health.mode})`);
  healthProvider?.refresh();
  vscode.window.showInformationMessage(
    `Remote health [${health.mode}]: ${health.dtcs.length} DTC(s), ${health.signals.length} signal(s) for ${health.vin}`
  );
}
