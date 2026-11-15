import { HealthSnapshot } from './healthSnapshot';
import { getGovernancePolicy, redactForExport } from './dataGovernance';
import { RankedFinding } from './triageRules';

export type PartnerPackId = 'quality' | 'aftersales' | 'safety';

export interface PartnerPack {
  id: PartnerPackId;
  title: string;
  description: string;
  maxFindings: number;
  priorities: string[];
  includeFreezeFrame: boolean;
  includeRawErrors: boolean;
}

export const PARTNER_PACKS: PartnerPack[] = [
  {
    id: 'quality',
    title: 'Quality / plant',
    description: 'All ranked findings for quality engineering',
    maxFindings: 100,
    priorities: ['critical', 'high', 'medium', 'low', 'info'],
    includeFreezeFrame: true,
    includeRawErrors: true
  },
  {
    id: 'aftersales',
    title: 'Aftersales / dealer',
    description: 'Actionable high/critical only, limited context',
    maxFindings: 30,
    priorities: ['critical', 'high'],
    includeFreezeFrame: true,
    includeRawErrors: false
  },
  {
    id: 'safety',
    title: 'Safety analysis',
    description: 'Critical + safety oriented; location redacted by policy',
    maxFindings: 50,
    priorities: ['critical', 'high'],
    includeFreezeFrame: true,
    includeRawErrors: true
  }
];

export function buildPartnerPayload(
  pack: PartnerPack,
  snapshot: HealthSnapshot,
  findings: RankedFinding[]
): Record<string, unknown> {
  const filtered = findings
    .filter((f) => pack.priorities.includes(f.priority))
    .slice(0, pack.maxFindings)
    .map((f) => {
      const item: Record<string, unknown> = {
        id: f.id,
        kind: f.kind,
        priority: f.priority,
        label: f.label,
        source: f.source,
        actionHint: f.actionHint
      };
      if (pack.includeFreezeFrame && f.detail) item.detail = f.detail;
      return item;
    });

  let body: Record<string, unknown> = {
    pack: pack.id,
    title: pack.title,
    generatedAt: new Date().toISOString(),
    vehicle: {
      vin: snapshot.vehicle.vin,
      vehicleId: snapshot.vehicle.vehicleId,
      mode: snapshot.vehicle.mode
    },
    summary: {
      totalInPack: filtered.length,
      topPriority: filtered[0]?.priority || 'info',
      sourceSummary: snapshot.summary
    },
    findings: filtered
  };

  const policy = getGovernancePolicy();
  if (pack.id === 'safety' || policy.redactLocation) {
    body = redactForExport(body, { ...policy, redactLocation: true });
  }
  if (policy.redactVin) body = redactForExport(body, policy);
  return body;
}
