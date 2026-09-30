import { calculateIntegratedTriage } from '../services/triageEngine';
import { INITIAL_ASSESSMENTS } from '../data/seedAssessments';
import { AssessmentRecord, TriageTier, T0EmergencyStatus } from '../types/assessment';

// Functions matching HospitalPage.tsx implementation
function getRecordTier(
  r: AssessmentRecord,
  patientStatuses: Record<string, { t0Status?: T0EmergencyStatus; downgradedTier?: 'T1' | 'T2' }> = {}
): TriageTier {
  if (patientStatuses[r.id]?.downgradedTier) {
    return patientStatuses[r.id].downgradedTier!;
  }
  if (r.triageTier) return r.triageTier;
  if (r.zone === 'RED' && r.criticalTriggered) return 'T0';
  if (r.zone === 'RED') return 'T1';
  if (r.zone === 'YELLOW') return 'T2';
  return 'T3';
}

function getRecordT0Status(
  r: AssessmentRecord,
  patientStatuses: Record<string, { t0Status?: T0EmergencyStatus; downgradedTier?: 'T1' | 'T2' }> = {}
): T0EmergencyStatus | undefined {
  if (patientStatuses[r.id]?.t0Status) {
    return patientStatuses[r.id].t0Status;
  }
  if (r.t0Status) {
    return r.t0Status;
  }
  if (r.triageTier === 'T0' || (r.zone === 'RED' && r.criticalTriggered)) {
    return 'T0-Suspect';
  }
  return undefined;
}

function getBadgeText(tier: TriageTier, t0Status?: T0EmergencyStatus): string {
  if (tier === 'T0') {
    if (t0Status === 'T0-Confirmed') return 'T0-CONFIRMED';
    return 'T0-SUSPECT';
  }
  if (t0Status === 'Downgraded') {
    return `${tier === 'T1' ? 'T1 · HIGH RISK' : 'T2 · MODERATE RISK'} (DOWNGRADED)`;
  }
  if (tier === 'T1') return 'T1 · HIGH RISK';
  if (tier === 'T2') return 'T2 · MODERATE RISK';
  return 'T3 · LOW RISK';
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`✓ ${message}`);
  }
}

console.log('====================================================');
console.log('RAPID-MIND VERIFICATION SUITE: CASES A - F');
console.log('====================================================\n');

// ----------------------------------------------------
// CASE A: Assessment -> T2 (Expected T2, NEVER T0-CONFIRMED)
// ----------------------------------------------------
console.log('--- TEST CASE A: Assessment -> T2 ---');
const caseA_engine = calculateIntegratedTriage(6, false, 2, 2, false);
assert(caseA_engine.tier === 'T2', `Case A engine tier is T2 (got ${caseA_engine.tier})`);
assert(caseA_engine.totalIntegratedScore === 10, `Case A total score is 10/37 (got ${caseA_engine.totalIntegratedScore})`);

const caseA_record: AssessmentRecord = {
  id: 'TEST-A',
  timestamp: '10:00',
  location: 'Posko A',
  method: 'CHECKLIST',
  zone: caseA_engine.zone,
  triageTier: caseA_engine.tier,
  t0Status: undefined,
  score: caseA_engine.srqScore,
  indicators: ['Tidur tidak nyenyak', 'Merasa was-was dan gelisah', 'Mudah lelah'],
  criticalTriggered: false,
  recommendedAction: caseA_engine.recommendation,
  syncStatus: 'synced',
};

const caseA_tier = getRecordTier(caseA_record);
const caseA_t0Stat = getRecordT0Status(caseA_record);
const caseA_badge = getBadgeText(caseA_tier, caseA_t0Stat);

assert(caseA_tier === 'T2', `Case A Hospital tier is T2 (got ${caseA_tier})`);
assert(caseA_t0Stat === undefined, `Case A Hospital t0Status is undefined (got ${caseA_t0Stat})`);
assert(caseA_badge === 'T2 · MODERATE RISK', `Case A Badge displays "T2 · MODERATE RISK" and NOT T0-CONFIRMED (got "${caseA_badge}")`);
assert(caseA_badge !== 'T0-CONFIRMED', `Case A Badge is definitely NOT T0-CONFIRMED`);

