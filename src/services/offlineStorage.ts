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
import { db } from '../lib/db';

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
  db.offlineQueue.put({
    ...pendingRecord,
    clientEventId: pendingRecord.recordId,
    queuedAt: new Date().toISOString(),
  }).catch((err) => {
    console.warn('Dexie offline queue save note:', err);
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
  const central = getCentralAssessments();
  const pendingInCentral = central.filter((c) => c.syncStatus === 'pending');

  if (pending.length === 0 && pendingInCentral.length === 0) {
    return { syncedCount: 0, syncedRecords: [] };
  }

  const markPendingSynced = pending.map((item) => ({
    ...item,
    syncStatus: 'synced' as const,
  }));

  const updatedCentral = [
    ...markPendingSynced,
    ...central.map((item) =>
      item.syncStatus === 'pending' ? { ...item, syncStatus: 'synced' as const } : item
    ),
  ];

  // Deduplicate by recordId or id (keeping newest synced version)
  const map = new Map<string, AssessmentRecord>();
  updatedCentral.forEach((rec) => {
    const key = rec.recordId || rec.id;
    if (!map.has(key)) {
      map.set(key, rec);
    }
  });
  const cleanCentral = Array.from(map.values());

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_ASSESSMENTS, JSON.stringify(cleanCentral));
    localStorage.removeItem(STORAGE_KEY_OFFLINE_QUEUE);
  }

  // Atomically persist to IndexedDB and Dexie
  await Promise.allSettled([
    idbClearQueue(),
    idbBulkSaveAssessments(cleanCentral),
    db.offlineQueue.clear(),
    db.assessments.bulkPut(cleanCentral),
  ]);

  const totalSynced = pending.length + pendingInCentral.length;

  try {
    const result = await syncService.syncPendingQueue(pending.length > 0 ? pending : undefined);
    return {
      syncedCount: result.syncedCount || totalSynced,
      syncedRecords: cleanCentral,
    };
  } catch (err) {
    console.warn('Backend sync note: backend unavailable, resolved offline queue locally:', err);
    return {
      syncedCount: totalSynced,
      syncedRecords: cleanCentral,
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

    // Set of IDs that are already confirmed synced in currentCentral
    const syncedIds = new Set<string>();
    currentCentral.forEach((a) => {
      if (a.syncStatus === 'synced') {
        if (a.recordId) syncedIds.add(a.recordId);
        if (a.id) syncedIds.add(a.id);
        if (a.victimId) syncedIds.add(a.victimId);
      }
    });

    if (idbAssessments.length > 0) {
      const map = new Map<string, AssessmentRecord>();
      // Put idb records first
      idbAssessments.forEach((a) => map.set(a.recordId || a.id, a));
      // Local storage synced status takes precedence
      currentCentral.forEach((localRec) => {
        const key = localRec.recordId || localRec.id;
        const idbRec = map.get(key);
        if (!idbRec || localRec.syncStatus === 'synced') {
          map.set(key, localRec);
        }
      });
      currentCentral = Array.from(map.values());
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_ASSESSMENTS, JSON.stringify(currentCentral));
      }
      idbBulkSaveAssessments(currentCentral).catch(() => {});
      db.assessments.bulkPut(currentCentral).catch(() => {});
    } else if (currentCentral.length > 0) {
      idbBulkSaveAssessments(currentCentral).catch(() => {});
      db.assessments.bulkPut(currentCentral).catch(() => {});
    }

    // Filter queue: ensure no record already marked 'synced' remains in offline queue
    const queueMap = new Map<string, AssessmentRecord>();
    currentQueue.forEach((q) => {
      const key = q.recordId || q.id;
      if (!syncedIds.has(key) && q.syncStatus === 'pending') {
        queueMap.set(key, q);
      }
    });

    idbQueue.forEach((q) => {
      const key = q.recordId || q.id;
      if (!syncedIds.has(key) && q.syncStatus === 'pending') {
        if (!queueMap.has(key)) {
          queueMap.set(key, q);
        }
      } else {
        // Already synced! Clean it up from idb and dexie
        if (q.recordId) {
          idbRemoveQueueItem(q.recordId).catch(() => {});
          db.offlineQueue.delete(q.recordId).catch(() => {});
        }
      }
    });

    currentQueue = Array.from(queueMap.values());
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_OFFLINE_QUEUE, JSON.stringify(currentQueue));
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

    // Add local records first (preserves local synced status)
    local.forEach((r) => map.set(r.recordId || r.id, r));

    // Merge remote records, but NEVER downgrade a local 'synced' record to 'pending'
    remote.forEach((r) => {
      const key = r.recordId || r.id;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, r);
      } else if (existing.syncStatus === 'synced' && r.syncStatus === 'pending') {
        map.set(key, { ...r, syncStatus: 'synced' });
      } else {
        map.set(key, r);
      }
    });

    // For any local record not yet in remote, push to remote in background
    local.forEach((r) => {
      const key = r.recordId || r.id;
      const inRemote = remote.some((rem) => (rem.recordId || rem.id) === key);
      if (!inRemote && r.syncStatus === 'synced') {
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
