import { SurvivorProfile } from '../types/assessment';
import {
  fetchSurvivorsFromSupabase,
  upsertSurvivorToSupabase,
  updateSurvivorNikInSupabase,
} from '../services/supabaseService';
import {
  idbSaveSurvivor,
  idbBulkSaveSurvivors,
  idbGetSurvivors,
} from '../services/indexedDbService';

/**
 * Initial empty survivor registry.
 * Starts clean with 0 survivors.
 */
export const INITIAL_MOCK_SURVIVORS: SurvivorProfile[] = [];

const STORAGE_KEY_SURVIVORS = 'rapidmind_survivor_registry_clean_v1';

export function getStoredSurvivors(): SurvivorProfile[] {
  if (typeof window === 'undefined') return INITIAL_MOCK_SURVIVORS;
  const raw = localStorage.getItem(STORAGE_KEY_SURVIVORS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY_SURVIVORS, JSON.stringify(INITIAL_MOCK_SURVIVORS));
    return INITIAL_MOCK_SURVIVORS;
  }
  try {
    return JSON.parse(raw);
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
  upsertSurvivorToSupabase(survivor).catch((err) => {
    console.warn('Background Supabase survivor upsert failed:', err);
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

  // Background sync to Supabase if configured
  updateSurvivorNikInSupabase(id, newNik).catch((err) => {
    console.warn('Background Supabase NIK update failed:', err);
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
 * Initial sync to pull survivors from Supabase on app start
 */
export async function syncSurvivorsWithSupabase(): Promise<SurvivorProfile[]> {
  const remote = await fetchSurvivorsFromSupabase();
  if (!remote || remote.length === 0) return getStoredSurvivors();

  const local = getStoredSurvivors();
  const map = new Map<string, SurvivorProfile>();

  // Add remote first
  remote.forEach((s) => map.set(s.id, s));
  // Add local (can override or merge)
  local.forEach((s) => {
    if (!map.has(s.id)) {
      map.set(s.id, s);
      // Upload local survivor to Supabase in background
      upsertSurvivorToSupabase(s).catch(() => {});
    }
  });

  const merged = Array.from(map.values());
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SURVIVORS, JSON.stringify(merged));
  }
  return merged;
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
