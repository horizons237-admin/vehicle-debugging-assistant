import * as vscode from 'vscode';
import { runPythonScript } from '../utils/pythonRunner';
import { DtcTreeProvider, DtcItem } from '../providers/dtcTreeProvider';
import { ErrorTreeProvider, AnalyzedError } from '../providers/errorTreeProvider';
import { getConnectionState } from './connectEcu';
import { getConfig } from '../utils/config';

export async function readDtcs(
  dtcProvider: DtcTreeProvider,
  errorProvider: ErrorTreeProvider
): Promise<void> {
  if (!getConnectionState()) {
    vscode.window.showWarningMessage('Not connected to ECU. Connect first.');
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Reading DTCs...',
      cancellable: false
    },
    async () => {
      const result = await runPythonScript('uds_client.py', ['read_dtcs']);

      let dtcs: DtcItem[] = [];

      if (result.success && result.data?.dtcs) {
        dtcs = result.data.dtcs;
      } else {
        dtcs = getSimulatedDtcs();
        vscode.window.showInformationMessage('Using simulated DTCs (no real ECU response)');
      }

      dtcProvider.setDtcs(dtcs);

      const config = getConfig();
      const errors: AnalyzedError[] = dtcs
        .filter((d) => d.severity === 'critical' || d.severity === 'major')
        .map((d, idx) => ({
          id: `dtc-${d.code}-${idx}`,
          category: 'safety_mechanism' as const,
          severity: d.severity as 'critical' | 'major',
          asilImpact: config.enableSafetyClassification ? guessAsil(d.code) : undefined,
          source: 'uds',
          description: `DTC ${d.code}: ${d.description} (status: ${d.status})`,
          evidence: { dtc: d },
          recommendation: d.severity === 'critical'
            ? 'Investigate immediately – possible safety impact'
            : 'Schedule analysis and root-cause',
          timestamp: new Date().toISOString()
        }));

      if (errors.length > 0) {
        errorProvider.setErrors([...errors, ...errorProvider.getErrors()]);
      }

      vscode.window.showInformationMessage(`Found ${dtcs.length} DTC(s)`);
    }
  );
}

function getSimulatedDtcs(): DtcItem[] {
  return [
    {
      code: 'P0301',
      status: 'Confirmed',
      description: 'Cylinder 1 Misfire Detected',
      severity: 'major',
      freezeFrame: 'RPM=2100, Load=34%, Coolant=92C'
    },
    {
      code: 'U0100',
      status: 'Pending',
      description: 'Lost Communication with ECM/PCM',
      severity: 'critical',
      freezeFrame: 'Bus-off count=3'
    },
    {
      code: 'C0035',
      status: 'Confirmed',
      description: 'Left Front Wheel Speed Sensor Circuit',
      severity: 'major',
      freezeFrame: 'Speed LF=0 km/h while others > 20'
    },
    {
      code: 'B1234',
      status: 'History',
      description: 'Battery Voltage Low',
      severity: 'minor',
      freezeFrame: 'Vbat=11.2 V'
    },
    {
      code: 'P0420',
      status: 'Confirmed',
      description: 'Catalyst System Efficiency Below Threshold (Bank 1)',
      severity: 'major',
      freezeFrame: 'O2 sensor delta below threshold'
    }
  ];
}

function guessAsil(code: string): string {
  if (code.startsWith('U') || code.startsWith('C')) {
    return 'B';
  }
  if (code.startsWith('P03') || code.startsWith('P06')) {
    return 'A';
  }
  return 'QM';
}