// ----------------------------------------------------
// CASE B: Assessment -> T1 (Expected T1, NEVER T0-CONFIRMED)
// ----------------------------------------------------
console.log('\n--- TEST CASE B: Assessment -> T1 ---');
const caseB_engine = calculateIntegratedTriage(11, false, 3, 3, false);
assert(caseB_engine.tier === 'T1', `Case B engine tier is T1 (got ${caseB_engine.tier})`);
assert(caseB_engine.totalIntegratedScore === 17, `Case B total score is 17/37 (got ${caseB_engine.totalIntegratedScore})`);

const caseB_record: AssessmentRecord = {
  id: 'TEST-B',
  timestamp: '10:15',
  location: 'Posko A',
  method: 'VERBAL',
  zone: caseB_engine.zone,
  triageTier: caseB_engine.tier,
  t0Status: undefined,
  score: caseB_engine.srqScore,
  indicators: ['Sering sakit kepala', 'Tidur tidak nyenyak', 'Merasa cemas & tegang'],
  criticalTriggered: false,
  recommendedAction: caseB_engine.recommendation,
  syncStatus: 'synced',
};

const caseB_tier = getRecordTier(caseB_record);
const caseB_t0Stat = getRecordT0Status(caseB_record);
const caseB_badge = getBadgeText(caseB_tier, caseB_t0Stat);

assert(caseB_tier === 'T1', `Case B Hospital tier is T1 (got ${caseB_tier})`);
assert(caseB_t0Stat === undefined, `Case B Hospital t0Status is undefined (got ${caseB_t0Stat})`);
assert(caseB_badge === 'T1 · HIGH RISK', `Case B Badge displays "T1 · HIGH RISK" (got "${caseB_badge}")`);
assert(caseB_badge !== 'T0-CONFIRMED', `Case B Badge is definitely NOT T0-CONFIRMED`);

// ----------------------------------------------------
// CASE C: Assessment -> T3 (Expected T3, NEVER T0-CONFIRMED)
// ----------------------------------------------------
console.log('\n--- TEST CASE C: Assessment -> T3 ---');
const caseC_engine = calculateIntegratedTriage(2, false, 1, 0, false);
assert(caseC_engine.tier === 'T3', `Case C engine tier is T3 (got ${caseC_engine.tier})`);
assert(caseC_engine.totalIntegratedScore === 3, `Case C total score is 3/37 (got ${caseC_engine.totalIntegratedScore})`);

const caseC_record: AssessmentRecord = {
  id: 'TEST-C',
  timestamp: '10:30',
  location: 'Posko A',
  method: 'CHECKLIST',
  zone: caseC_engine.zone,
  triageTier: caseC_engine.tier,
  t0Status: undefined,
  score: caseC_engine.srqScore,
  indicators: ['Sulit tidur pada malam hari'],
  criticalTriggered: false,
  recommendedAction: caseC_engine.recommendation,
  syncStatus: 'synced',
};

const caseC_tier = getRecordTier(caseC_record);
const caseC_t0Stat = getRecordT0Status(caseC_record);
const caseC_badge = getBadgeText(caseC_tier, caseC_t0Stat);

assert(caseC_tier === 'T3', `Case C Hospital tier is T3 (got ${caseC_tier})`);
assert(caseC_t0Stat === undefined, `Case C Hospital t0Status is undefined (got ${caseC_t0Stat})`);
assert(caseC_badge === 'T3 · LOW RISK', `Case C Badge displays "T3 · LOW RISK" (got "${caseC_badge}")`);
assert(caseC_badge !== 'T0-CONFIRMED', `Case C Badge is definitely NOT T0-CONFIRMED`);

// ----------------------------------------------------
// CASE D: Red Flag triggered -> Expected T0-SUSPECT
// ----------------------------------------------------
console.log('\n--- TEST CASE D: Red Flag Triggered -> T0-SUSPECT ---');
// Subcase D1: SRQ-20 Item #17 = "Ya"
const caseD1_engine = calculateIntegratedTriage(1, true, 0, 0, false);
assert(caseD1_engine.tier === 'T0', `Case D1 engine overrides to T0 (got ${caseD1_engine.tier})`);
assert(caseD1_engine.emergencyStatus === 'T0-Suspect', `Case D1 emergencyStatus is T0-Suspect`);

