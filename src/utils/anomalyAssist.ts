import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { DtcItem } from '../providers/dtcTreeProvider';
import { AnalyzedError } from '../providers/errorTreeProvider';

export interface BaselineEntry {
  key: string;
  kind: 'dtc' | 'error';
  count: number;
  lastSeen: string;
}

export interface AnomalyFlag {
  key: string;
  kind: 'dtc' | 'error';
  reason: 'novel' | 'rare' | 'frequency_spike';
  detail: string;
  label: string;
}

const BASELINE_FILE = '.vehicle-debug/anomaly-baseline.json';

function workspaceRoot(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

function baselinePath(): string | undefined {
  const root = workspaceRoot();
  return root ? path.join(root, BASELINE_FILE) : undefined;
}

export function loadBaseline(): BaselineEntry[] {
  const p = baselinePath();
  if (!p || !fs.existsSync(p)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    return Array.isArray(raw.entries) ? raw.entries : Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function saveBaseline(entries: BaselineEntry[]): void {
  const p = baselinePath();
  if (!p) throw new Error('Open a workspace folder to store anomaly baseline');
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    p,
    JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), entries }, null, 2),
    'utf8'
  );
}

function dtcKey(d: DtcItem): string {
  return `dtc:${d.code.toUpperCase()}`;
}

function errorKey(e: AnalyzedError): string {
  return `error:${e.category || 'unknown'}:${e.severity || 'minor'}`;
}

export function updateBaselineFromSession(dtcs: DtcItem[], errors: AnalyzedError[]): BaselineEntry[] {
  const map = new Map<string, BaselineEntry>();
  for (const e of loadBaseline()) map.set(e.key, { ...e });
  const now = new Date().toISOString();
  for (const d of dtcs) {
    const k = dtcKey(d);
    const prev = map.get(k);
    map.set(k, { key: k, kind: 'dtc', count: (prev?.count || 0) + 1, lastSeen: now });
  }
  for (const e of errors) {
    const k = errorKey(e);
    const prev = map.get(k);
    map.set(k, { key: k, kind: 'error', count: (prev?.count || 0) + 1, lastSeen: now });
  }
  const entries = [...map.values()].sort((a, b) => b.count - a.count);
  saveBaseline(entries);
  return entries;
}

export function detectAnomalies(dtcs: DtcItem[], errors: AnalyzedError[]): AnomalyFlag[] {
  const baseline = loadBaseline();
  const byKey = new Map(baseline.map((b) => [b.key, b]));
  const total = baseline.reduce((s, b) => s + b.count, 0) || 1;
  const flags: AnomalyFlag[] = [];

  for (const d of dtcs) {
    const k = dtcKey(d);
    const b = byKey.get(k);
    if (!b) {
      flags.push({
        key: k,
        kind: 'dtc',
        reason: 'novel',
        label: d.code,
        detail: `DTC ${d.code} never seen in local baseline`
      });
    } else if (b.count <= 2 && total > 10) {
      flags.push({
        key: k,
        kind: 'dtc',
        reason: 'rare',
        label: d.code,
        detail: `DTC ${d.code} rare in baseline (count=${b.count})`
      });
    }
  }

  for (const e of errors) {
    const k = errorKey(e);
    const b = byKey.get(k);
    if (!b) {
      flags.push({
        key: k,
        kind: 'error',
        reason: 'novel',
        label: e.category,
        detail: `Error pattern ${k} novel vs baseline`
      });
    } else if (b.count <= 2 && total > 10) {
      flags.push({
        key: k,
        kind: 'error',
        reason: 'rare',
        label: e.category,
        detail: `Error pattern rare (count=${b.count})`
      });
    }
  }
  return flags;
}

export function anomaliesToMarkdown(flags: AnomalyFlag[]): string {
  const lines = [
    '# Anomaly assist (local baseline)',
    '',
    `_Heuristic only — not a certified ML / ASIL tool. Flags: ${flags.length}_`,
    ''
  ];
  if (!flags.length) lines.push('No novel/rare patterns vs current baseline.');
  else {
    for (const f of flags) {
      lines.push(`- **[${f.reason}]** ${f.kind} \`${f.label}\`: ${f.detail}`);
    }
  }
  lines.push('', 'Baseline file: `.vehicle-debug/anomaly-baseline.json`');
  return lines.join('\n');
}
