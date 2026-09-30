import { apiClient } from '../lib/api';
import { AssessmentRecord, LocationPost, TriageTier } from '../types/assessment';
import { INITIAL_ASSESSMENTS } from '../data/seedAssessments';
import { db } from '../lib/db';

interface AssessmentFilters {
  tier?: TriageTier | 'ALL';
  location?: LocationPost | 'ALL';
  phase?: string | 'ALL';
  q?: string;
}

export const assessmentService = {
  /**
   * Fetch assessments from Laravel central server with Dexie/IndexedDB fallback.
   */
  async getAssessments(filters?: AssessmentFilters): Promise<AssessmentRecord[]> {
    try {
      const res = await apiClient.get<{ assessments: AssessmentRecord[] }>('/assessments', filters as any);
      if (res.assessments && res.assessments.length > 0) {
        db.assessments.bulkPut(res.assessments).catch(() => {});
        return res.assessments;
      }
    } catch {
      try {
        const local = await db.assessments.toArray();
        if (local.length > 0) return local;
      } catch {}
    }
    return INITIAL_ASSESSMENTS;
  },

  /**
   * Store new assessment record (Authoritative server-side triage).
   */
  async createAssessment(record: AssessmentRecord): Promise<{
    assessment: AssessmentRecord;
    isOffline: boolean;
  }> {
    try {
      const res = await apiClient.post<{
        success: boolean;
        assessment: AssessmentRecord;
        triage: any;
      }>('/assessments', {
        ...record,
        recordId: record.recordId,
        victimId: record.victimId || record.id,
      });

      const serverRecord: AssessmentRecord = {
        ...res.assessment,
        syncStatus: 'synced',
      };

      // Dual-persistence write to Dexie
      db.assessments.put(serverRecord).catch(() => {});

      return { assessment: serverRecord, isOffline: false };
    } catch {
      // Offline fallback: Queue locally in Dexie
      const offlineRecord: AssessmentRecord = {
        ...record,
        syncStatus: 'pending',
      };

      await db.offlineQueue.put({
        ...offlineRecord,
        clientEventId: record.recordId || `offline-${Date.now()}`,
        queuedAt: new Date().toISOString(),
      });

      await db.assessments.put(offlineRecord);

      return { assessment: offlineRecord, isOffline: true };
    }
  },

  /**
   * Get single assessment by ID.
   */
  async getAssessmentById(recordId: string): Promise<AssessmentRecord | null> {
    try {
      const res = await apiClient.get<{ assessment: AssessmentRecord }>(`/assessments/${recordId}`);
      return res.assessment;
    } catch {
      const found = INITIAL_ASSESSMENTS.find((a) => a.recordId === recordId || a.id === recordId);
      return found || null;
    }
  },
};
