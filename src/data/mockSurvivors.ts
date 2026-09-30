import { SurvivorProfile } from '../types/assessment';
import { patientService } from '../services/patientService';
import {
  idbSaveSurvivor,
  idbBulkSaveSurvivors,
  idbGetSurvivors,
} from '../services/indexedDbService';

/**
 * Standard Demo / Mock Survivors Registry representing the complete RAPID-MIND workflow:
 * - Normal T1 (Ratna Sari)
 * - Normal T2 (Dewi Sartika)
 * - Normal T3 (Ahmad Fauzi)
 * - T0-SUSPECT (Slamet Raharjo)
 * - T0-CONFIRMED (Bambang Wijaya)
 * - DOWNGRADED (Nurul Hidayah)
 */
export const INITIAL_MOCK_SURVIVORS: SurvivorProfile[] = [
  {
    id: 'RM-2026-000001',
    nik: '3578012345670001',
    poskoId: 'POS-A-01',
    name: 'Ratna Sari',
    age: 34,
    gender: 'P',
    category: 'Dewasa',
    posko: 'Posko A',
    registeredAt: '2026-09-28 08:30',
    currentPhase: 'followup_srq20',
    srq20Score: 11,
    triageTier: 'T1',
    t0Status: undefined,
    notes: 'Mengeluhkan pusing dan cemas berulang sejak gempa.',
  },
  {
    id: 'RM-2026-000002',
    nik: '3578012345670002',
    poskoId: 'POS-B-04',
    name: 'Dewi Sartika',
    age: 28,
    gender: 'P',
    category: 'Dewasa',
    posko: 'Posko B',
    registeredAt: '2026-09-28 09:00',
    currentPhase: 'followup_srq20',
    srq20Score: 6,
    triageTier: 'T2',
    t0Status: undefined,
    notes: 'Kaget terhadap suara gemuruh susulan. Membantu di dapur posko.',
  },
  {
    id: 'RM-2026-000003',
    nik: '3578012345670003',
    poskoId: 'POS-A-12',
    name: 'Ahmad Fauzi',
    age: 45,
    gender: 'L',
    category: 'Dewasa',
    posko: 'Posko A',
    registeredAt: '2026-09-28 09:20',
    currentPhase: 'followup_srq20',
    srq20Score: 2,
    triageTier: 'T3',
    t0Status: undefined,
    notes: 'Kondisi stabil, berpartisipasi aktif dalam gotong royong tenda.',
  },
  {
    id: 'RM-2026-000004',
    nik: '3578012345670004',
    poskoId: 'POS-C-02',
    name: 'Slamet Raharjo',
    age: 52,
    gender: 'L',
    category: 'Dewasa',
    posko: 'Posko C',
    registeredAt: '2026-09-28 09:50',
    currentPhase: 'followup_srq20',
    srq20Score: 14,
    triageTier: 'T0',
    t0Status: 'T0-Suspect',
    notes: 'Red flag Butir #17 aktif. Perlu pendampingan ketat dan validasi dokter.',
  },
  {
    id: 'RM-2026-000005',
    nik: '3578012345670005',
    poskoId: 'POS-B-01',
    name: 'Bambang Wijaya',
    age: 39,
    gender: 'L',
    category: 'Dewasa',
    posko: 'Posko B',
    registeredAt: '2026-09-28 07:15',
    currentPhase: 'acute_pfa',
    srq20Score: 16,
    triageTier: 'T0',
    t0Status: 'T0-Confirmed',
    notes: 'T0-Confirmed rujukan darurat. PSC 119 dan bed IGD disiapkan.',
  },
  {
    id: 'RM-2026-000006',
    nik: '3578012345670006',
    poskoId: 'POS-D-08',
    name: 'Nurul Hidayah',
    age: 24,
    gender: 'P',
    category: 'Dewasa',
    posko: 'Posko D',
    registeredAt: '2026-09-28 08:00',
    currentPhase: 'followup_srq20',
    srq20Score: 7,
    triageTier: 'T2',
    t0Status: 'Downgraded',
    notes: 'Diturunkan status dari T0 ke T2 setelah Tele-Emergency dengan nakes.',
  },
];

