import { getEcuSession } from './sessionStore';
import { DtcItem } from '../providers/dtcTreeProvider';
import { AnalyzedError } from '../providers/errorTreeProvider';
import { StatusSignal } from './statusCatalog';
import { getGovernancePolicy, redactForExport } from './dataGovernance';

export interface IncidentPack {
  version: string;
  kind: 'lab-incident-pack';
  generatedAt: string;
  disclaimer: string;
  vehicle: {
    vin?: string;
    vehicleId?: string;
    mode: string;
    transport: string;
  };
  location: {
    simulated: boolean;
    label: string;
    lat?: number;
    lon?: number;
  };
  status: StatusSignal[];
  dtcs: DtcItem[];
  errors: AnalyzedError[];
  narrative?: string;
}

export function buildIncidentPack(
  dtcs: DtcItem[],
  errors: AnalyzedError[],
  signals: StatusSignal[],
  options?: { narrative?: string; simulatedLocationLabel?: string }
): IncidentPack {
  const s = getEcuSession();
  const pack: IncidentPack = {
    version: '1.0',
    kind: 'lab-incident-pack',
    generatedAt: new Date().toISOString(),
    disclaimer:
      'Lab/dev incident pack only. Not an eCall/bCall. No remote immobilization or vehicle control.',
    vehicle: {
      vin: s.vin,
      vehicleId: s.vehicleId,
      mode: s.mode,
      transport: s.transport
    },
    location: {
      simulated: true,
      label: options?.simulatedLocationLabel || 'LAB-SIMULATED-POSITION',
      lat: 48.137154,
      lon: 11.576124
    },
    status: signals.slice(0, 30),
    dtcs: dtcs.slice(0, 50),
    errors: errors.slice(0, 50),
    narrative: options?.narrative
  };

  const policy = getGovernancePolicy();
  if (policy.redactLocation || policy.redactVin) {
    return redactForExport(pack as unknown as Record<string, unknown>, policy) as unknown as IncidentPack;
  }
  return pack;
}

export function incidentPackToMarkdown(pack: IncidentPack): string {
  const lines = [
    '# Lab incident pack',
    '',
    pack.disclaimer,
    '',
    `Generated: ${pack.generatedAt}`,
    `VIN: ${pack.vehicle.vin || pack.vehicle.vehicleId || '—'}`,
    `Mode: ${pack.vehicle.mode} / ${pack.vehicle.transport}`,
    `Location: ${pack.location.label}${pack.location.simulated ? ' (simulated)' : ''}`,
    ''
  ];
  if (pack.narrative) {
    lines.push('## Narrative', pack.narrative, '');
  }
  lines.push('## DTCs');
  if (!pack.dtcs.length) lines.push('_None_');
  else for (const d of pack.dtcs) lines.push(`- ${d.code}: ${d.description} (${d.severity})`);
  lines.push('', '## Errors');
  if (!pack.errors.length) lines.push('_None_');
  else for (const e of pack.errors) lines.push(`- [${e.severity}] ${e.description}`);
  lines.push('', '## Status (excerpt)');
  for (const s of pack.status.slice(0, 15)) {
    lines.push(`- ${s.name}: ${s.value ?? '—'}${s.unit ? ' ' + s.unit : ''}`);
  }
  return lines.join('\n');
}
