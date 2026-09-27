import { supabase, isSupabaseConfigured } from './supabaseClient';
import { SurvivorProfile, AssessmentRecord } from '../types/assessment';

/**
 * Map SurvivorProfile to Supabase DB schema (snake_case)
 */
function toSupabaseSurvivor(s: SurvivorProfile) {
  return {
    id: s.id,
    nik: s.nik?.trim() || null,
    posko_id: s.poskoId || null,
    name: s.name,
    age: String(s.age),
    gender: s.gender,
    category: s.category,
    posko: s.posko,
    phone: s.phone || null,
    registered_at: s.registeredAt || new Date().toISOString(),
    current_phase: s.currentPhase || 'acute_pfa',
    pfa_record: s.pfaRecord || null,
    srq20_score: s.srq20Score ?? null,
    triage_tier: s.triageTier || 'T3',
    t0_status: s.t0Status || null,
    notes: s.notes || null,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Map Supabase DB row to SurvivorProfile (camelCase)
 */
function fromSupabaseSurvivor(row: any): SurvivorProfile {
  return {
    id: row.id,
    nik: row.nik || undefined,
    poskoId: row.posko_id || undefined,
    name: row.name,
    age: row.age,
    gender: row.gender,
    category: row.category,
    posko: row.posko,
    phone: row.phone || undefined,
    registeredAt: row.registered_at,
    currentPhase: row.current_phase,
    pfaRecord: row.pfa_record || undefined,
    srq20Score: row.srq20_score ?? undefined,
    triageTier: row.triage_tier,
    t0Status: row.t0_status || undefined,
    notes: row.notes || undefined,
  };
}

/**
 * Map AssessmentRecord to Supabase DB schema (snake_case)
 */
function toSupabaseAssessment(r: AssessmentRecord) {
  return {
    record_id: r.recordId || `ASM-${r.id}`,
    victim_id: r.victimId || r.id,
    nik: r.nik || null,
    timestamp: r.timestamp,
    location: r.location,
    method: r.method,
    phase: r.phase || 'acute_pfa',
    zone: r.zone,
    triage_tier: r.triageTier || 'T3',
    t0_status: r.t0Status || null,
    score: r.score || 0,
    indicators: r.indicators || [],
    critical_triggered: Boolean(r.criticalTriggered),
    transcript: r.transcript || null,
    checklist_selections: r.checklistSelections || [],
    srq20_yes_list: r.srq20YesList || [],
    functional_selections: r.functionalSelections || [],
    recommended_action: r.recommendedAction || '',
    sync_status: 'synced',
    volunteer_notes: r.volunteerNotes || null,
    volunteer_id: r.volunteerId || null,
    victim_name: r.victimName || null,
    victim_age: r.victimAge ? String(r.victimAge) : null,
    victim_gender: r.victimGender || null,
    victim_category: r.victimCategory || null,
    hospital_referral_status: r.hospitalReferralStatus || null,
    hospital_notes: r.hospitalNotes || null,
    hospital_bed: r.hospitalBed || null,
    tele_emergency_notes: r.teleEmergencyNotes || null,
    created_at: new Date().toISOString(),
  };
}

/**
 * Map Supabase DB row to AssessmentRecord (camelCase)
 */
function fromSupabaseAssessment(row: any): AssessmentRecord {
  return {
    recordId: row.record_id,
    id: row.victim_id,
    victimId: row.victim_id,
    nik: row.nik || undefined,
    timestamp: row.timestamp,
    location: row.location,
    method: row.method,
    phase: row.phase,
    zone: row.zone,
    triageTier: row.triage_tier,
    t0Status: row.t0_status || undefined,
    score: row.score,
    indicators: row.indicators || [],
    criticalTriggered: Boolean(row.critical_triggered),
    transcript: row.transcript || undefined,
    checklistSelections: row.checklist_selections || undefined,
    srq20YesList: row.srq20_yes_list || undefined,
    functionalSelections: row.functional_selections || undefined,
    recommendedAction: row.recommended_action,
    syncStatus: 'synced',
    volunteerNotes: row.volunteer_notes || undefined,
    volunteerId: row.volunteer_id || undefined,
    victimName: row.victim_name || undefined,
    victimAge: row.victim_age || undefined,
    victimGender: row.victim_gender || undefined,
    victimCategory: row.victim_category || undefined,
    hospitalReferralStatus: row.hospital_referral_status || undefined,
    hospitalNotes: row.hospital_notes || undefined,
    hospitalBed: row.hospital_bed || undefined,
    teleEmergencyNotes: row.tele_emergency_notes || undefined,
  };
}

// ----------------------------------------------------
// Public API for Data Operations
// ----------------------------------------------------

/**
 * Fetch all survivors from Supabase.
 */
export async function fetchSurvivorsFromSupabase(): Promise<SurvivorProfile[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('survivors')
      .select('*')
      .order('registered_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch survivors error:', error.message);
      return null;
    }
    return data ? data.map(fromSupabaseSurvivor) : [];
  } catch (err) {
    console.warn('Supabase connection failed:', err);
    return null;
  }
}

/**
 * Upsert a survivor into Supabase.
 */
export async function upsertSurvivorToSupabase(survivor: SurvivorProfile): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const payload = toSupabaseSurvivor(survivor);
    const { error } = await supabase
      .from('survivors')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase upsert survivor error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase upsert survivor failed:', err);
    return false;
  }
}

/**
 * Update NIK for existing survivor in Supabase.
 */
export async function updateSurvivorNikInSupabase(id: string, newNik: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase
      .from('survivors')
      .update({ nik: newNik.trim(), updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.warn('Supabase update NIK error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase update NIK failed:', err);
    return false;
  }
}

/**
 * Fetch all assessment records from Supabase.
 */
export async function fetchAssessmentsFromSupabase(): Promise<AssessmentRecord[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch assessments error:', error.message);
      return null;
    }
    return data ? data.map(fromSupabaseAssessment) : [];
  } catch (err) {
    console.warn('Supabase connection failed:', err);
    return null;
  }
}

/**
 * Upsert an assessment record into Supabase.
 */
export async function upsertAssessmentToSupabase(record: AssessmentRecord): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const payload = toSupabaseAssessment(record);
    const { error } = await supabase
      .from('assessments')
      .upsert(payload, { onConflict: 'record_id' });

    if (error) {
      console.warn('Supabase upsert assessment error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase upsert assessment failed:', err);
    return false;
  }
}
