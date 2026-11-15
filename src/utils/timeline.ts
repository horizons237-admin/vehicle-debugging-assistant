import { DtcItem } from '../providers/dtcTreeProvider';
import { AnalyzedError } from '../providers/errorTreeProvider';
import { StatusSignal } from './statusCatalog';

export type TimelineKind = 'dtc' | 'error' | 'status' | 'session';

export interface TimelineEvent {
  id: string;
  kind: TimelineKind;
  timestamp: string;
  label: string;
  detail?: string;
  severity?: string;
}

export function buildSessionTimeline(
  dtcs: DtcItem[],
  errors: AnalyzedError[],
  signals: StatusSignal[],
  sessionEvents: { timestamp: string; label: string }[] = []
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const e of sessionEvents) {
    events.push({
      id: `session-${e.timestamp}-${e.label}`,
      kind: 'session',
      timestamp: e.timestamp,
      label: e.label
    });
  }

  for (const d of dtcs) {
    events.push({
      id: `dtc-${d.code}`,
      kind: 'dtc',
      timestamp: new Date().toISOString(),
      label: `${d.code}: ${d.description || d.status}`,
      detail: d.freezeFrame,
      severity: d.severity
    });
  }

  for (const err of errors) {
    events.push({
      id: err.id,
      kind: 'error',
      timestamp: err.timestamp || new Date().toISOString(),
      label: err.description.substring(0, 120),
      detail: err.category,
      severity: err.severity
    });
  }

  for (const s of signals) {
    if (s.value == null) continue;
    events.push({
      id: `sig-${s.did}`,
      kind: 'status',
      timestamp: s.timestamp || new Date().toISOString(),
      label: `${s.name}=${s.value}${s.unit ? s.unit : ''}`,
      detail: s.did
    });
  }

  return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function timelineToMarkdown(events: TimelineEvent[], vin?: string): string {
  const lines = [
    '# Session Timeline',
    '',
    `VIN: ${vin || '—'}`,
    `Events: ${events.length}`,
    '',
    '| Time | Kind | Label |',
    '|------|------|-------|'
  ];
  for (const e of events) {
    const t = e.timestamp.replace('T', ' ').replace(/\.\d+Z?$/, 'Z');
    lines.push(`| ${t} | ${e.kind} | ${e.label.replace(/\|/g, '/')} |`);
  }
  lines.push('');
  lines.push('_Correlation is session-local; not a formal temporal proof._');
  return lines.join('\n');
}