const STORAGE_KEY_SURVIVORS = 'rapidmind_survivor_registry_clean_v1';

export function getStoredSurvivors(): SurvivorProfile[] {
  if (typeof window === 'undefined') return INITIAL_MOCK_SURVIVORS;
  const raw = localStorage.getItem(STORAGE_KEY_SURVIVORS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY_SURVIVORS, JSON.stringify(INITIAL_MOCK_SURVIVORS));
    return INITIAL_MOCK_SURVIVORS;
  }
  try {
    const list: SurvivorProfile[] = JSON.parse(raw);
    if (list.length === 0 && INITIAL_MOCK_SURVIVORS.length > 0) {
      localStorage.setItem(STORAGE_KEY_SURVIVORS, JSON.stringify(INITIAL_MOCK_SURVIVORS));
      return INITIAL_MOCK_SURVIVORS;
    }
    return list;
  } catch {
    return INITIAL_MOCK_SURVIVORS;
  }
}

/**
 * Generate standard Unique Survivor ID / Patient ID internal.
 * Format: RM-YYYY-XXXXXX (e.g. RM-2026-000001)
 */
export function generateSurvivorId(): string {
  const current = getStoredSurvivors();
  const year = new Date().getFullYear();
  let maxSeq = 0;

  current.forEach((s) => {
    const rmMatch = s.id?.match(/RM-\d{4}-(\d+)/);
    if (rmMatch) {
      const num = parseInt(rmMatch[1], 10);
      if (num > maxSeq) maxSeq = num;
    } else {
      const vctMatch = s.id?.match(/VCT-(\d+)/);
      if (vctMatch) {
        const num = parseInt(vctMatch[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    }
  });

  const nextSeq = maxSeq + 1;
  return `RM-${year}-${String(nextSeq).padStart(6, '0')}`;
}

/**
 * Save or update a survivor record.
 * Uses internal Survivor ID as primary key.
 * Also matches by NIK if provided (and non-empty) to prevent duplicates.
 */
export function saveSurvivorToRegistry(survivor: SurvivorProfile): SurvivorProfile[] {
  const current = getStoredSurvivors();
  const trimmedNik = survivor.nik?.trim();

  const existingIndex = current.findIndex((s) => {
    // 1. Primary check: unique internal ID
    if (survivor.id && s.id === survivor.id) return true;
    // 2. Secondary check: non-empty NIK
    if (trimmedNik && s.nik && s.nik.trim().toLowerCase() === trimmedNik.toLowerCase()) return true;
    return false;
  });

  let updated: SurvivorProfile[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = {
      ...updated[existingIndex],
      ...survivor,
      // Retain existing NIK if the new object didn't specify one
      nik: trimmedNik || updated[existingIndex].nik,
    };
  } else {
    updated = [survivor, ...current];
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SURVIVORS, JSON.stringify(updated));
  }

  // Dual-Persistence: Asynchronous write to IndexedDB
  idbSaveSurvivor(survivor).catch((err) => {
    console.warn('IndexedDB survivor save failed:', err);
  });

  // Background sync to Supabase if configured
  // Background sync to Laravel API
  patientService.createSurvivor(survivor).catch((err) => {
    console.warn('Background Laravel survivor sync note:', err);
  });

  return updated;
}

/**
 * Update NIK on an existing survivor record identified by Survivor ID.
 * Does NOT create a duplicate record.
 */
export function updateSurvivorNik(id: string, newNik: string): SurvivorProfile | null {
  const current = getStoredSurvivors();
  const index = current.findIndex((s) => s.id === id);
  if (index < 0) return null;

  const updatedSurvivor: SurvivorProfile = {
    ...current[index],
    nik: newNik.trim(),
  };

  current[index] = updatedSurvivor;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SURVIVORS, JSON.stringify(current));
  }

  // Dual-Persistence: Asynchronous write to IndexedDB
  idbSaveSurvivor(updatedSurvivor).catch((err) => {
    console.warn('IndexedDB survivor update failed:', err);
  });

  // Background sync to Laravel API
  patientService.updateNik(id, newNik).catch((err) => {
    console.warn('Background Laravel NIK update note:', err);
  });

  return updatedSurvivor;
}

