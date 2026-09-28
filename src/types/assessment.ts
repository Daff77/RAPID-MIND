export type TriageZone = 'GREEN' | 'YELLOW' | 'RED';

/**
 * Two-Tiered Triage Tiers according to RencanaBaru.md:
 * - T0: Emergency (Red Flag / Suisida / Psikosis / Agitasi Akut) -> PSC 119 & RS
 * - T1: High Risk (SRQ-20 >= 11) -> Rujukan Spesialis / Psikolog
 * - T2: Moderate Risk (SRQ-20 6-10) -> Pendampingan PFA Berlanjut / Coach
 * - T3: Low Risk (SRQ-20 0-5) -> Edukasi Kesehatan Jiwa & Komunitas
 */
export type TriageTier = 'T0' | 'T1' | 'T2' | 'T3';

export type T0EmergencyStatus = 'T0-Suspect' | 'T0-Confirmed' | 'Downgraded';

export type AssessmentPhase = 'acute_pfa' | 'followup_srq20';

export type AssessmentMethod = 'VERBAL' | 'CHECKLIST';

export type LocationPost = 'Posko A' | 'Posko B' | 'Posko C' | 'Posko D';

export type SyncStatus = 'synced' | 'pending';

export interface SRQ20Question {
  id: number;
  text: string;
  category: 'somatic' | 'anxiety' | 'depressive' | 'cognitive' | 'energy' | 'safety';
  scriptQuestion?: string; // Percakapan santai yang diucapkan relawan ke penyintas
  volunteerInstruction: string;
  keywords: string[];
  isRedFlag?: boolean;
}

export interface RiskFactorItem {
  id: string; // 'R1' | 'R2' | 'R3' | 'R4' | 'R5'
  code: string;
  title: string;
  category: string;
  points: number;
  description: string;
}

export interface FunctionalDomainOption {
  level: 'green' | 'yellow' | 'red';
  label: string;
  points: number;
  detail: string;
}

export interface FunctionalDomain {
  id: string; // 'F1' | 'F2' | 'F3'
  code: string;
  title: string;
  question: string;
  options: FunctionalDomainOption[];
}

export interface PFARecord {
  completedAt: string;
  lookItems: string[];
  listenNotes: string;
  groundingUsed?: boolean;
  linkItems: string[];
  safetyFlags?: string[];
}

export interface SurvivorProfile {
  nik?: string; // Opsional jika belum tersedia saat tanggap darurat
  id: string; // Unique Survivor ID / Patient ID internal (misal: RM-2026-000001)
  poskoId?: string; // ID Posko / ID gelang jika tersedia
  name: string;
  age: number | string;
  gender: 'L' | 'P';
  category: 'Anak' | 'Remaja' | 'Dewasa' | 'Lansia';
  posko: LocationPost;
  phone?: string;
  registeredAt: string;
  currentPhase: AssessmentPhase;
  pfaRecord?: PFARecord;
  srq20Score?: number;
  triageTier: TriageTier;
  t0Status?: T0EmergencyStatus;
  notes?: string;
}

export interface VictimData {
  id: string; // VCT-001
  nik?: string;
  name: string;
  age?: number | string;
  gender?: 'L' | 'P';
  category?: 'Anak' | 'Remaja' | 'Dewasa' | 'Lansia';
  familyContact?: string;
  initialCondition?: string;
  isAvailable: boolean;
}

export interface AssessmentRecord {
  recordId?: string; // Unique Assessment Log ID (e.g. ASM-2026-000001)
  id: string; // Identifier referensi penyintas (e.g. RM-2026-000001)
  victimId?: string; // Explicit Victim / Survivor ID alias (RM-2026-000001)
  nik?: string;
  timestamp: string; // ISO string or human formatted
  location: LocationPost;
  method: AssessmentMethod;
  phase?: AssessmentPhase;
  zone: TriageZone;
  triageTier?: TriageTier;
  t0Status?: T0EmergencyStatus;
  score: number;
  indicators: string[];
  criticalTriggered: boolean;
  transcript?: string;
  checklistSelections?: string[];
  srq20YesList?: number[];
  functionalSelections?: string[];
  riskFactorSelections?: string[]; // IDs like 'R1', 'R2'
  riskFactorScore?: number; // 0 - 8
  functionalScores?: Record<string, number>; // { F1: 0|1|3, F2: 0|1|3, F3: 0|1|3 }
  functionalScoreTotal?: number; // 0 - 9
  totalIntegratedScore?: number; // 0 - 37
  statusTitle?: string; // Recommendation for Priority Clinical Assessment, etc.
  recommendedAction: string;
  syncStatus: SyncStatus;
  volunteerNotes?: string;
  volunteerId?: string;
  // Enhanced victim data
  victimName?: string;
  victimAge?: number | string;
  victimGender?: 'L' | 'P';
  victimCategory?: 'Anak' | 'Remaja' | 'Dewasa' | 'Lansia';
  // Hospital & PSC 119 referral tracking
  hospitalReferralStatus?: 'pending' | 'in_transit' | 'admitted' | 'discharged';
  hospitalNotes?: string;
  hospitalBed?: string;
  teleEmergencyNotes?: string;
}

export interface TriageAnalysisResult {
  zone: TriageZone;
  triageTier: TriageTier;
  score: number; // SRQ-20 score (0-20)
  riskFactorScore?: number; // 0 - 8
  functionalScore?: number; // 0 - 9
  totalIntegratedScore?: number; // 0 - 37
  statusTitle?: string;
  indicators: string[];
  criticalTriggered: boolean;
  recommendedAction: string;
  explanation: string;
}

export interface LocationPostInfo {
  id: string;
  name: LocationPost;
  lat: number;
  lng: number;
  sector: string;
  coordinator: string;
  activeVolunteers: number;
  description: string;
}

export interface KPIStats {
  total: number;
  totalAssessments?: number;
  green: number;
  yellow: number;
  red: number;
  t0Count: number;
  t1Count: number;
  t2Count: number;
  t3Count: number;
  greenPct: number;
  yellowPct: number;
  redPct: number;
  pendingSync: number;
}

/**
 * Otomatis mengelompokkan kategori usia:
 * - < 12 th: Anak
 * - 12 - 18 th: Remaja
 * - 19 - 59 th: Dewasa
 * - >= 60 th: Lansia
 */
export function getCategoryFromAge(ageVal: string | number): 'Anak' | 'Remaja' | 'Dewasa' | 'Lansia' {
  const num = typeof ageVal === 'number' ? ageVal : parseInt(String(ageVal), 10);
  if (isNaN(num) || num < 0) return 'Dewasa';
  if (num < 12) return 'Anak';
  if (num <= 18) return 'Remaja';
  if (num < 60) return 'Dewasa';
  return 'Lansia';
}
