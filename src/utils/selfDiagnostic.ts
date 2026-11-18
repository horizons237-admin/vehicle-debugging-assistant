import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { runPythonScript } from './pythonRunner';
import { getEcuSession } from './sessionStore';
import { getActiveEcu, listEcus } from './ecuRegistry';
import { getConfig } from './config';

export type DiagStatus = 'ok' | 'warn' | 'error' | 'info' | 'skip';
export interface DiagItem {
  id: string;
  group: string;
  label: string;
  status: DiagStatus;
  detail: string;
  hint?: string;
}
export interface DiagReport {
  generatedAt: string;
  overall: DiagStatus;
  items: DiagItem[];
  summary: string;
}

function extRoot(): string {
  return (
    vscode.extensions.getExtension('vehicle-debug.vehicle-debugging-assistant')?.extensionPath ||
    path.join(__dirname, '..', '..')
  );
}

function scriptExists(name: string): boolean {
  const root = extRoot();
  return [path.join(root, 'src', 'python', name), path.join(root, 'python', name)].some((p) =>
    fs.existsSync(p)
  );
}

async function probePython(
  script: string,
  args: string[],
  input?: object,
  timeoutMs = 8000
): Promise<{ ok: boolean; detail: string; data?: any }> {
  try {
    const r = await runPythonScript(script, args, input, timeoutMs);
    const data = r.data as any;
    if (r.timedOut) return { ok: false, detail: 'timeout', data };
    if (data && (data.status === 'ok' || data.status === 'connected' || data.mode || data.status === 'unsupported_os')) {
      return { ok: true, detail: `mode=${data.mode || data.status}`, data };
    }
    if (r.success) return { ok: true, detail: 'exit 0', data };
    return { ok: false, detail: (r.stderr || 'failed').slice(0, 120), data };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
}

function worst(a: DiagStatus, b: DiagStatus): DiagStatus {
  const order: DiagStatus[] = ['ok', 'info', 'skip', 'warn', 'error'];
  return order.indexOf(a) >= order.indexOf(b) ? a : b;
}

export async function runSelfDiagnostic(options?: { deep?: boolean }): Promise<DiagReport> {
  const deep = options?.deep !== false;
  const items: DiagItem[] = [];
  const cfg = getConfig();
  const ws = vscode.workspace.getConfiguration('vehicleDebug');

  items.push({ id: 'vscode', group: 'Runtime', label: 'VS Code host', status: 'ok', detail: `v${vscode.version}` });
  items.push({ id: 'python.path', group: 'Runtime', label: 'Python path', status: 'info', detail: String(cfg.pythonPath || 'python3') });

  for (const s of [
    'uds_client.py',
    'obd_client.py',
    'doip_client.py',
    'log_analyzer.py',
    'arxml_analyzer.py',
    'dbc_parser.py',
    'check_deps.py',
    'j2534_probe.py'
  ]) {
    const ok = scriptExists(s);
    items.push({
      id: `script.${s}`,
      group: 'Backends',
      label: s,
      status: ok ? 'ok' : 'error',
      detail: ok ? 'present' : 'missing'
    });
  }

  if (deep) {
    const uds = await probePython('uds_client.py', ['connect'], {
      forceSimulation: true,
      transport: 'simulation'
    });
    items.push({
      id: 'probe.uds',
      group: 'Probes',
      label: 'UDS connect (sim)',
      status: uds.ok ? 'ok' : 'error',
      detail: uds.detail
    });
    const obd = await probePython('obd_client.py', ['connect'], { forceSimulation: true });
    items.push({
      id: 'probe.obd',
      group: 'Probes',
      label: 'OBD-II connect (sim)',
      status: obd.ok ? 'ok' : 'error',
      detail: obd.detail
    });
    const doip = await probePython(
      'doip_client.py',
      ['status'],
      { host: '127.0.0.1', port: 13400, timeout: 0.3 },
      5000
    );
    items.push({
      id: 'probe.doip',
      group: 'Probes',
      label: 'DoIP status',
      status: doip.ok || doip.data ? 'ok' : 'warn',
      detail: doip.detail || 'lab'
    });
    const dbcSample = path.join(extRoot(), 'resources', 'sample.dbc');
    if (fs.existsSync(dbcSample)) {
      const dbc = await probePython('dbc_parser.py', ['parse'], { path: dbcSample });
      items.push({
        id: 'probe.dbc',
        group: 'Probes',
        label: 'DBC parser',
        status: dbc.ok ? 'ok' : 'warn',
        detail: dbc.detail
      });
    }

    // J2534 registry discovery (Windows); skip/info on other OS
    const j2534 = await probePython('j2534_probe.py', ['discover'], {}, 8000);
    const st = j2534.data?.status;
    let jStatus: DiagStatus = 'info';
    let jDetail = j2534.detail;
    if (st === 'ok') {
      jStatus = 'ok';
      jDetail = `drivers=${j2534.data?.driverCount ?? 0}`;
    } else if (st === 'unsupported_os') {
      jStatus = 'skip';
      jDetail = 'Windows-only registry discovery';
    } else if (!j2534.ok) {
      jStatus = 'warn';
      jDetail = j2534.detail;
    }
    const libPath = (ws.get<string>('j2534.libraryPath') || '').trim();
    items.push({
      id: 'probe.j2534',
      group: 'Probes',
      label: 'J2534 registry discover',
      status: jStatus,
      detail: jDetail,
      hint: libPath
        ? 'libraryPath configured'
        : 'Optional: set vehicleDebug.j2534.libraryPath for analysis-only probe'
    });
  }

  const session = getEcuSession();
  items.push({
    id: 'session.connected',
    group: 'Session',
    label: 'ECU session',
    status: session.connected ? 'ok' : 'info',
    detail: session.connected ? `${session.mode} / ${session.transport}` : 'not connected'
  });
  items.push({
    id: 'session.vin',
    group: 'Session',
    label: 'VIN',
    status: session.vin ? 'ok' : 'info',
    detail: session.vin || 'not set'
  });
  const ecu = getActiveEcu();
  items.push({
    id: 'session.ecu',
    group: 'Session',
    label: 'Active ECU',
    status: ecu ? 'ok' : 'warn',
    detail: ecu ? `${ecu.name} ${ecu.txId}->${ecu.rxId}` : 'none',
    hint: `${listEcus().length} target(s)`
  });

  const transport = ws.get<string>('transport', 'simulation');
  items.push({ id: 'cfg.transport', group: 'Configuration', label: 'Transport', status: 'info', detail: transport });
  const llmRemote = ws.get<boolean>('llm.remote.enabled', false);
  const allowUpload = ws.get<boolean>('llm.allowRemoteDataUpload', false);
  items.push({
    id: 'cfg.llm.remote',
    group: 'Configuration',
    label: 'Remote LLM',
    status: llmRemote && allowUpload ? 'warn' : 'ok',
    detail: llmRemote ? (allowUpload ? 'enabled + upload' : 'enabled (no upload)') : 'disabled'
  });

  items.push({
    id: 'cfg.jira',
    group: 'Integrations',
    label: 'Jira',
    status: ws.get('jira.vwif.baseUrl') || ws.get('jira.devstack.baseUrl') ? 'ok' : 'skip',
    detail: 'config'
  });
  items.push({
    id: 'cfg.confluence',
    group: 'Integrations',
    label: 'Confluence',
    status: ws.get('confluence.vwif.baseUrl') || ws.get('confluence.devstack.baseUrl') ? 'ok' : 'skip',
    detail: 'config'
  });
  items.push({
    id: 'cfg.codebeamer',
    group: 'Integrations',
    label: 'CodeBeamer',
    status: ws.get('codebeamer.baseUrl') ? 'ok' : 'skip',
    detail: 'config'
  });
  items.push({
    id: 'safety',
    group: 'Safety',
    label: 'Product boundary',
    status: 'info',
    detail: 'Analysis aid only — not ASIL confirmation'
  });

  let overall: DiagStatus = 'ok';
  for (const it of items) overall = worst(overall, it.status);
  const errors = items.filter((i) => i.status === 'error').length;
  const warns = items.filter((i) => i.status === 'warn').length;
  const oks = items.filter((i) => i.status === 'ok').length;
  return {
    generatedAt: new Date().toISOString(),
    overall,
    items,
    summary: `${oks} ok · ${warns} warn · ${errors} error · overall=${overall}`
  };
}
