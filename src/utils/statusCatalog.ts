/** Canonical vehicle status signal catalog (P1) — lab / simulation oriented */

export interface StatusSignalDef {
  did: string;
  name: string;
  category: 'identity' | 'energy' | 'motion' | 'thermal' | 'body' | 'other';
  unit?: string;
  description?: string;
}

export const DEFAULT_STATUS_DIDS: StatusSignalDef[] = [
  { did: '0xF190', name: 'VIN', category: 'identity' },
  { did: '0xF195', name: 'SoftwareVersion', category: 'identity' },
  { did: '0xF45C', name: 'Odometer', category: 'motion', unit: 'km' },
  { did: '0xF40D', name: 'VehicleSpeed', category: 'motion', unit: 'km/h' },
  { did: '0xF40C', name: 'EngineRPM', category: 'motion', unit: 'rpm' },
  { did: '0xF448', name: 'BatteryVoltage', category: 'energy', unit: 'V' },
  { did: '0xF45B', name: 'FuelLevel', category: 'energy', unit: '%' },
  { did: '0xF480', name: 'HVBatterySOC', category: 'energy', unit: '%' },
  { did: '0xF481', name: 'ChargeState', category: 'energy' },
  { did: '0xF45A', name: 'CoolantTemp', category: 'thermal', unit: '°C' },
  { did: '0xF446', name: 'AmbientTemp', category: 'thermal', unit: '°C' },
  { did: '0xF482', name: 'DoorLockState', category: 'body' },
  { did: '0xF483', name: 'IgnitionState', category: 'body' }
];

export interface StatusSignal {
  did: string;
  name: string;
  value: string | number | null;
  unit?: string;
  category: string;
  timestamp?: string;
  source?: 'uds' | 'remote' | 'sovd' | 'mock';
}

export function normalizeSignals(raw: any[]): StatusSignal[] {
  const now = new Date().toISOString();
  return (raw || []).map((s) => ({
    did: String(s.did || ''),
    name: String(s.name || s.did || 'unknown'),
    value: s.value ?? null,
    unit: s.unit || '',
    category: s.category || 'other',
    timestamp: s.timestamp || now,
    source: s.source || 'uds'
  }));
}
