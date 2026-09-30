import { AssessmentRecord } from '../types/assessment';
import { INITIAL_ASSESSMENTS } from '../data/seedAssessments';
import { assessmentService } from './assessmentService';
import { syncService } from './syncService';
import {
  idbSaveAssessment,
  idbBulkSaveAssessments,
  idbGetAssessments,
  idbSaveQueueItem,
  idbGetQueue,
  idbRemoveQueueItem,
  idbClearQueue,
} from './indexedDbService';

const STORAGE_KEY_ASSESSMENTS = 'rapidmind_central_assessments_clean_v1';
const STORAGE_KEY_OFFLINE_QUEUE = 'rapidmind_offline_pending_clean_v1';
const STORAGE_KEY_ONLINE_STATUS = 'rapidmind_is_online_clean_v1';

export function getOnlineStatus(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(STORAGE_KEY_ONLINE_STATUS);
  return stored === null ? true : stored === 'true';
}

export function setOnlineStatus(isOnline: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_ONLINE_STATUS, String(isOnline));
}

export function getCentralAssessments(): AssessmentRecord[] {
  if (typeof window === 'undefined') return INITIAL_ASSESSMENTS;
  const stored = localStorage.getItem(STORAGE_KEY_ASSESSMENTS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY_ASSESSMENTS, JSON.stringify(INITIAL_ASSESSMENTS));
    return INITIAL_ASSESSMENTS;
  }
  try {
    const list: AssessmentRecord[] = JSON.parse(stored);
    if (list.length === 0 && INITIAL_ASSESSMENTS.length > 0) {
      localStorage.setItem(STORAGE_KEY_ASSESSMENTS, JSON.stringify(INITIAL_ASSESSMENTS));
      return INITIAL_ASSESSMENTS;
    }
    let dirty = false;
    const year = new Date().getFullYear();
    const migrated = list.map((r, idx) => {
      let changed = false;
      const rec = { ...r };
      if (!rec.victimId) {
        rec.victimId = rec.id;
        changed = true;
      }
      if (!rec.recordId) {
        rec.recordId = `ASM-${year}-${String(idx + 1).padStart(6, '0')}`;
        changed = true;
      }
      // Sanitize: A non-T0 record without critical red flag must NEVER have t0Status = 'T0-Confirmed'
      if (rec.triageTier && rec.triageTier !== 'T0' && !rec.criticalTriggered && rec.t0Status === 'T0-Confirmed') {
        rec.t0Status = undefined;
        changed = true;
      }
      if (changed) dirty = true;
      return rec;
    });
    if (dirty) {
      localStorage.setItem(STORAGE_KEY_ASSESSMENTS, JSON.stringify(migrated));
    }
    return migrated;
  } catch (e) {
    console.error('Failed to parse central assessments from storage', e);
    return INITIAL_ASSESSMENTS;
  }
}

/**
 * Generate unique assessment record identifier (e.g. ASM-2026-000001).
 */
export function generateAssessmentRecordId(): string {
  const current = getCentralAssessments();
  const year = new Date().getFullYear();
  let maxSeq = 0;
  current.forEach((r) => {
    const match = (r.recordId || '').match(/ASM-\d{4}-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxSeq) maxSeq = num;
    }
  });
  return `ASM-${year}-${String(maxSeq + 1).padStart(6, '0')}`;
}

export function saveCentralAssessment(record: AssessmentRecord): AssessmentRecord[] {
  const current = getCentralAssessments();
  const recordId = record.recordId || generateAssessmentRecordId();
  const normalized: AssessmentRecord = {
    ...record,
    recordId,
    victimId: record.victimId || record.id,
    syncStatus: 'synced' as const,
  };

  const existingIdx = current.findIndex((r) => r.recordId === recordId);
  let updated: AssessmentRecord[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = normalized;
  } else {
    // Unshift so newest item appears first
    updated = [normalized, ...current];
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_ASSESSMENTS, JSON.stringify(updated));
  }

  // Dual-Persistence: Asynchronous write to IndexedDB
  idbSaveAssessment(normalized).catch((err) => {
    console.warn('IndexedDB assessment save failed:', err);
  });

  // Background sync to Laravel API
  assessmentService.createAssessment(normalized).catch((err) => {
    console.warn('Background Laravel assessment sync note:', err);
  });

  return updated;
}

export function getPendingAssessments(): AssessmentRecord[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY_OFFLINE_QUEUE);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse offline queue', e);
    return [];
  }
}

