import { SurvivorProfile } from '../types/assessment';

/**
 * Initial empty survivor registry.
 * Starts clean with 0 survivors as per user request to delete all dummy data.
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

export function saveSurvivorToRegistry(survivor: SurvivorProfile): SurvivorProfile[] {
  const current = getStoredSurvivors();
  const existingIndex = current.findIndex(
    (s) => s.nik === survivor.nik || s.id === survivor.id
  );

  let updated: SurvivorProfile[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = { ...updated[existingIndex], ...survivor };
  } else {
    updated = [survivor, ...current];
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SURVIVORS, JSON.stringify(updated));
  }
  return updated;
}

export function findSurvivorByQuery(query: string): SurvivorProfile | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const list = getStoredSurvivors();
  return (
    list.find(
      (s) =>
        s.nik.toLowerCase() === q ||
        s.id.toLowerCase() === q ||
        s.name.toLowerCase().includes(q)
    ) || null
  );
}
