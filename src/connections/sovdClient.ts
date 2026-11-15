import * as vscode from 'vscode';

export interface SovdResource {
  id: string;
  href: string;
  name: string;
  type: string;
  description?: string;
}

export interface SovdDiscoveryResult {
  mode: 'mock' | 'http';
  baseUrl: string;
  resources: SovdResource[];
  discoveredAt: string;
}

export function getSovdConfig(): { enabled: boolean; baseUrl: string; useMock: boolean } {
  const c = vscode.workspace.getConfiguration('vehicleDebug');
  return {
    enabled: c.get<boolean>('sovd.enabled', false),
    baseUrl: c.get<string>('sovd.baseUrl', 'http://127.0.0.1:8888'),
    useMock: c.get<boolean>('sovd.useMock', true)
  };
}

export async function discoverSovdResources(): Promise<SovdDiscoveryResult> {
  const cfg = getSovdConfig();
  const at = new Date().toISOString();

  if (!cfg.enabled || cfg.useMock) {
    return {
      mode: 'mock',
      baseUrl: cfg.baseUrl,
      discoveredAt: at,
      resources: [
        { id: 'areas', href: '/areas', name: 'Diagnostic Areas', type: 'collection', description: 'Top-level diagnostic areas' },
        { id: 'components', href: '/components', name: 'Components', type: 'collection', description: 'ECU / component list' },
        { id: 'faults', href: '/faults', name: 'Faults / DTCs', type: 'collection', description: 'Active and stored fault memory' },
        { id: 'data', href: '/data', name: 'Data resources', type: 'collection', description: 'Live and stored data identifiers' },
        { id: 'locks', href: '/locks', name: 'Access locks', type: 'collection', description: 'Security / session locks (read-only in VDA)' }
      ]
    };
  }

  try {
    const url = `${cfg.baseUrl.replace(/\/$/, '')}/`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as any;
    const resources: SovdResource[] = Array.isArray(data.resources)
      ? data.resources
      : Array.isArray(data)
        ? data
        : [];
    return {
      mode: 'http',
      baseUrl: cfg.baseUrl,
      discoveredAt: at,
      resources: resources.map((r: any, i: number) => ({
        id: String(r.id || r.name || i),
        href: String(r.href || r.path || `/${r.id || i}`),
        name: String(r.name || r.id || 'resource'),
        type: String(r.type || 'unknown'),
        description: r.description
      }))
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showWarningMessage(`SOVD discovery failed (${msg}) — mock resources`);
    return {
      mode: 'mock',
      baseUrl: cfg.baseUrl,
      discoveredAt: at,
      resources: [{ id: 'faults', href: '/faults', name: 'Faults', type: 'collection', description: 'Fallback mock' }]
    };
  }
}

export async function fetchSovdResource(href: string): Promise<{ mode: string; body: unknown }> {
  const cfg = getSovdConfig();
  if (!cfg.enabled || cfg.useMock) {
    return {
      mode: 'mock',
      body: {
        href,
        items: [
          { id: 'example-1', summary: 'Mock SOVD payload for lab' },
          { id: 'example-2', summary: 'Read-only diagnostic resource' }
        ]
      }
    };
  }
  const url = href.startsWith('http') ? href : `${cfg.baseUrl.replace(/\/$/, '')}${href}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { mode: 'http', body: await res.json() };
}
