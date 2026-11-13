import * as vscode from 'vscode';
import * as path from 'path';
import { runPythonScript } from '../utils/pythonRunner';
import { ErrorTreeProvider, AnalyzedError } from '../providers/errorTreeProvider';
import { DtcTreeProvider, DtcItem } from '../providers/dtcTreeProvider';

export async function analyzeArxml(
  errorProvider: ErrorTreeProvider,
  dtcProvider: DtcTreeProvider
): Promise<void> {
  const uris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    openLabel: 'Analyze ARXML',
    filters: {
      ARXML: ['arxml', 'xml'],
      'All files': ['*']
    }
  });
  if (!uris?.length) return;

  const filePath = uris[0].fsPath;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Analyzing ARXML: ${path.basename(filePath)}…`,
      cancellable: true
    },
    async (progress, token) => {
      progress.report({ message: 'Parsing ARXML…' });
      const result = await runPythonScript('arxml_analyzer.py', [filePath], undefined, undefined, token);

      if (token.isCancellationRequested || result.cancelled) {
        vscode.window.showInformationMessage('ARXML analysis cancelled');
        return;
      }

      const payload = result.data as {
        status?: string;
        message?: string;
        errors?: any[];
        dtcs?: any[];
        summary?: any;
      } | undefined;

      if (!result.success || payload?.status === 'error') {
        const fallback = await fallbackScan(filePath);
        if (fallback.errors.length || fallback.dtcs.length) {
          apply(errorProvider, dtcProvider, fallback.errors, fallback.dtcs, fallback.summary);
          vscode.window.showInformationMessage(
            `ARXML basic scan (fallback): ${fallback.dtcs.length} DTC ref(s), ${fallback.errors.length} note(s)`
          );
          return;
        }
        vscode.window.showErrorMessage(
          `ARXML analysis failed: ${payload?.message || result.stderr || result.stdout}`
        );
        return;
      }

      const data = payload || {};
      const errors: AnalyzedError[] = (data.errors || []).map((e: any, i: number) => ({
        id: `arxml-${i}-${Date.now()}`,
        category: e.category || 'configuration',
        severity: e.severity || 'major',
        asilImpact: e.asilImpact,
        source: 'arxml',
        description: e.description,
        recommendation: e.recommendation,
        evidence: { file: path.basename(filePath), summary: data.summary },
        timestamp: new Date().toISOString()
      }));

      const dtcs: DtcItem[] = (data.dtcs || []).map((d: any) => ({
        code: String(d.code),
        status: d.status || 'Configured',
        description: d.description || '',
        severity: (d.severity || 'major') as DtcItem['severity'],
        freezeFrame: d.freezeFrame
      }));

      apply(errorProvider, dtcProvider, errors, dtcs, data.summary);

      const s = data.summary || {};
      vscode.window.showInformationMessage(
        `ARXML: ${s.demEvents || 0} DEM events, ${dtcs.length} DTC(s), ${s.diagnosticServices || 0} services, ${errors.length} finding(s)`
      );

      const ch = vscode.window.createOutputChannel('Vehicle Debug ARXML');
      ch.clear();
      ch.appendLine(`File: ${filePath}`);
      ch.appendLine(JSON.stringify(s, null, 2));
      if (s.services?.length) {
        ch.appendLine('\nServices:');
        s.services.forEach((x: string) => ch.appendLine(`  - ${x}`));
      }
      ch.show(true);
    }
  );
}

function apply(
  errorProvider: ErrorTreeProvider,
  dtcProvider: DtcTreeProvider,
  errors: AnalyzedError[],
  dtcs: DtcItem[],
  _summary: any
) {
  if (errors.length) {
    errorProvider.setErrors([...errors, ...errorProvider.getErrors()]);
  }
  if (dtcs.length) {
    const existing = dtcProvider.getDtcs();
    const codes = new Set(existing.map((d) => d.code));
    dtcProvider.setDtcs([...existing, ...dtcs.filter((d) => !codes.has(d.code))]);
  }
}

async function fallbackScan(
  filePath: string
): Promise<{ errors: AnalyzedError[]; dtcs: DtcItem[]; summary: any }> {
  const buf = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
  const text = Buffer.from(buf).toString('utf8');
  const dtcs: DtcItem[] = [];
  const re = /[PBCU][0-9A-Fa-f]{4}/g;
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    found.add(m[0]);
  }
  for (const code of found) {
    dtcs.push({
      code,
      status: 'Found in ARXML',
      description: 'DTC-like pattern in ARXML text',
      severity: 'minor'
    });
  }
  const errors: AnalyzedError[] = [];
  if (!text.includes('DIAGNOSTIC') && !text.includes('Diagnostic')) {
    errors.push({
      id: `arxml-fb-${Date.now()}`,
      category: 'configuration',
      severity: 'minor',
      source: 'arxml',
      description: 'No DIAGNOSTIC* tags spotted in text scan',
      timestamp: new Date().toISOString()
    });
  }
  return {
    errors,
    dtcs,
    summary: { fallback: true, dtcPatterns: found.size }
  };
}
