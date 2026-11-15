import * as fs from 'fs';
import { DtcItem } from '../providers/dtcTreeProvider';
import { AnalyzedError } from '../providers/errorTreeProvider';
import { rankFindings, RankedFinding, loadTriageRules } from './triageRules';

export interface FleetVehicleRecord {
  vin: string;
  vehicleId?: string;
  dtcs?: DtcItem[];
  errors?: AnalyzedError[];
}

export interface FleetRankedVehicle {
  vin: string;
  vehicleId?: string;
  topPriority: string;
  findingCount: number;
  findings: RankedFinding[];
}

export function parseFleetFile(filePath: string): FleetVehicleRecord[] {
  const text = fs.readFileSync(filePath, 'utf8');
  if (filePath.toLowerCase().endsWith('.json')) {
    const raw = JSON.parse(text);
    const list = Array.isArray(raw) ? raw : raw.vehicles || raw.items || [];
    return list.map(normalizeRecord);
  }
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const header = lines[0].toLowerCase();
  const hasHeader = header.includes('vin');
  const rows = hasHeader ? lines.slice(1) : lines;
  const byVin = new Map<string, FleetVehicleRecord>();
  for (const row of rows) {
    const parts = row.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
    if (parts.length < 2) continue;
    const vin = parts[0].toUpperCase();
    const code = parts[1];
    const severity = (parts[2] || 'major') as DtcItem['severity'];
    const description = parts[3] || code;
    const rec =
      byVin.get(vin) ||
      ({
        vin,
        dtcs: [],
        errors: []
      } as FleetVehicleRecord);
    rec.dtcs = rec.dtcs || [];
    rec.dtcs.push({ code, status: 'Imported', description, severity });
    byVin.set(vin, rec);
  }
  return [...byVin.values()];
}

function normalizeRecord(r: any): FleetVehicleRecord {
  return {
    vin: String(r.vin || r.VIN || r.id || 'UNKNOWN').toUpperCase(),
    vehicleId: r.vehicleId,
    dtcs: Array.isArray(r.dtcs) ? r.dtcs : [],
    errors: Array.isArray(r.errors) ? r.errors : []
  };
}

export async function rankFleet(vehicles: FleetVehicleRecord[]): Promise<FleetRankedVehicle[]> {
  const rules = await loadTriageRules();
  return vehicles
    .map((v) => {
      const findings = rankFindings(v.dtcs || [], v.errors || [], rules);
      return {
        vin: v.vin,
        vehicleId: v.vehicleId,
        topPriority: findings[0]?.priority || 'info',
        findingCount: findings.length,
        findings
      };
    })
    .sort((a, b) => priorityScore(b.topPriority) - priorityScore(a.topPriority));
}

function priorityScore(p: string): number {
  const m: Record<string, number> = { critical: 100, high: 80, medium: 50, low: 20, info: 5 };
  return m[p] || 0;
}

export function fleetToMarkdown(ranked: FleetRankedVehicle[]): string {
  const lines = [
    '# Offline fleet health ranking',
    '',
    `Vehicles: ${ranked.length}`,
    '',
    '| VIN | Top priority | Findings |',
    '|-----|--------------|----------|'
  ];
  for (const v of ranked) {
    lines.push(`| ${v.vin} | ${v.topPriority} | ${v.findingCount} |`);
  }
  lines.push('', '## Details');
  for (const v of ranked) {
    lines.push(`### ${v.vin}`);
    for (const f of v.findings.slice(0, 10)) {
      lines.push(`- **${f.priority}** ${f.label}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
