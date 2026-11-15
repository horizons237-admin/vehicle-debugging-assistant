export interface SnapshotLike {
  generatedAt?: string;
  findings?: Array<{ id?: string; code?: string; priority?: string; description?: string }>;
  vin?: string;
}

export interface DiffResult {
  added: string[];
  removed: string[];
  changed: string[];
  summary: string;
}

function keyOf(f: { id?: string; code?: string; description?: string }): string {
  return (f.code || f.id || f.description || '').toString();
}

export function diffHealthSnapshots(before: SnapshotLike, after: SnapshotLike): DiffResult {
  const a = new Map((before.findings || []).map((f) => [keyOf(f), f]));
  const b = new Map((after.findings || []).map((f) => [keyOf(f), f]));
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];
  for (const [k, fb] of b) {
    if (!a.has(k)) added.push(k);
    else {
      const fa = a.get(k)!;
      if ((fa.priority || '') !== (fb.priority || '') || (fa.description || '') !== (fb.description || '')) {
        changed.push(k);
      }
    }
  }
  for (const k of a.keys()) {
    if (!b.has(k)) removed.push(k);
  }
  return {
    added,
    removed,
    changed,
    summary: `+${added.length} / -${removed.length} / ~${changed.length} (before ${a.size} → after ${b.size})`
  };
}
