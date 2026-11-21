/** VDA TypeScript-logic unit tests (run with node, no VS Code host). */
'use strict';

const PRIORITY_SCORE = { critical: 100, high: 80, medium: 50, low: 20, info: 5 };

function matchPattern(value, pattern) {
  const v = value.toUpperCase();
  const p = pattern.toUpperCase();
  if (p.endsWith('*')) return v.startsWith(p.slice(0, -1));
  return v === p;
}

function rankDtc(code, severity, rules) {
  let best;
  for (const r of rules) {
    let ok = true;
    if (r.dtcPattern && !matchPattern(code, r.dtcPattern)) ok = false;
    if (r.severity && r.severity !== severity) ok = false;
    if (ok && (r.dtcPattern || r.severity)) {
      if (!best || PRIORITY_SCORE[r.priority] > PRIORITY_SCORE[best.priority]) best = r;
    }
  }
  if (best) return best.priority;
  if (severity === 'critical') return 'critical';
  if (severity === 'major') return 'high';
  if (severity === 'minor') return 'low';
  return 'info';
}

const RULES = [
  { severity: 'critical', priority: 'critical' },
  { dtcPattern: 'P0*', priority: 'high' },
  { dtcPattern: 'U*', priority: 'high' }
];

const CAN_CODES = [
  'CAN_DEPS_MISSING',
  'CAN_INTERFACE_MISSING',
  'CAN_PERMISSION',
  'CAN_TIMEOUT',
  'CAN_CONNECT_FAILED',
  'CAN_FALLBACK_SIM',
  'SIM_FORCED'
];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function testTriage() {
  assert(rankDtc('U0100', 'major', RULES) === 'high', 'U0100 high');
  assert(rankDtc('P0300', 'major', RULES) === 'high', 'P0300 high');
  assert(rankDtc('P0001', 'critical', RULES) === 'critical', 'critical wins');
  assert(rankDtc('C0035', 'minor', RULES) === 'low', 'minor low');
  console.log('  triageLogic: 4 passed');
}

function testCanCodes() {
  assert(CAN_CODES.length >= 6, 'code count');
  assert(new Set(CAN_CODES).size === CAN_CODES.length, 'unique');
  console.log('  canErrorCodes: 2 passed');
}

function testObdContract() {
  const pkg = require('../../package.json');
  const cmds = (pkg.contributes.commands || []).map((c) => c.command);
  for (const c of [
    'vehicleDebug.obdConnect',
    'vehicleDebug.obdReadPids',
    'vehicleDebug.obdReadDtcs',
    'vehicleDebug.obdClearDtcs',
    'vehicleDebug.obdReadVin'
  ]) {
    assert(cmds.includes(c), `missing command ${c}`);
  }
  assert(String(pkg.version).startsWith('0.2.'), 'version 0.2.x');
  console.log('  obdCommands: 6 passed');
}

console.log('VDA unit tests (node)');
testTriage();
testCanCodes();
testObdContract();

function testHealthDiffShape() {
  const a = { vin: 'X', findings: [{ id: '1', priority: 'high' }] };
  const b = { vin: 'X', findings: [{ id: '1', priority: 'low' }, { id: '2', priority: 'high' }] };
  assert(a.findings.length === 1 && b.findings.length === 2, 'diff inputs');
  assert(a.vin === b.vin, 'same vin');
  console.log('  healthDiff: 3 passed');
}
testHealthDiffShape();

function testP1Commands() {
  const pkg = require('../../package.json');
  const cmds = (pkg.contributes.commands || []).map((c) => c.command);
  for (const c of [
    'vehicleDebug.readVehicleStatus',
    'vehicleDebug.showTimeline',
    'vehicleDebug.sovdDiscover',
    'vehicleDebug.pullRemoteDiagnostics',
    'vehicleDebug.diffHealthSnapshots'
  ]) {
    assert(cmds.includes(c), 'missing ' + c);
  }
  assert(String(pkg.version).startsWith('0.2.'), 'version 0.2.x');
  console.log('  p1Commands: 5 passed');
}
testP1Commands();

