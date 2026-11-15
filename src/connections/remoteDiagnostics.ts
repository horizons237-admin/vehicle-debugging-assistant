import * as vscode from 'vscode';
import { getEcuSession } from '../utils/sessionStore';
import { StatusSignal, normalizeSignals, DEFAULT_STATUS_DIDS } from '../utils/statusCatalog';
import { DtcItem } from '../providers/dtcTreeProvider';

export interface RemoteDiagnosticsConfig {
  enabled: boolean;
  baseUrl: string;
  useMock: boolean;
}

export interface RemoteHealthResponse {
  vin: string;
  mode: 'mock' | 'http';
  dtcs: DtcItem[];
  signals: StatusSignal[];
  fetchedAt: string;
}

export function getRemoteDiagnosticsConfig(): RemoteDiagnosticsConfig {
  const c = vscode.workspace.getConfiguration('vehicleDebug');
  return {
    enabled: c.get<boolean>('remoteDiagnostics.enabled', false),
    baseUrl: c.get<string>('remoteDiagnostics.baseUrl', 'http://127.0.0.1:8787'),
    useMock: c.get<boolean>('remoteDiagnostics.useMock', true)
  };
}

export async function fetchRemoteVehicleHealth(vin?: string): Promise<RemoteHealthResponse> {
  const cfg = getRemoteDiagnosticsConfig();
  const session = getEcuSession();
  const v = (vin || session.vin || session.vehicleId || 'UNKNOWN').toUpperCase();

  if (!cfg.enabled || cfg.useMock || !cfg.baseUrl) {
    return mockRemoteHealth(v);
  }

  try {
    const url = `${cfg.baseUrl.replace(/\/$/, '')}/v1/vehicles/${encodeURIComponent(v)}/health`;
    const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as any;
    return {
      vin: v,
      mode: 'http',
      dtcs: (data.dtcs || []).map(mapDtc),
      signals: normalizeSignals(data.signals || []).map((s) => ({ ...s, source: 'remote' as const })),
      fetchedAt: new Date().toISOString()
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showWarningMessage(`Remote diagnostics failed (${msg}) — using mock`);
    return mockRemoteHealth(v);
  }
}

function mockRemoteHealth(vin: string): RemoteHealthResponse {
  const now = new Date().toISOString();
  return {
    vin,
    mode: 'mock',
    fetchedAt: now,
    dtcs: [
      {
        code: 'P0300',
        status: 'Confirmed',
        description: 'Random/Multiple Cylinder Misfire (cloud mock)',
        severity: 'major'
      },
      {
        code: 'U0100',
        status: 'Pending',
        description: 'Lost Communication With ECM (cloud mock)',
        severity: 'critical'
      }
    ],
    signals: DEFAULT_STATUS_DIDS.map((d) => ({
      did: d.did,
      name: d.name,
      value: mockValue(d.name),
      unit: d.unit || '',
      category: d.category,
      timestamp: now,
      source: 'mock' as const
    }))
  };
}

function mockValue(name: string): string | number {
  switch (name) {
    case 'VIN':
      return 'WVWZZZCLOUDMOCK001'.slice(0, 17);
    case 'Odometer':
      return 51200;
    case 'BatteryVoltage':
      return 12.4;
    case 'FuelLevel':
      return 45;
    case 'HVBatterySOC':
      return 68;
    case 'VehicleSpeed':
      return 0;
    case 'EngineRPM':
      return 0;
    case 'ChargeState':
      return 'NotCharging';
    case 'DoorLockState':
      return 'Locked';
    case 'IgnitionState':
      return 'Off';
    case 'CoolantTemp':
      return 25;
    case 'SoftwareVersion':
      return 'CLOUD-MOCK-1.0';
    default:
      return 'n/a';
  }
}

function mapDtc(d: any): DtcItem {
  return {
    code: String(d.code || d.id || 'P0000'),
    status: String(d.status || 'Unknown'),
    description: String(d.description || ''),
    severity: (d.severity || 'major') as DtcItem['severity'],
    freezeFrame: d.freezeFrame
  };
}