// Subcase D2: Floating Emergency Button manual override
const caseD2_engine = calculateIntegratedTriage(0, false, 0, 0, true);
assert(caseD2_engine.tier === 'T0', `Case D2 floating button overrides to T0 (got ${caseD2_engine.tier})`);

const caseD2_record: AssessmentRecord = {
  id: 'TEST-D2',
  timestamp: '11:00',
  location: 'Posko C',
  method: 'VERBAL',
  zone: 'RED',
  triageTier: 'T0',
  t0Status: 'T0-Suspect',
  score: 1,
  indicators: ['Floating Red Flag: Ancaman melukai diri akut'],
  criticalTriggered: true,
  recommendedAction: 'Emergency referral',
  syncStatus: 'synced',
};

const caseD_tier = getRecordTier(caseD2_record);
const caseD_t0Stat = getRecordT0Status(caseD2_record);
const caseD_badge = getBadgeText(caseD_tier, caseD_t0Stat);

assert(caseD_tier === 'T0', `Case D Hospital tier is T0`);
assert(caseD_t0Stat === 'T0-Suspect', `Case D Hospital t0Status is "T0-Suspect" (got "${caseD_t0Stat}")`);
assert(caseD_badge === 'T0-SUSPECT', `Case D Badge displays "T0-SUSPECT" (got "${caseD_badge}")`);

// ----------------------------------------------------
// CASE E: T0-SUSPECT + Healthcare confirms -> T0-CONFIRMED
// ----------------------------------------------------
console.log('\n--- TEST CASE E: Healthcare Confirms Emergency -> T0-CONFIRMED ---');
const patientStatusesCaseE: Record<string, { t0Status?: T0EmergencyStatus; downgradedTier?: 'T1' | 'T2' }> = {
  'TEST-D2': {
    t0Status: 'T0-Confirmed',
  },
};

const caseE_tier = getRecordTier(caseD2_record, patientStatusesCaseE);
const caseE_t0Stat = getRecordT0Status(caseD2_record, patientStatusesCaseE);
const caseE_badge = getBadgeText(caseE_tier, caseE_t0Stat);

assert(caseE_tier === 'T0', `Case E tier remains T0 (got ${caseE_tier})`);
assert(caseE_t0Stat === 'T0-Confirmed', `Case E t0Status is "T0-Confirmed" (got "${caseE_t0Stat}")`);
assert(caseE_badge === 'T0-CONFIRMED', `Case E Badge displays "T0-CONFIRMED" (got "${caseE_badge}")`);

// ----------------------------------------------------
// CASE F: T0-SUSPECT + Healthcare downgrades -> T1 or T2
// ----------------------------------------------------
console.log('\n--- TEST CASE F: Healthcare Downgrades -> T1 / T2 ---');
// Subcase F1: Downgrade to T1
const patientStatusesCaseF1: Record<string, { t0Status?: T0EmergencyStatus; downgradedTier?: 'T1' | 'T2' }> = {
  'TEST-D2': {
    t0Status: 'Downgraded',
    downgradedTier: 'T1',
  },
};

const caseF1_tier = getRecordTier(caseD2_record, patientStatusesCaseF1);
const caseF1_t0Stat = getRecordT0Status(caseD2_record, patientStatusesCaseF1);
const caseF1_badge = getBadgeText(caseF1_tier, caseF1_t0Stat);

assert(caseF1_tier === 'T1', `Case F1 downgraded tier is T1 (got ${caseF1_tier})`);
assert(caseF1_t0Stat === 'Downgraded', `Case F1 t0Status is "Downgraded" (got "${caseF1_t0Stat}")`);
assert(caseF1_badge.includes('T1 · HIGH RISK') && caseF1_badge.includes('DOWNGRADED'), `Case F1 badge shows T1 with DOWNGRADED tag`);

// Subcase F2: Downgrade to T2
const patientStatusesCaseF2: Record<string, { t0Status?: T0EmergencyStatus; downgradedTier?: 'T1' | 'T2' }> = {
  'TEST-D2': {
    t0Status: 'Downgraded',
    downgradedTier: 'T2',
  },
};