export function saveAssessmentLocally(record: AssessmentRecord): AssessmentRecord[] {
  const current = getPendingAssessments();
  const recordId = record.recordId || generateAssessmentRecordId();
  const pendingRecord: AssessmentRecord = {
    ...record,
    recordId,
    victimId: record.victimId || record.id,
    syncStatus: 'pending' as const,
  };

  const existingIdx = current.findIndex((r) => r.recordId === recordId);
  let updated: AssessmentRecord[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = pendingRecord;
  } else {
    updated = [pendingRecord, ...current];
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_OFFLINE_QUEUE, JSON.stringify(updated));
  }

  // Dual-Persistence: Asynchronous write to IndexedDB Offline Queue
  idbSaveQueueItem(pendingRecord).catch((err) => {
    console.warn('IndexedDB offline queue item save failed:', err);
  });

  return updated;
}

export function removeSyncedAssessment(id: string): void {
  const current = getPendingAssessments();
  const filtered = current.filter((item) => item.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_OFFLINE_QUEUE, JSON.stringify(filtered));
  }
  idbRemoveQueueItem(id).catch(() => {});
}

export async function syncPendingAssessments(): Promise<{
  syncedCount: number;
  syncedRecords: AssessmentRecord[];
}> {
  const pending = getPendingAssessments();
  if (pending.length === 0) {
    return { syncedCount: 0, syncedRecords: [] };
  }

  try {
    const result = await syncService.syncPendingQueue();
    const central = getCentralAssessments();
    const markSynced = pending.map((item) => ({
      ...item,
      syncStatus: 'synced' as const,
    }));

    const updatedCentral = [...markSynced, ...central];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ASSESSMENTS, JSON.stringify(updatedCentral));
      localStorage.removeItem(STORAGE_KEY_OFFLINE_QUEUE);
    }

    // Sync to IndexedDB: Clear queue & bulk save central assessments
    idbClearQueue().catch(() => {});
    idbBulkSaveAssessments(updatedCentral).catch(() => {});

    return {
      syncedCount: result.syncedCount || pending.length,
      syncedRecords: markSynced,
    };
  } catch {
    // If backend unreachable, keep pending queue intact
    return {
      syncedCount: 0,
      syncedRecords: [],
    };
  }
}

/**
 * Hydrates data from IndexedDB into memory/localStorage on application startup.
 * Ensures persistent, high-capacity client storage beyond the 5MB localStorage threshold.
 */
export async function hydrateFromIndexedDB(): Promise<{
  assessments: AssessmentRecord[];
  pending: AssessmentRecord[];
}> {
  try {
    const [idbAssessments, idbQueue] = await Promise.all([
      idbGetAssessments(),
      idbGetQueue(),
    ]);

    let currentCentral = getCentralAssessments();
    let currentQueue = getPendingAssessments();

    if (idbAssessments.length > 0) {
      const map = new Map<string, AssessmentRecord>();
      idbAssessments.forEach((a) => map.set(a.recordId || a.id, a));
      currentCentral.forEach((a) => {
        if (!map.has(a.recordId || a.id)) {
          map.set(a.recordId || a.id, a);
        }
      });
      currentCentral = Array.from(map.values());
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_ASSESSMENTS, JSON.stringify(currentCentral));
      }
    } else if (currentCentral.length > 0) {
      // Seed initial mock records into IndexedDB
      idbBulkSaveAssessments(currentCentral).catch(() => {});
    }

    if (idbQueue.length > 0) {
      const map = new Map<string, AssessmentRecord>();
      idbQueue.forEach((q) => map.set(q.recordId || q.id, q));
      currentQueue.forEach((q) => {
        if (!map.has(q.recordId || q.id)) {
          map.set(q.recordId || q.id, q);
        }
      });
      currentQueue = Array.from(map.values());
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_OFFLINE_QUEUE, JSON.stringify(currentQueue));
      }
    } else if (currentQueue.length > 0) {
      currentQueue.forEach((item) => idbSaveQueueItem(item).catch(() => {}));
    }

    return {
      assessments: currentCentral,
      pending: currentQueue,
    };
  } catch (err) {
    console.warn('Hydration from IndexedDB failed, using memory/localStorage fallback:', err);
    return {
      assessments: getCentralAssessments(),
      pending: getPendingAssessments(),
    };
  }
}

/**
 * Initial sync to pull assessments from Laravel backend on app start
 */
export async function syncAssessmentsWithSupabase(): Promise<AssessmentRecord[]> {
  try {
    const remote = await assessmentService.getAssessments();
    if (!remote || remote.length === 0) return getCentralAssessments();

    const local = getCentralAssessments();
    const map = new Map<string, AssessmentRecord>();

    // Add remote records
    remote.forEach((r) => map.set(r.recordId || r.id, r));
    // Add local records if not present in remote
    local.forEach((r) => {
      const key = r.recordId || r.id;
      if (!map.has(key)) {
        map.set(key, r);
        // Upload local to remote in background
        assessmentService.createAssessment(r).catch(() => {});
      }
    });

    const merged = Array.from(map.values());
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ASSESSMENTS, JSON.stringify(merged));
    }
    return merged;
  } catch {
    return getCentralAssessments();
  }
}
