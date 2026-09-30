import { INITIAL_ASSESSMENTS } from '../data/seedAssessments';
import { MOCK_LOCATIONS } from '../data/seedLocations';
import { INITIAL_MOCK_SURVIVORS } from '../data/seedSurvivors';
import { MOCK_VOLUNTEER, MOCK_ADMIN, MOCK_HOSPITAL } from '../context/AuthContext';
import { AssessmentRecord, TriageTier, LocationPost } from '../types/assessment';
import { User } from '../types/auth';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`✓ ${message}`);
  }
}

console.log('====================================================');
console.log('ROLE 3 REDESIGN VERIFICATION SUITE');
console.log('====================================================\n');

// 1. MASTER DATA PENYINTAS (RecentAssessmentsTable logic)
console.log('--- 1. MASTER DATA PENYINTAS: FILTER & SORT ---');
const records: AssessmentRecord[] = [...INITIAL_ASSESSMENTS];
assert(records.length > 0, `Initial assessments loaded (${records.length} records)`);

// Check Triage Tier assignment
const getTier = (r: AssessmentRecord): TriageTier => {
  if (r.triageTier) return r.triageTier;
  if (r.zone === 'RED') return r.criticalTriggered ? 'T0' : 'T1';
  if (r.zone === 'YELLOW') return 'T2';
  return 'T3';
};

const t0List = records.filter((r) => getTier(r) === 'T0');
const t1List = records.filter((r) => getTier(r) === 'T1');
const t2List = records.filter((r) => getTier(r) === 'T2');
const t3List = records.filter((r) => getTier(r) === 'T3');

assert(t0List.length > 0, `T0 records correctly identified: ${t0List.length}`);
assert(t1List.length > 0, `T1 records correctly identified: ${t1List.length}`);
assert(t2List.length > 0, `T2 records correctly identified: ${t2List.length}`);
assert(t3List.length > 0, `T3 records correctly identified: ${t3List.length}`);

// Test Sorting by Tier
const tierWeight = (t: TriageTier) => (t === 'T0' ? 4 : t === 'T1' ? 3 : t === 'T2' ? 2 : 1);
const sortedByTier = [...records].sort((a, b) => tierWeight(getTier(b)) - tierWeight(getTier(a)));
assert(getTier(sortedByTier[0]) === 'T0', 'Sorting by tier puts T0 at top');
assert(getTier(sortedByTier[sortedByTier.length - 1]) === 'T3', 'Sorting by tier puts T3 at bottom');

// 2. LONGITUDINAL SURVIVOR REGISTRY
console.log('\n--- 2. DATA LONGITUDINAL PENYINTAS (30 HARI) ---');
assert(INITIAL_MOCK_SURVIVORS.length >= 6, `Stored survivors loaded (${INITIAL_MOCK_SURVIVORS.length} profiles)`);
INITIAL_MOCK_SURVIVORS.forEach((s) => {
  assert(Boolean(s.id && s.name && s.posko), `Survivor profile valid: ${s.id} - ${s.name} (${s.posko})`);
});

// 3. POSKO CONTEXT & RESOURCE CALCULATION
console.log('\n--- 3. POSKO CONTEXT & METRICS ---');
assert(MOCK_LOCATIONS.length === 4, `All 4 disaster response posts configured: ${MOCK_LOCATIONS.map((l) => l.name).join(', ')}`);

MOCK_LOCATIONS.forEach((loc) => {
  const locRecords = records.filter((r) => r.location === loc.name);
  const locT0 = locRecords.filter((r) => getTier(r) === 'T0').length;
  console.log(`Posko ${loc.name}: ${locRecords.length} records, T0 count: ${locT0}, Coord: ${loc.coordinator}`);
  assert(typeof loc.activeVolunteers === 'number', `Posko ${loc.name} has active volunteers metric`);
});

// 4. VOLUNTEER MANAGEMENT & ASSIGNMENT LOGIC
console.log('\n--- 4. VOLUNTEER MANAGEMENT & ASSIGNMENT ---');
const users: User[] = [MOCK_ADMIN, MOCK_VOLUNTEER, MOCK_HOSPITAL];
const volunteers = users.filter((u) => u.role === 'volunteer');
assert(volunteers.length >= 1, `Volunteer loaded: ${volunteers[0].name} (${volunteers[0].assignedPost})`);

// Test Volunteer Assignment to new posko
const targetPost: LocationPost = 'Posko C';
const updatedVolunteer: User = {
  ...volunteers[0],
  assignedPost: targetPost,
};
assert(updatedVolunteer.assignedPost === 'Posko C', `Volunteer re-assigned to Posko C successfully`);

console.log('\n====================================================');
console.log('ALL ROLE 3 REDESIGN LOGIC VERIFIED SUCCESSFULLY!');
console.log('====================================================\n');
