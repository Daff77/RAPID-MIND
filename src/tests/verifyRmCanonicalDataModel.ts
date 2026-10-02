import { INITIAL_ASSESSMENTS } from '../data/seedAssessments';
import { getCentralAssessments } from '../services/offlineStorage';

console.log('====================================================');
console.log('VERIFY CANONICAL RM & SURVIVOR DATA MODEL');
console.log('====================================================');

function check(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Test 1: Check INITIAL_ASSESSMENTS
console.log('\n--- 1. INITIAL ASSESSMENT RECORDS AUDIT ---');
check(INITIAL_ASSESSMENTS.length >= 10, 'Must have at least 10 seed assessments');

for (const a of INITIAL_ASSESSMENTS) {
  check(Boolean(a.recordId && a.recordId.startsWith('RM-')), `Assessment recordId must start with RM-, got: ${a.recordId}`);
  check(Boolean(a.rmCode && a.rmCode.startsWith('RM-')), `Assessment rmCode must start with RM-, got: ${a.rmCode}`);
  check(Boolean(a.id && a.id.startsWith('RM-')), `Assessment id must start with RM-, got: ${a.id}`);
  check(!a.recordId?.includes('PB-'), `Assessment recordId must not contain PB-, got: ${a.recordId}`);
  check(!a.recordId?.includes('ASM-'), `Assessment recordId must not contain ASM-, got: ${a.recordId}`);
  check(Boolean(a.survivorId && a.survivorId.startsWith('SURV-')), `Survivor ID must start with SURV-, got: ${a.survivorId}`);
}
console.log(`✓ All ${INITIAL_ASSESSMENTS.length} seed assessments have canonical RM-2026-XXXXXX identifiers and distinct SURV- identities`);

// Test 2: Longitudinal History for Nando
console.log('\n--- 2. LONGITUDINAL HISTORY (1 SURVIVOR -> MULTIPLE RM ASSESSMENTS) ---');
const nandoRecords = INITIAL_ASSESSMENTS.filter((a) => a.victimName?.toLowerCase() === 'nando');
check(nandoRecords.length === 3, 'Survivor Nando must have exactly 3 longitudinal assessments');

const nandoSurvivorId = nandoRecords[0].survivorId;
const nandoNik = nandoRecords[0].nik;

check(nandoNik === '3578012345670089', 'Nando must have correct NIK');
check(Boolean(nandoSurvivorId && !nandoSurvivorId.startsWith('RM-')), 'Survivor ID must NOT be an RM code');

const nandoRms = nandoRecords.map((r) => r.recordId);
check(nandoRms.includes('RM-2026-000089'), 'Must contain RM-2026-000089 (T0-Suspect)');
check(nandoRms.includes('RM-2026-000142'), 'Must contain RM-2026-000142 (T1)');
check(nandoRms.includes('RM-2026-000231'), 'Must contain RM-2026-000231 (T2)');

for (const rec of nandoRecords) {
  check(rec.survivorId === nandoSurvivorId, 'All assessments must belong to the same survivorId');
  check(rec.nik === nandoNik, 'All assessments must have the same survivor NIK');
}
console.log('✓ Nando longitudinal history verified:');
console.log(`  Survivor: ${nandoRecords[0].victimName} (NIK: ${nandoNik}, ID: ${nandoSurvivorId})`);
nandoRecords.forEach((r) => {
  console.log(`    ├── ${r.recordId} (${r.triageTier}${r.t0Status ? ' - ' + r.t0Status : ''})`);
});

// Test 3: Central storage migration test
console.log('\n--- 3. CENTRAL STORAGE MIGRATION TEST ---');
// Mock localStorage
const mockStorage: Record<string, string> = {};
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, val: string) => {
      mockStorage[key] = val;
    },
  },
};
(globalThis as unknown as { localStorage: unknown }).localStorage = (globalThis as unknown as { window: { localStorage: unknown } }).window.localStorage;

// Simulate legacy record with PB- in localStorage
mockStorage['rapidmind_central_assessments_clean_v1'] = JSON.stringify([
  {
    recordId: 'PB-2026-000099',
    id: 'PB-2026-000099',
    victimId: 'PB-2026-000099',
    victimName: 'Legacy Person',
    nik: '3578012345670099',
    timestamp: '10:00',
    location: 'Posko A',
    method: 'VERBAL',
    zone: 'GREEN',
    triageTier: 'T3',
    score: 2,
    indicators: [],
    criticalTriggered: false,
    recommendedAction: 'Routine',
    syncStatus: 'synced',
  },
]);

const centralList = getCentralAssessments();
const migratedItem = centralList.find((r) => r.nik === '3578012345670099');
check(Boolean(migratedItem), 'Legacy item must be found after migration');
check(migratedItem?.recordId === 'RM-2026-000099', 'Legacy PB- recordId must be migrated to RM-');
check(migratedItem?.rmCode === 'RM-2026-000099', 'Legacy PB- rmCode must be set to RM-');
check(migratedItem?.id === 'RM-2026-000099', 'Legacy PB- id must be set to RM-');
check(Boolean(migratedItem?.survivorId && !migratedItem?.survivorId.startsWith('PB-')), 'survivorId must not have PB- prefix');

console.log('✓ Legacy PB assessment identifier successfully migrated to canonical RM in storage:');
console.log(`  Before: PB-2026-000099 -> After: ${migratedItem?.recordId}`);

// Test 4: Legacy ASM- migration test
console.log('\n--- 4. LEGACY ASM- IDENTIFIER MIGRATION TEST ---');
mockStorage['rapidmind_central_assessments_clean_v1'] = JSON.stringify([
  {
    recordId: 'ASM-2026-000001',
    id: 'ASM-2026-000001',
    victimId: 'SURV-2026-000001',
    victimName: 'daffa',
    nik: '3578012345670001',
    timestamp: '21:47',
    location: 'Posko A',
    method: 'VERBAL',
    zone: 'YELLOW',
    triageTier: 'T2',
    score: 8,
    indicators: ['Gelisah'],
    criticalTriggered: false,
    recommendedAction: 'PFA',
    syncStatus: 'synced',
  },
]);

const centralListAsm = getCentralAssessments();
const migratedAsmItem = centralListAsm.find((r) => r.nik === '3578012345670001');
check(Boolean(migratedAsmItem), 'Legacy ASM item must be found after migration');
check(migratedAsmItem?.recordId === 'RM-2026-000001', `Legacy ASM- recordId must be migrated to RM-2026-000001, got: ${migratedAsmItem?.recordId}`);
check(migratedAsmItem?.rmCode === 'RM-2026-000001', `Legacy ASM- rmCode must be set to RM-2026-000001, got: ${migratedAsmItem?.rmCode}`);
check(migratedAsmItem?.id === 'RM-2026-000001', `Legacy ASM- id must be set to RM-2026-000001, got: ${migratedAsmItem?.id}`);
check(!migratedAsmItem?.recordId?.includes('ASM-'), 'Migrated item must not contain ASM- in recordId');

console.log('✓ Legacy ASM assessment identifier successfully migrated to canonical RM in storage:');
console.log(`  Before: ASM-2026-000001 -> After: ${migratedAsmItem?.recordId}`);

console.log('\n====================================================');
console.log('ALL CANONICAL RM & SURVIVOR DATA MODEL TESTS PASSED!');
console.log('====================================================');

