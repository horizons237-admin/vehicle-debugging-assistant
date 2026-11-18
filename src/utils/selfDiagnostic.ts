/**
 * Self-diagnostic engine — probes feature readiness for the lab assistant.
 */
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
  return [
    path.join(root, 'src', 'python', name),
    path.join(root, 'python', name)
  ].some((p) => fs.existsSync(p));
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
    if (
      data &&
      (data.status === 'ok' ||
        data.status === 'connected' ||
        data.mode ||
        data.status === 'unsupported_os')
    ) {
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

export async function runSelfDiagnostic(options?: {
  deep?: boolean;
}): Promise<DiagReport> {
  const deep = options?.deep !== false;
  const items: DiagItem[] = [];
  const cfg = getConfig();
  const ws = vscode.workspace.getConfiguration('vehicleDebug');

  // --- Runtime ---
  items.push({
    id: 'vscode',
    group: 'Runtime',
    label: 'VS Code host',
    status: 'ok',
    detail: `v${vscode.version}`
  });

  const pyPath = cfg.pythonPath || 'python3';
  items.push({
    id: 'python.path',
    group: 'Runtime',
    label: 'Python path',
    status: 'info',
    detail: String(pyPath)
  });

  const py32 = (ws.get<string>('j2534.pythonPath32') || '').trim();
  items.push({
    id: 'python.path32',
    group: 'Runtime',
    label: 'Python 32-bit (J2534)',
    status: py32 ? 'ok' : 'info',
    detail: py32 || 'not set — use for OEM PassThru DLLs on Windows',
    hint: 'vehicleDebug.j2534.pythonPath32'
  });

  items.push({
    id: 'runtime.platform',
    group: 'Runtime',
    label: 'Platform',
    status: 'info',
    detail: `${process.platform} ${process.arch}`
  });

  // --- Scripts present ---
  const scripts = [
    'uds_client.py',
    'obd_client.py',
    'doip_client.py',
    'log_analyzer.py',
    'arxml_analyzer.py',
    'dbc_parser.py',
    'check_deps.py',
    'j2534_probe.py',
    'asc_parser.py',
    'buslog_decoder.py',
    'blf_probe.py',
    'mf4_probe.py'
  ];
  for (const s of scripts) {
    const ok = scriptExists(s);
    items.push({
      id: `script.${s}`,
      group: 'Backends',
      label: s,
      status: ok ? 'ok' : 'error',
      detail: ok ? 'present' : 'missing',
      hint: ok ? undefined : 'Reinstall extension or check src/python'
    });
  }

  // --- Live probes (simulation, fast) ---
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
  }

  // J2534 discovery (safe on all OS — unsupported_os expected on Linux/macOS)
  if (deep) {
    const j2534 = await probePython('j2534_probe.py', ['discover'], {}, 8000);
    const st = j2534.data?.status;
    let status: DiagStatus = 'info';
    let detail = j2534.detail;
    if (st === 'ok') {
      status = 'ok';
      detail = `drivers=${j2534.data?.driverCount ?? 0}`;
    } else if (st === 'unsupported_os') {
      status = 'skip';
      detail = 'Windows-only registry discovery';
    } else if (!j2534.ok) {
      status = 'warn';
      detail = j2534.detail;
    }
    const libPath = (ws.get<string>('j2534.libraryPath') || '').trim();
    items.push({
      id: 'probe.j2534',
      group: 'Probes',
      label: 'J2534 registry discover',
      status,
      detail,
      hint: libPath
        ? 'libraryPath configured — probe remains Open/ReadVersion/Close only'
        : 'Optional: set vehicleDebug.j2534.libraryPath for analysis-only probe'
    });
  }

  // --- Optional deps (best-effort via check_deps) ---
  if (deep && scriptExists('check_deps.py')) {
    const deps = await probePython('check_deps.py', ['json'], {}, 10000);
    const data = deps.data || {};
    const missing = Array.isArray(data.missing) ? data.missing : [];
    const present = Array.isArray(data.present) ? data.present : [];
    items.push({
      id: 'probe.deps',
      group: 'Probes',
      label: 'Python optional deps',
      status: missing.length ? 'warn' : deps.ok ? 'ok' : 'info',
      detail: missing.length
        ? `missing: ${missing.slice(0, 6).join(', ')}`
        : present.length
          ? `ok (${present.length} reported)`
          : deps.detail,
      hint: 'pip install python-can udsoncan can-isotp asammdf (optional)'
    });
  }

  items.push({
    id: 'safety.posture',
    group: 'Safety',
    label: 'Analysis-only posture',
    status: 'ok',
    detail: 'No vehicle control / no flash / no WriteMsgs',
    hint: 'J2534 probe = Open + ReadVersion + Close only'
  });

  // --- Session / ECU ---
  const session = getEcuSession();
  items.push({
    id: 'session.connected',
    group: 'Session',
    label: 'ECU session',
    status: session.connected ? 'ok' : 'info',
    detail: session.connected
      ? `${session.mode} / ${session.transport} — ${session.lastAction}`
      : 'not connected'
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
    detail: ecu ? `${ecu.name} ${ecu.txId}→${ecu.rxId}` : 'none',
    hint: `${listEcus().length} target(s) registered`
  });

  // --- Feature flags / config ---
  const transport = ws.get<string>('transport', 'simulation');
  items.push({
    id: 'cfg.transport',
    group: 'Configuration',
    label: 'Transport',
    status: transport === 'simulation' ? 'info' : 'ok',
    detail: transport
  });

  const llmRemote = ws.get<boolean>('llm.remote.enabled', false);
  const allowUpload = ws.get<boolean>('llm.allowRemoteDataUpload', false);
  items.push({
    id: 'cfg.llm.remote',
    group: 'Configuration',
    label: 'Remote LLM',
    status: llmRemote && allowUpload ? 'warn' : llmRemote ? 'info' : 'ok',
    detail: llmRemote
      ? allowUpload
        ? 'enabled + upload allowed'
        : 'enabled (upload blocked)'
      : 'disabled',
    hint: allowUpload ? 'Prefer local LLM for sensitive data' : undefined
  });

  const remoteMock = ws.get<boolean>('remoteDiagnostics.preferMock', true);
  items.push({
    id: 'cfg.remote',
    group: 'Configuration',
    label: 'Remote diagnostics',
    status: 'info',
    detail: remoteMock ? 'prefer mock' : 'HTTP preferred'
  });

  const jira = !!(ws.get('jira.vwif.baseUrl') || ws.get('jira.devstack.baseUrl'));
  items.push({
    id: 'cfg.jira',
    group: 'Integrations',
    label: 'Jira',
    status: jira ? 'ok' : 'skip',
    detail: jira ? 'baseUrl configured' : 'not configured'
  });

  const conf = !!(ws.get('confluence.vwif.baseUrl') || ws.get('confluence.devstack.baseUrl'));
  items.push({
    id: 'cfg.confluence',
    group: 'Integrations',
    label: 'Confluence',
    status: conf ? 'ok' : 'skip',
    detail: conf ? 'baseUrl configured' : 'not configured'
  });

  const cb = !!ws.get('codebeamer.baseUrl');
  items.push({
    id: 'cfg.codebeamer',
    group: 'Integrations',
    label: 'CodeBeamer',
    status: cb ? 'ok' : 'skip',
    detail: cb ? 'baseUrl configured' : 'not configured'
  });

  items.push({
    id: 'safety',
    group: 'Safety',
    label: 'Product boundary',
    status: 'info',
    detail: 'Analysis aid only — not ASIL confirmation / no vehicle control'
  });

  let overall: DiagStatus = 'ok';
  for (const it of items) {
    overall = worst(overall, it.status);
  }
  const errors = items.filter((i) => i.status === 'error').length;
  const warns = items.filter((i) => i.status === 'warn').length;
  const oks = items.filter((i) => i.status === 'ok').length;
  const summary = `${oks} ok · ${warns} warn · ${errors} error · overall=${overall}`;

  return {
    generatedAt: new Date().toISOString(),
    overall,
    items,
    summary
  };
}
