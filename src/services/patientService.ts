import { apiClient } from '../lib/api';
import { SurvivorProfile, LocationPost } from '../types/assessment';
import { INITIAL_MOCK_SURVIVORS } from '../data/seedSurvivors';
import { db } from '../lib/db';

export const patientService = {
  /**
   * Fetch all survivors, with Dexie/IndexedDB offline fallback.
   */
  async getSurvivors(posko?: LocationPost): Promise<SurvivorProfile[]> {
    try {
      const res = await apiClient.get<{ survivors: SurvivorProfile[] }>('/survivors', { posko });
      if (res.survivors && res.survivors.length > 0) {
        db.survivors.bulkPut(res.survivors).catch(() => {});
        return res.survivors;
      }
    } catch {
      try {
        const local = await db.survivors.toArray();
        if (local.length > 0) return local;
      } catch {}
    }
    return INITIAL_MOCK_SURVIVORS;
  },

  /**
   * Search survivors by name, ID, or NIK.
   */
  async searchSurvivors(query: string): Promise<SurvivorProfile[]> {
    try {
      const res = await apiClient.get<{ survivors: SurvivorProfile[] }>('/survivors/search', { q: query });
      return res.survivors;
    } catch {
      const q = query.toLowerCase();
      return INITIAL_MOCK_SURVIVORS.filter(
        (s: SurvivorProfile) =>
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          Boolean(s.nik && s.nik.includes(q))
      );
    }
  },

  /**
   * Get single survivor by ID.
   */
  async getSurvivorById(id: string): Promise<SurvivorProfile | null> {
    try {
      const res = await apiClient.get<{ survivor: SurvivorProfile }>(`/survivors/${id}`);
      return res.survivor;
    } catch {
      const local = INITIAL_MOCK_SURVIVORS.find((s: SurvivorProfile) => s.id === id);
      return local || null;
    }
  },

  /**
   * Register or update survivor profile.
   */
  async createSurvivor(profile: Partial<SurvivorProfile>): Promise<SurvivorProfile> {
    try {
      const res = await apiClient.post<{ survivor: SurvivorProfile }>('/survivors', profile);
      db.survivors.put(res.survivor).catch(() => {});
      return res.survivor;
    } catch {
      const localProfile: SurvivorProfile = {
        id: profile.id || `RM-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        name: profile.name || 'Penyintas Lapangan',
        age: profile.age || 30,
        gender: profile.gender || 'P',
        category: profile.category || 'Dewasa',
        posko: profile.posko || 'Posko A',
        registeredAt: new Date().toISOString(),
        currentPhase: profile.currentPhase || 'acute_pfa',
        triageTier: profile.triageTier || 'T3',
        nik: profile.nik,
        phone: profile.phone,
        notes: profile.notes,
      };
      await db.survivors.put(localProfile).catch(() => {});
      return localProfile;
    }
  },

  /**
   * Update survivor NIK.
   */
  async updateNik(id: string, nik: string): Promise<SurvivorProfile> {
    try {
      const res = await apiClient.patch<{ survivor: SurvivorProfile }>(`/survivors/${id}/nik`, { nik });
      return res.survivor;
    } catch {
      const found = INITIAL_MOCK_SURVIVORS.find((s: SurvivorProfile) => s.id === id);
      if (found) found.nik = nik;
      return found || ({} as SurvivorProfile);
    }
  },
};