const caseF2_tier = getRecordTier(caseD2_record, patientStatusesCaseF2);
const caseF2_t0Stat = getRecordT0Status(caseD2_record, patientStatusesCaseF2);
const caseF2_badge = getBadgeText(caseF2_tier, caseF2_t0Stat);

assert(caseF2_tier === 'T2', `Case F2 downgraded tier is T2 (got ${caseF2_tier})`);
assert(caseF2_t0Stat === 'Downgraded', `Case F2 t0Status is "Downgraded" (got "${caseF2_t0Stat}")`);
assert(caseF2_badge.includes('T2 · MODERATE RISK') && caseF2_badge.includes('DOWNGRADED'), `Case F2 badge shows T2 with DOWNGRADED tag`);

// ----------------------------------------------------
// MOCK DATA AUDIT
// ----------------------------------------------------
console.log('\n--- MOCK DATA INTEGRITY AUDIT ---');
assert(INITIAL_ASSESSMENTS.length === 6, `INITIAL_ASSESSMENTS contains 6 clean representative records (got ${INITIAL_ASSESSMENTS.length})`);

const mockRatna = INITIAL_ASSESSMENTS.find((r) => r.victimName === 'Ratna Sari')!;
assert(mockRatna.triageTier === 'T1', `Ratna Sari is T1`);
assert(mockRatna.t0Status === undefined, `Ratna Sari t0Status is undefined`);
assert(getBadgeText(getRecordTier(mockRatna), getRecordT0Status(mockRatna)) === 'T1 · HIGH RISK', `Ratna Sari renders T1 · HIGH RISK`);

const mockDewi = INITIAL_ASSESSMENTS.find((r) => r.victimName === 'Dewi Sartika')!;
assert(mockDewi.triageTier === 'T2', `Dewi Sartika is T2`);
assert(mockDewi.t0Status === undefined, `Dewi Sartika t0Status is undefined`);
assert(getBadgeText(getRecordTier(mockDewi), getRecordT0Status(mockDewi)) === 'T2 · MODERATE RISK', `Dewi Sartika renders T2 · MODERATE RISK`);

const mockAhmad = INITIAL_ASSESSMENTS.find((r) => r.victimName === 'Ahmad Fauzi')!;
assert(mockAhmad.triageTier === 'T3', `Ahmad Fauzi is T3`);
assert(mockAhmad.t0Status === undefined, `Ahmad Fauzi t0Status is undefined`);
assert(getBadgeText(getRecordTier(mockAhmad), getRecordT0Status(mockAhmad)) === 'T3 · LOW RISK', `Ahmad Fauzi renders T3 · LOW RISK`);

const mockSlamet = INITIAL_ASSESSMENTS.find((r) => r.victimName === 'Slamet Raharjo')!;
assert(mockSlamet.triageTier === 'T0', `Slamet Raharjo is T0`);
assert(mockSlamet.t0Status === 'T0-Suspect', `Slamet Raharjo t0Status is T0-Suspect`);
assert(getBadgeText(getRecordTier(mockSlamet), getRecordT0Status(mockSlamet)) === 'T0-SUSPECT', `Slamet Raharjo renders T0-SUSPECT`);

const mockBambang = INITIAL_ASSESSMENTS.find((r) => r.victimName === 'Bambang Wijaya')!;
assert(mockBambang.triageTier === 'T0', `Bambang Wijaya is T0`);
assert(mockBambang.t0Status === 'T0-Confirmed', `Bambang Wijaya t0Status is T0-Confirmed`);
assert(getBadgeText(getRecordTier(mockBambang), getRecordT0Status(mockBambang)) === 'T0-CONFIRMED', `Bambang Wijaya renders T0-CONFIRMED`);

const mockNurul = INITIAL_ASSESSMENTS.find((r) => r.victimName === 'Nurul Hidayah')!;
assert(mockNurul.triageTier === 'T2', `Nurul Hidayah is T2`);
assert(mockNurul.t0Status === 'Downgraded', `Nurul Hidayah t0Status is Downgraded`);
assert(getBadgeText(getRecordTier(mockNurul), getRecordT0Status(mockNurul)).includes('DOWNGRADED'), `Nurul Hidayah renders DOWNGRADED`);

console.log('\n====================================================');
console.log('ALL VERIFICATION ASSERTIONS PASSED (100% SUCCESS)');
console.log('====================================================\n');
