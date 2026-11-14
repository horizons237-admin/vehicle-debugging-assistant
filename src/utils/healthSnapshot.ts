import { getEcuSession } from './sessionStore';
import { RankedFinding, TriageRule } from './triageRules';
import { DtcItem } from '../providers/dtcTreeProvider';
import { AnalyzedError } from '../providers/errorTreeProvider';

export interface HealthSnapshot {
  version: string;
  generatedAt: string;
  vehicle: {
    vin?: string;
    vehicleId?: string;
    sessionName: string;
    mode: string;
    transport: string;
    connected: boolean;
  };
  summary: {
    totalFindings: number;
    byPriority: Record<string, number>;
    dtcCount: number;
    errorCount: number;
    topPriority: string;
  };
  findings: RankedFinding[];
  rulesApplied: number;
}

export function buildHealthSnapshot(
  dtcs: DtcItem[],
  errors: AnalyzedError[],
  ranked: RankedFinding[],
  rules: TriageRule[]
): HealthSnapshot {
  const s = getEcuSession();
  const byPriority: Record<string, number> = {};
  for (const f of ranked) {
    byPriority[f.priority] = (byPriority[f.priority] || 0) + 1;
  }
  const top = ranked[0]?.priority || 'info';
  return {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    vehicle: {
      vin: s.vin,
      vehicleId: s.vehicleId,
      sessionName: s.sessionName,
      mode: s.mode,
      transport: s.transport,
      connected: s.connected
    },
    summary: {
      totalFindings: ranked.length,
      byPriority,
      dtcCount: dtcs.length,
      errorCount: errors.length,
      topPriority: top
    },
    findings: ranked.map((f) => ({
      ...f,
      raw: undefined
    })),
    rulesApplied: rules.length
  };
}

export function snapshotToMarkdown(snap: HealthSnapshot): string {
  const lines: string[] = [];
  lines.push('# Vehicle Health Snapshot');
  lines.push('');
  lines.push(`Generated: ${snap.generatedAt}`);
  lines.push('');
  lines.push('## Vehicle');
  lines.push(`- VIN: ${snap.vehicle.vin || '—'}`);
  lines.push(`- Vehicle ID: ${snap.vehicle.vehicleId || '—'}`);
  lines.push(`- Session: ${snap.vehicle.sessionName}`);
  lines.push(`- Mode: ${snap.vehicle.mode} / ${snap.vehicle.transport}`);
  lines.push(`- Connected: ${snap.vehicle.connected}`);
  lines.push('');
  lines.push('## Summary');
  lines.push(`- Total findings: ${snap.summary.totalFindings}`);
  lines.push(`- DTCs: ${snap.summary.dtcCount} | Errors: ${snap.summary.errorCount}`);
  lines.push(`- Top priority: **${snap.summary.topPriority}**`);
  lines.push(`- By priority: ${JSON.stringify(snap.summary.byPriority)}`);
  lines.push(`- Rules applied: ${snap.rulesApplied}`);
  lines.push('');
  lines.push('## Ranked findings');
  lines.push('');
  if (!snap.findings.length) {
    lines.push('_No findings._');
  } else {
    for (const f of snap.findings) {
      lines.push(`### [${f.priority.toUpperCase()}] ${f.kind}: ${f.label}`);
      lines.push(`- Source: ${f.source}`);
      if (f.detail) lines.push(`- Detail: ${f.detail}`);
      if (f.actionHint) lines.push(`- Hint: ${f.actionHint}`);
      lines.push('');
    }
  }
  lines.push('---');
  lines.push('_Vehicle Debugging Assistant — analysis only; not an ASIL confirmation tool._');
  return lines.join('\n');
}