/**
 * Hydrates survivors from IndexedDB into memory/localStorage on application startup.
 */
export async function hydrateSurvivorsFromIndexedDB(): Promise<SurvivorProfile[]> {
  try {
    const idbList = await idbGetSurvivors();
    let current = getStoredSurvivors();

    if (idbList.length > 0) {
      const map = new Map<string, SurvivorProfile>();
      idbList.forEach((s) => map.set(s.id, s));
      current.forEach((s) => {
        if (!map.has(s.id)) {
          map.set(s.id, s);
        }
      });
      current = Array.from(map.values());
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_SURVIVORS, JSON.stringify(current));
      }
    } else if (current.length > 0) {
      // Seed initial mock records into IndexedDB
      idbBulkSaveSurvivors(current).catch(() => {});
    }

    return current;
  } catch (err) {
    console.warn('Hydration of survivors from IndexedDB failed:', err);
    return getStoredSurvivors();
  }
}

/**
 * Initial sync to pull survivors from Laravel backend on app start
 */
export async function syncSurvivorsWithSupabase(): Promise<SurvivorProfile[]> {
  try {
    const remote = await patientService.getSurvivors();
    if (!remote || remote.length === 0) return getStoredSurvivors();

    const local = getStoredSurvivors();
    const map = new Map<string, SurvivorProfile>();

    // Add remote first
    remote.forEach((s) => map.set(s.id, s));
    // Add local (can override or merge)
    local.forEach((s) => {
      if (!map.has(s.id)) {
        map.set(s.id, s);
        // Upload local survivor to Laravel backend in background
        patientService.createSurvivor(s).catch(() => {});
      }
    });

    const merged = Array.from(map.values());
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_SURVIVORS, JSON.stringify(merged));
    }
    return merged;
  } catch {
    return getStoredSurvivors();
  }
}

/**
 * Search all survivors matching query by NIK, Survivor ID, ID Posko / ID gelang, or Name.
 */
export function searchSurvivors(query: string): SurvivorProfile[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const list = getStoredSurvivors();

  return list.filter((s) => {
    const matchNik = Boolean(s.nik && s.nik.toLowerCase() === q);
    const matchId = Boolean(s.id && s.id.toLowerCase() === q);
    const matchPoskoId = Boolean(s.poskoId && s.poskoId.toLowerCase() === q);
    const matchExactName = Boolean(s.name && s.name.toLowerCase() === q);
    const matchPartialName = Boolean(s.name && s.name.toLowerCase().includes(q));
    return matchNik || matchId || matchPoskoId || matchExactName || matchPartialName;
  });
}

/**
 * Find single best matching survivor by query.
 */
export function findSurvivorByQuery(query: string): SurvivorProfile | null {
  const results = searchSurvivors(query);
  if (results.length === 0) return null;

  const q = query.trim().toLowerCase();
  // Exact ID match takes highest precedence
  const exactId = results.find((s) => s.id && s.id.toLowerCase() === q);
  if (exactId) return exactId;

  // Exact NIK match takes second precedence
  const exactNik = results.find((s) => s.nik && s.nik.toLowerCase() === q);
  if (exactNik) return exactNik;

  // Exact ID posko match
  const exactPosko = results.find((s) => s.poskoId && s.poskoId.toLowerCase() === q);
  if (exactPosko) return exactPosko;

  // Exact name match
  const exactName = results.find((s) => s.name && s.name.toLowerCase() === q);
  if (exactName) return exactName;

  return results[0];
}
