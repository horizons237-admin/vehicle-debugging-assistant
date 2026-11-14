import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { AnalyzedError } from '../providers/errorTreeProvider';
import { DtcItem } from '../providers/dtcTreeProvider';

export type TriagePriority = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface TriageRule {
  id: string;
  description?: string;
  dtcPattern?: string;
  category?: string;
  severity?: string;
  source?: string;
  descriptionContains?: string;
  priority: TriagePriority;
  actionHint?: string;
}

export interface RankedFinding {
  id: string;
  kind: 'dtc' | 'error';
  label: string;
  priority: TriagePriority;
  score: number;
  source: string;
  detail?: string;
  actionHint?: string;
  raw?: DtcItem | AnalyzedError;
}

const PRIORITY_SCORE: Record<TriagePriority, number> = {
  critical: 100,
  high: 80,
  medium: 50,
  low: 20,
  info: 5
};

const DEFAULT_RULES: TriageRule[] = [
  {
    id: 'dtc-critical-severity',
    description: 'Critical severity DTCs',
    severity: 'critical',
    priority: 'critical',
    actionHint: 'Investigate immediately; safety-related fault possible'
  },
  {
    id: 'dtc-powertrain',
    dtcPattern: 'P0*',
    priority: 'high',
    actionHint: 'Powertrain — correlate with freeze frame'
  },
  {
    id: 'dtc-network',
    dtcPattern: 'U*',
    priority: 'high',
    actionHint: 'Network / bus — check communication path'
  },
  {
    id: 'error-safety',
    category: 'safety_mechanism',
    priority: 'critical',
    actionHint: 'Safety mechanism event — do not treat as cosmetic'
  },
  {
    id: 'error-timing',
    category: 'timing',
    priority: 'high',
    actionHint: 'Timing / timeout — verify P2 timing and load'
  },
  {
    id: 'error-communication',
    category: 'communication',
    priority: 'high',
    actionHint: 'Communication fault — NRC / ISO-TP path'
  },
  {
    id: 'error-major',
    severity: 'major',
    priority: 'medium',
    actionHint: 'Major finding — schedule analysis'
  },
  {
    id: 'default-minor',
    severity: 'minor',
    priority: 'low',
    actionHint: 'Minor — track in backlog'
  }
];

export function getDefaultRules(): TriageRule[] {
  return [...DEFAULT_RULES];
}

export async function loadTriageRules(): Promise<TriageRule[]> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders?.length) {
    return getDefaultRules();
  }
  const candidates = [
    path.join(folders[0].uri.fsPath, '.vehicle-debug', 'triage-rules.json'),
    path.join(folders[0].uri.fsPath, 'triage-rules.json')
  ];
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      try {
        const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
        const rules = Array.isArray(raw) ? raw : raw.rules;
        if (Array.isArray(rules) && rules.length) {
          return rules as TriageRule[];
        }
      } catch {
        /* fall through */
      }
    }
  }
  return getDefaultRules();
}

function matchPattern(value: string, pattern: string): boolean {
  const v = value.toUpperCase();
  const p = pattern.toUpperCase();
  if (p.endsWith('*')) return v.startsWith(p.slice(0, -1));
  if (p.startsWith('*')) return v.endsWith(p.slice(1));
  return v === p;
}

function matchRule(
  rule: TriageRule,
  ctx: { code?: string; category?: string; severity?: string; source?: string; description?: string }
): boolean {
  let any = false;
  if (rule.dtcPattern && ctx.code) {
    any = true;
    if (!matchPattern(ctx.code, rule.dtcPattern)) return false;
  }
  if (rule.category && ctx.category) {
    any = true;
    if (rule.category.toLowerCase() !== ctx.category.toLowerCase()) return false;
  }
  if (rule.severity && ctx.severity) {
    any = true;
    if (rule.severity.toLowerCase() !== ctx.severity.toLowerCase()) return false;
  }
  if (rule.source && ctx.source) {
    any = true;
    if (rule.source.toLowerCase() !== ctx.source.toLowerCase()) return false;
  }
  if (rule.descriptionContains && ctx.description) {
    any = true;
    if (!ctx.description.toLowerCase().includes(rule.descriptionContains.toLowerCase())) return false;
  }
  return any || (!rule.dtcPattern && !rule.category && !rule.severity && !rule.source && !rule.descriptionContains);
}

export function rankFindings(
  dtcs: DtcItem[],
  errors: AnalyzedError[],
  rules: TriageRule[]
): RankedFinding[] {
  const out: RankedFinding[] = [];

  for (const d of dtcs) {
    let best: TriageRule | undefined;
    for (const r of rules) {
      if (matchRule(r, { code: d.code, severity: d.severity, description: d.description, source: 'dtc' })) {
        if (!best || PRIORITY_SCORE[r.priority] > PRIORITY_SCORE[best.priority]) best = r;
      }
    }
    const priority = best?.priority || severityToPriority(d.severity);
    out.push({
      id: `dtc-${d.code}`,
      kind: 'dtc',
      label: `${d.code} — ${d.description || d.status}`,
      priority,
      score: PRIORITY_SCORE[priority],
      source: 'dtc',
      detail: d.freezeFrame,
      actionHint: best?.actionHint,
      raw: d
    });
  }

  for (const e of errors) {
    let best: TriageRule | undefined;
    for (const r of rules) {
      if (
        matchRule(r, {
          category: e.category,
          severity: e.severity,
          source: e.source,
          description: e.description
        })
      ) {
        if (!best || PRIORITY_SCORE[r.priority] > PRIORITY_SCORE[best.priority]) best = r;
      }
    }
    const priority = best?.priority || severityToPriority(e.severity);
    out.push({
      id: e.id,
      kind: 'error',
      label: e.description.substring(0, 100),
      priority,
      score: PRIORITY_SCORE[priority],
      source: e.source,
      detail: e.asilImpact ? `ASIL ${e.asilImpact}` : e.category,
      actionHint: best?.actionHint || e.recommendation,
      raw: e
    });
  }

  return out.sort((a, b) => b.score - a.score);
}

function severityToPriority(sev: string): TriagePriority {
  switch (sev) {
    case 'critical':
      return 'critical';
    case 'major':
      return 'high';
    case 'minor':
      return 'low';
    default:
      return 'info';
  }
}

export async function ensureSampleTriageRulesFile(): Promise<string | undefined> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders?.length) return undefined;
  const dir = path.join(folders[0].uri.fsPath, '.vehicle-debug');
  const file = path.join(dir, 'triage-rules.json');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify({ version: 1, rules: getDefaultRules() }, null, 2), 'utf8');
  }
  return file;
}