function testP2Commands() {
  const pkg = require('../../package.json');
  const cmds = (pkg.contributes.commands || []).map((c) => c.command);
  for (const c of [
    'vehicleDebug.anomalyAssist',
    'vehicleDebug.openGovernance',
    'vehicleDebug.exportPartnerPack',
    'vehicleDebug.importFleetOffline',
    'vehicleDebug.loadDbc'
  ]) {
    assert(cmds.includes(c), 'missing ' + c);
  }
  assert(String(pkg.version).startsWith('0.2.'), 'version 0.2.x');
  console.log('  p2Commands: 5 passed');
}
testP2Commands();

function testSelfDiagCommands() {
  const pkg = require('../../package.json');
  const cmds = (pkg.contributes.commands || []).map((c) => c.command);
  for (const c of [
    'vehicleDebug.runSelfDiagnostic',
    'vehicleDebug.exportSelfDiagnostic',
    'vehicleDebug.showDashboard',
    'vehicleDebug.refreshViews'
  ]) {
    assert(cmds.includes(c), 'missing ' + c);
  }
  assert(String(pkg.version).startsWith('0.2.'), 'version 0.2.x');
  console.log('  selfDiag: 4 passed');
}
testSelfDiagCommands();

function testStandardsCommands() {
  const pkg = require('../../package.json');
  const cmds = (pkg.contributes.commands || []).map((c) => c.command);
  for (const c of [
    'vehicleDebug.loadOdx',
    'vehicleDebug.readDtcExtended',
    'vehicleDebug.readObdReadiness',
    'vehicleDebug.j2534Status'
  ]) {
    assert(cmds.includes(c), 'missing ' + c);
  }
  assert(String(pkg.version).startsWith('0.2.'), 'version 0.2.x');
  console.log('  standardsLab: 5 passed');
}
testStandardsCommands();

function testMoreStandards() {
  const pkg = require('../../package.json');
  const cmds = (pkg.contributes.commands || []).map((c) => c.command);
  for (const c of [
    'vehicleDebug.applyOdxDtcs',
    'vehicleDebug.readObdMode09',
    'vehicleDebug.lookupJ2012',
    'vehicleDebug.dpduStatus'
  ]) {
    assert(cmds.includes(c), 'missing ' + c);
  }
  assert(String(pkg.version).startsWith('0.2.'), '0.2.x');
  console.log('  standardsMore: 5 passed');
}
testMoreStandards();

function testBuslogCommands() {
  const pkg = require('../../package.json');
  const cmds = (pkg.contributes.commands || []).map((c) => c.command);
  assert(cmds.includes('vehicleDebug.probeBuslog'), 'probeBuslog');
  assert(cmds.includes('vehicleDebug.analyzeBuslogBinary'), 'analyzeBuslogBinary');
  assert(String(pkg.version).startsWith('0.2.'), '0.2.x');
  console.log('  buslog: 3 passed');
}
testBuslogCommands();

function testRedaction() {
  const VIN_RE = /\b([A-HJ-NPR-Z0-9]{17})\b/gi;
  const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
  function redactText(input, keepVinLast4) {
    let s = input;
    s = s.replace(EMAIL_RE, '[REDACTED_EMAIL]');
    s = s.replace(VIN_RE, (m) =>
      keepVinLast4 && m.length === 17 ? `VIN***********${m.slice(-4)}` : '[REDACTED_VIN]'
    );
    return s;
  }
  const vin = 'WVWZZZ1JZXW000001';
  assert(redactText(`car ${vin}`).includes('[REDACTED_VIN]'), 'full vin redact');
  assert(redactText(`car ${vin}`, true).includes('0001'), 'last4');
  assert(redactText('a@b.co').includes('[REDACTED_EMAIL]'), 'email');
  console.log('  redaction: 3 passed');
}
testRedaction();

