export type TriageZone = 'GREEN' | 'YELLOW' | 'RED';

export type AssessmentMethod = 'VERBAL' | 'CHECKLIST';

export type LocationPost = 'Posko A' | 'Posko B' | 'Posko C' | 'Posko D';

export type SyncStatus = 'synced' | 'pending';

export interface VictimData {
  id: string; // VCT-001
  name: string;
  age?: number | string;
  gender?: 'L' | 'P';
  category?: 'Anak' | 'Remaja' | 'Dewasa' | 'Lansia';
  familyContact?: string;
  initialCondition?: string;
  isAvailable: boolean;
}

export interface AssessmentRecord {
  id: string;
  timestamp: string; // ISO string or human formatted
  location: LocationPost;
  method: AssessmentMethod;
  zone: TriageZone;
  score: number;
  indicators: string[];
  criticalTriggered: boolean;
  transcript?: string;
  checklistSelections?: string[];
  recommendedAction: string;
  syncStatus: SyncStatus;
  volunteerNotes?: string;
  volunteerId?: string;
  // Enhanced victim data
  victimName?: string;
  victimAge?: number | string;
  victimGender?: 'L' | 'P';
  victimCategory?: 'Anak' | 'Remaja' | 'Dewasa' | 'Lansia';
  // Hospital referral tracking
  hospitalReferralStatus?: 'pending' | 'in_transit' | 'admitted' | 'discharged';
  hospitalNotes?: string;
  hospitalBed?: string;
}


export interface TriageAnalysisResult {
  zone: TriageZone;
  score: number;
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
  green: number;
  yellow: number;
  red: number;
  greenPct: number;
  yellowPct: number;
  redPct: number;
  pendingSync: number;
}
