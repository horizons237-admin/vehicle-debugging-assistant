import * as vscode from 'vscode';
import * as path from 'path';
import { ErrorTreeProvider, AnalyzedError, ErrorCategory } from '../providers/errorTreeProvider';
import { DtcTreeProvider, DtcItem } from '../providers/dtcTreeProvider';

export async function importCicdReport(
  errorProvider: ErrorTreeProvider,
  dtcProvider: DtcTreeProvider
): Promise<void> {
  const uris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    openLabel: 'Import CI/CD Report',
    filters: {
      'JSON reports': ['json'],
      'All files': ['*']
    }
  });
  if (!uris?.length) return;

  const filePath = uris[0].fsPath;
  let raw: string;
  try {
    raw = Buffer.from(await vscode.workspace.fs.readFile(uris[0])).toString('utf8');
  } catch (e: any) {
    vscode.window.showErrorMessage(`Cannot read file: ${e?.message || e}`);
    return;
  }

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    vscode.window.showErrorMessage('Invalid JSON');
    return;
  }

  const { errors, dtcs } = normalizeReport(data, path.basename(filePath));

  if (errors.length === 0 && dtcs.length === 0) {
    vscode.window.showWarningMessage(
      'No errors or DTCs recognized in this report. Expected keys: errors[], dtcs[] (or issues[]).'
    );
    return;
  }

  const mode = await vscode.window.showQuickPick(
    [
      { label: 'Replace current lists', id: 'replace' },
      { label: 'Merge with current lists', id: 'merge' }
    ],
    { placeHolder: 'How to apply the imported report?' }
  );
  if (!mode) return;

  if (mode.id === 'replace') {
    errorProvider.setErrors(errors);
    if (dtcs.length) dtcProvider.setDtcs(dtcs);
  } else {
    errorProvider.setErrors([...errors, ...errorProvider.getErrors()]);
    if (dtcs.length) {
      const existing = dtcProvider.getDtcs();
      const codes = new Set(existing.map((d) => d.code));
      dtcProvider.setDtcs([...existing, ...dtcs.filter((d) => !codes.has(d.code))]);
    }
  }

  vscode.window.showInformationMessage(
    `CI/CD import: ${errors.length} error(s), ${dtcs.length} DTC(s) from ${path.basename(filePath)}`
  );
}

function normalizeReport(
  data: any,
  sourceName: string
): { errors: AnalyzedError[]; dtcs: DtcItem[] } {
  const errors: AnalyzedError[] = [];
  const dtcs: DtcItem[] = [];
  const now = new Date().toISOString();

  const errList = Array.isArray(data?.errors)
    ? data.errors
    : Array.isArray(data) && data[0]?.category
      ? data
      : [];
  for (const [i, e] of errList.entries()) {
    errors.push(mapError(e, i, sourceName, now));
  }

  const dtcList = Array.isArray(data?.dtcs) ? data.dtcs : [];
  for (const d of dtcList) {
    dtcs.push(mapDtc(d));
  }

  const issues = Array.isArray(data?.issues) ? data.issues : [];
  for (const [i, issue] of issues.entries()) {
    errors.push({
      id: `cicd-sonar-${i}-${Date.now()}`,
      category: mapSonarCategory(issue),
      severity: mapSonarSeverity(issue?.severity || issue?.type),
      source: 'cicd',
      description: `[${issue.rule || 'rule'}] ${issue.message || JSON.stringify(issue).slice(0, 120)}`,
      evidence: { file: issue.component || issue.file, line: issue.line, raw: issue },
      recommendation: 'Review in CI report and fix before merge',
      timestamp: now
    });
  }

  const findings = Array.isArray(data?.findings)
    ? data.findings
    : Array.isArray(data?.violations)
      ? data.violations
      : [];
  for (const [i, f] of findings.entries()) {
    errors.push({
      id: `cicd-finding-${i}-${Date.now()}`,
      category: guessCategory(String(f.message || f.rule || f.type || '')),
      severity: mapSeverity(f.severity || f.level || 'major'),
      asilImpact: f.asil || f.asilImpact,
      source: 'cicd',
      description: String(f.message || f.description || f.rule || 'Finding'),
      evidence: f,
      recommendation: f.recommendation,
      timestamp: now
    });
  }

  if (Array.isArray(data) && data[0]?.code && !data[0]?.category) {
    for (const d of data) dtcs.push(mapDtc(d));
  }

  return { errors, dtcs };
}

function mapError(e: any, i: number, sourceName: string, now: string): AnalyzedError {
  return {
    id: e.id || `cicd-err-${i}-${Date.now()}`,
    category: normalizeCategory(e.category),
    severity: mapSeverity(e.severity || 'major'),
    asilImpact: e.asilImpact || e.asil,
    source: e.source || 'cicd',
    description: String(e.description || e.message || 'CI error'),
    evidence: e.evidence || { report: sourceName, raw: e },
    recommendation: e.recommendation,
    timestamp: e.timestamp || now
  };
}

function mapDtc(d: any): DtcItem {
  return {
    code: String(d.code || d.dtc || 'UNKNOWN'),
    status: String(d.status || 'Unknown'),
    description: String(d.description || d.message || ''),
    severity: mapSeverity(d.severity || 'major') as DtcItem['severity'],
    freezeFrame: d.freezeFrame || d.freeze_frame
  };
}

function normalizeCategory(c: any): ErrorCategory {
  const v = String(c || 'unknown').toLowerCase();
  const allowed: ErrorCategory[] = [
    'software_bug',
    'communication',
    'safety_mechanism',
    'configuration',
    'timing',
    'unknown'
  ];
  if (allowed.includes(v as ErrorCategory)) return v as ErrorCategory;
  return guessCategory(v);
}

function guessCategory(text: string): ErrorCategory {
  const t = text.toLowerCase();
  if (/misra|bug|assert|exception|null|overflow/.test(t)) return 'software_bug';
  if (/nrc|uds|can|timeout|isotp|doip/.test(t)) return 'communication';
  if (/wdgm|watchdog|fim|dem|safe.?state|asil/.test(t)) return 'safety_mechanism';
  if (/arxml|config|dcm|routing/.test(t)) return 'configuration';
  if (/timing|deadline|p2|latency/.test(t)) return 'timing';
  return 'unknown';
}

function mapSeverity(s: any): 'critical' | 'major' | 'minor' {
  const v = String(s || '').toLowerCase();
  if (/critical|blocker|fatal|error|high/.test(v)) return 'critical';
  if (/minor|low|info|hint/.test(v)) return 'minor';
  return 'major';
}

function mapSonarSeverity(s: any): 'critical' | 'major' | 'minor' {
  const v = String(s || '').toUpperCase();
  if (v === 'BLOCKER' || v === 'CRITICAL' || v === 'BUG') return 'critical';
  if (v === 'MINOR' || v === 'INFO') return 'minor';
  return 'major';
}

function mapSonarCategory(issue: any): ErrorCategory {
  const t = `${issue.type || ''} ${issue.rule || ''} ${issue.message || ''}`.toLowerCase();
  return guessCategory(t);
}