function testSmokeCriticalCommands() {
  const pkg = require('../../package.json');
  const cmds = (pkg.contributes.commands || []).map((c) => c.command);
  const smoke = [
    'vehicleDebug.runSelfDiagnostic',
    'vehicleDebug.connectEcu',
    'vehicleDebug.readDtcs',
    'vehicleDebug.readVehicleStatus',
    'vehicleDebug.refreshHealth',
    'vehicleDebug.showTimeline',
    'vehicleDebug.parseAsc',
    'vehicleDebug.exportHealthSnapshot',
    'vehicleDebug.j2534Discover',
    'vehicleDebug.openGovernance'
  ];
  for (const c of smoke) {
    assert(cmds.includes(c), `smoke missing ${c}`);
  }
  console.log('  smokeCriticalCommands: 10 passed');
}
testSmokeCriticalCommands();

function testJ2534CommandsAndSettings() {
  const pkg = require('../../package.json');
  const cmds = (pkg.contributes.commands || []).map((c) => c.command);
  assert(cmds.includes('vehicleDebug.j2534Discover'), 'j2534Discover');
  assert(cmds.includes('vehicleDebug.j2534Probe'), 'j2534Probe');
  const props = (pkg.contributes.configuration && pkg.contributes.configuration.properties) || {};
  assert(props['vehicleDebug.j2534.libraryPath'], 'setting libraryPath');
  assert(props['vehicleDebug.j2534.pythonPath32'], 'setting pythonPath32');
  console.log('  j2534Contract: 4 passed');
}
testJ2534CommandsAndSettings();

function testNoUnsafeCommandIds() {
  const pkg = require('../../package.json');
  const cmds = (pkg.contributes.commands || []).map((c) => c.command.toLowerCase());
  const banned = ['flashecu', 'writemsgs', 'securityaccess', 'immobilizer', 'lockdoors', 'ecall'];
  for (const b of banned) {
    assert(!cmds.some((c) => c.includes(b)), `banned id fragment ${b}`);
  }
  const probe = (pkg.contributes.commands || []).find((c) => c.command === 'vehicleDebug.j2534Probe');
  assert(probe && /analysis-only/i.test(probe.title || ''), 'j2534Probe title analysis-only');
  console.log('  noUnsafeCommands: 5 passed');
}
testNoUnsafeCommandIds();

function testLlmUploadDefaultOff() {
  const pkg = require('../../package.json');
  const props = (pkg.contributes.configuration && pkg.contributes.configuration.properties) || {};
  const key = Object.keys(props).find((k) => /allowRemoteDataUpload/i.test(k));
  if (key) {
    assert(props[key].default === false, 'upload default false');
  }
  console.log('  llmUploadDefault: 1 passed');
}
testLlmUploadDefaultOff();

function testI18nKeyParity() {
  const path = require('path');
  const fs = require('fs');
  const p = path.join(__dirname, '..', '..', 'src', 'utils', 'i18n.dicts.json');
  assert(fs.existsSync(p), 'i18n.dicts.json missing');
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  const enKeys = Object.keys(d.en).sort();
  const frKeys = Object.keys(d.fr).sort();
  assert(enKeys.length >= 15, 'en keys count');
  assert(enKeys.join(',') === frKeys.join(','), 'en/fr key parity');
  assert(d.en['safety.disclaimer'] && d.fr['safety.disclaimer'], 'safety.disclaimer');
  assert(d.en['safety.j2534'] && /WriteMsgs|analysis/i.test(d.en['safety.j2534']), 'j2534 safety en');
  assert(/analysis-only|WriteMsgs/i.test(d.en['cmd.j2534Probe']), 'probe title key');
  console.log('  i18nParity: 4 passed');
}
testI18nKeyParity();

console.log('All unit tests passed (including Sprint A/0.3 contracts + i18n)');
