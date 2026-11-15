import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { DtcItem } from '../providers/dtcTreeProvider';
import { AnalyzedError } from '../providers/errorTreeProvider';
import { StatusSignal } from './statusCatalog';

export interface OtaCampaign {
  id: string;
  name: string;
  targetSoftwareVersion?: string;
  previousSoftwareVersion?: string;
  releasedAt?: string;
  notes?: string;
  relatedDtcPatterns?: string[];
  relatedKeywords?: string[];
}

export interface OtaCorrelationHit {
  campaignId: string;
  campaignName: string;
  findingLabel: string;
  reason: string;
}

function workspaceRoot(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

export function loadOtaCampaigns(): OtaCampaign[] {
  const root = workspaceRoot();
  const candidates = root
    ? [
        path.join(root, '.vehicle-debug', 'ota-campaigns.json'),
        path.join(root, 'ota-campaigns.json')
      ]
    : [];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
        const list = Array.isArray(raw) ? raw : raw.campaigns || [];
        return list as OtaCampaign[];
      } catch {
        /* continue */
      }
    }
  }
  return defaultCampaigns();
}

function defaultCampaigns(): OtaCampaign[] {
  return [
    {
      id: 'ota-demo-2026-01',
      name: 'Demo OTA — ECM calibration patch',
      targetSoftwareVersion: 'SW-2.4.1-ASILB',
      previousSoftwareVersion: 'SW-2.3.0',
      releasedAt: '2026-01-15',
      notes: 'Addresses intermittent misfire under cold start (lab sample).',
      relatedDtcPatterns: ['P030*', 'P0420'],
      relatedKeywords: ['misfire', 'catalyst', 'calibration']
    },
    {
      id: 'ota-demo-gateway',
      name: 'Demo OTA — Gateway network stack',
      targetSoftwareVersion: 'GW-1.2.0',
      relatedDtcPatterns: ['U0*'],
      relatedKeywords: ['communication', 'timeout', 'network']
    }
  ];
}

export function ensureSampleOtaCampaignsFile(): string | undefined {
  const root = workspaceRoot();
  if (!root) return undefined;
  const dir = path.join(root, '.vehicle-debug');
  const file = path.join(dir, 'ota-campaigns.json');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(file)) {
    fs.writeFileSync(
      file,
      JSON.stringify({ version: 1, campaigns: defaultCampaigns() }, null, 2),
      'utf8'
    );
  }
  return file;
}

function matchPattern(code: string, pattern: string): boolean {
  const c = code.toUpperCase();
  const p = pattern.toUpperCase();
  if (p.endsWith('*')) return c.startsWith(p.slice(0, -1));
  return c === p;
}

export function correlateWithOta(
  dtcs: DtcItem[],
  errors: AnalyzedError[],
  signals: StatusSignal[],
  campaigns?: OtaCampaign[]
): { softwareVersion?: string; hits: OtaCorrelationHit[] } {
  const camps = campaigns || loadOtaCampaigns();
  const sw =
    signals.find((s) => /software/i.test(s.name) || s.did.toUpperCase() === '0xF195')?.value?.toString() ||
    undefined;

  const hits: OtaCorrelationHit[] = [];

  for (const camp of camps) {
    if (sw && camp.targetSoftwareVersion && sw.includes(camp.targetSoftwareVersion)) {
      hits.push({
        campaignId: camp.id,
        campaignName: camp.name,
        findingLabel: `SW ${sw}`,
        reason: `Running target version of campaign ${camp.id}`
      });
    }
    for (const d of dtcs) {
      for (const pat of camp.relatedDtcPatterns || []) {
        if (matchPattern(d.code, pat)) {
          hits.push({
            campaignId: camp.id,
            campaignName: camp.name,
            findingLabel: d.code,
            reason: `DTC matches pattern ${pat}`
          });
        }
      }
    }
    for (const e of errors) {
      const text = `${e.description} ${e.category}`.toLowerCase();
      for (const kw of camp.relatedKeywords || []) {
        if (text.includes(kw.toLowerCase())) {
          hits.push({
            campaignId: camp.id,
            campaignName: camp.name,
            findingLabel: e.description.substring(0, 80),
            reason: `Keyword "${kw}" in error`
          });
        }
      }
    }
  }

  const seen = new Set<string>();
  const unique = hits.filter((h) => {
    const k = `${h.campaignId}|${h.findingLabel}|${h.reason}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return { softwareVersion: sw, hits: unique };
}

export function otaCorrelationToMarkdown(
  softwareVersion: string | undefined,
  hits: OtaCorrelationHit[],
  campaigns: OtaCampaign[]
): string {
  const lines = [
    '# OTA campaign correlation',
    '',
    `_Analysis only — does not trigger or verify OTA installs._`,
    '',
    `Software version (from status): **${softwareVersion || '—'}**`,
    `Campaigns loaded: ${campaigns.length}`,
    `Hits: ${hits.length}`,
    ''
  ];
  if (!hits.length) {
    lines.push('No correlation between current findings and known campaigns.');
  } else {
    lines.push('| Campaign | Finding | Reason |', '|----------|---------|--------|');
    for (const h of hits) {
      lines.push(`| ${h.campaignName} | ${h.findingLabel.replace(/\|/g, '/')} | ${h.reason} |`);
    }
  }
  lines.push('', '## Campaigns');
  for (const c of campaigns) {
    lines.push(`### ${c.name} (\`${c.id}\`)`);
    if (c.targetSoftwareVersion) lines.push(`- Target SW: ${c.targetSoftwareVersion}`);
    if (c.notes) lines.push(`- Notes: ${c.notes}`);
    lines.push('');
  }
  return lines.join('\n');
}
