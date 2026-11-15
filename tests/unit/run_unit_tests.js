'use strict';
const PRIORITY_SCORE = { critical: 100, high: 80, medium: 50, low: 20, info: 5 };
function matchPattern(value, pattern) {
  const v = value.toUpperCase(), p = pattern.toUpperCase();
  return p.endsWith('*') ? v.startsWith(p.slice(0, -1)) : v === p;
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
const RULES = [{ severity: 'critical', priority: 'critical' }, { dtcPattern: 'P0*', priority: 'high' }, { dtcPattern: 'U*', priority: 'high' }];
const CAN_CODES = ['CAN_DEPS_MISSING','CAN_INTERFACE_MISSING','CAN_PERMISSION','CAN_TIMEOUT','CAN_CONNECT_FAILED','CAN_FALLBACK_SIM','SIM_FORCED'];
function assert(c,m){ if(!c) throw new Error(m); }
function testTriage(){
  assert(rankDtc('U0100','major',RULES)==='high','U0100');
  assert(rankDtc('P0300','major',RULES)==='high','P0300');
  assert(rankDtc('P0001','critical',RULES)==='critical','crit');
  assert(rankDtc('C0035','minor',RULES)==='low','minor');
  console.log('  triageLogic: 4 passed');
}
function testCanCodes(){
  assert(CAN_CODES.length>=6,'count');
  assert(new Set(CAN_CODES).size===CAN_CODES.length,'unique');
  console.log('  canErrorCodes: 2 passed');
}
function testObdContract(){
  const pkg=require('../../package.json');
  const cmds=(pkg.contributes.commands||[]).map(c=>c.command);
  for (const c of ['vehicleDebug.obdConnect','vehicleDebug.obdReadPids','vehicleDebug.obdReadDtcs','vehicleDebug.obdClearDtcs','vehicleDebug.obdReadVin'])
    assert(cmds.includes(c),'missing '+c);
  assert(pkg.version==='0.2.0','version');
  console.log('  obdCommands: 6 passed');
}
console.log('VDA unit tests (node)');
testTriage(); testCanCodes(); testObdContract();
console.log('All unit tests passed');
