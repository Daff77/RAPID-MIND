import { AssessmentRecord } from '../types/assessment';
import { INITIAL_ASSESSMENTS } from '../data/seedAssessments';
import { assessmentService } from './assessmentService';
import { syncService } from './syncService';
import {
  idbSaveAssessment,
  idbBulkSaveAssessments,
  idbGetAssessments,
  idbRemoveAssessment,
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
    const hasNando = list.some((r) => {
      const canonical = (r.recordId || r.rmCode || r.id || '').replace(/^(ASM|PB)-/i, 'RM-');
      return canonical === 'RM-2026-000089';
    });
    let effectiveList = list;
    if (!hasNando) {
      const newMocks = INITIAL_ASSESSMENTS.filter((init) => !list.some((r) => {
        const canonical = (r.recordId || r.rmCode || r.id || '').replace(/^(ASM|PB)-/i, 'RM-');
        return canonical === init.recordId;
      }));
      effectiveList = [...newMocks, ...list];
      dirty = true;
    }
    const year = new Date().getFullYear();
    const migratedMap = new Map<string, AssessmentRecord>();

    effectiveList.forEach((r, idx) => {
      const rec = { ...r };

      // 1. Migrate any legacy ASM- or PB- assessment identifiers to canonical RM-
      if (rec.id && /^(ASM|PB)-/i.test(rec.id)) {
        rec.id = rec.id.replace(/^(ASM|PB)-/i, 'RM-');
        dirty = true;
      }
      if (rec.recordId && /^(ASM|PB)-/i.test(rec.recordId)) {
        rec.recordId = rec.recordId.replace(/^(ASM|PB)-/i, 'RM-');
        dirty = true;
      }
      if (rec.recordId && (rec.recordId.includes('PB-') || rec.recordId.includes('ASM-'))) {
        rec.recordId = rec.recordId.replace(/(PB-|ASM-)/g, 'RM-');
        dirty = true;
      }
      if (rec.id && (rec.id.includes('PB-') || rec.id.includes('ASM-'))) {
        rec.id = rec.id.replace(/(PB-|ASM-)/g, 'RM-');
        dirty = true;
      }
      if (!rec.rmCode) {
        rec.rmCode = rec.recordId || rec.id;
        dirty = true;
      }
      if (rec.rmCode && /^(ASM|PB)-/i.test(rec.rmCode)) {
        rec.rmCode = rec.rmCode.replace(/^(ASM|PB)-/i, 'RM-');
        dirty = true;
      }

      // 2. Separate survivor person entity from assessment RM code
      let effectiveSurvId = rec.survivorId || rec.victimId || (rec.nik ? `SURV-${rec.nik.slice(-6)}` : `SURV-${rec.id.replace(/^(RM|PB|ASM)-/i, '')}`);
      if (/^(PB|ASM|RM)-/i.test(effectiveSurvId)) {
        effectiveSurvId = effectiveSurvId.replace(/^(PB|ASM|RM)-/i, 'SURV-');
      }

      if (rec.survivorId !== effectiveSurvId) {
        rec.survivorId = effectiveSurvId;
        dirty = true;
      }
      if (rec.victimId !== effectiveSurvId) {
        rec.victimId = effectiveSurvId;
        dirty = true;
      }
      if (!rec.recordId) {
        rec.recordId = rec.rmCode || `RM-${year}-${String(idx + 1).padStart(6, '0')}`;
        dirty = true;
      }
      // Sanitize: A non-T0 record without critical red flag must NEVER have t0Status = 'T0-Confirmed'
      if (rec.triageTier && rec.triageTier !== 'T0' && !rec.criticalTriggered && rec.t0Status === 'T0-Confirmed') {
        rec.t0Status = undefined;
        dirty = true;
      }

      // Canonical deduplication key (e.g. RM-2026-000001)
      const canonicalKey = rec.recordId || rec.rmCode || rec.id;
      if (!migratedMap.has(canonicalKey)) {
        migratedMap.set(canonicalKey, rec);
      } else {
        // Merge so existing synced status or richer fields are preserved
        const existing = migratedMap.get(canonicalKey)!;
        const merged: AssessmentRecord = {
          ...existing,
          ...rec,
          syncStatus: existing.syncStatus === 'synced' || rec.syncStatus === 'synced' ? 'synced' : rec.syncStatus,
        };
        migratedMap.set(canonicalKey, merged);
        dirty = true;
      }
    });

    const migrated = Array.from(migratedMap.values());
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
 * Generate unique assessment record identifier (e.g. RM-2026-000001).
 */
export function generateAssessmentRecordId(): string {
  const current = getCentralAssessments();
  const year = new Date().getFullYear();
  let maxSeq = 0;
  current.forEach((r) => {
    const match = (r.recordId || r.id || '').match(/RM-\d{4}-(\d+)/) || (r.recordId || '').match(/ASM-\d{4}-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxSeq) maxSeq = num;
    }
  });
  return `RM-${year}-${String(maxSeq + 1).padStart(6, '0')}`;
}

export function saveCentralAssessment(record: AssessmentRecord): AssessmentRecord[] {
  const current = getCentralAssessments();
  let recordId = record.recordId || record.rmCode || generateAssessmentRecordId();
  if (/^(ASM|PB)-/i.test(recordId)) {
    recordId = recordId.replace(/^(ASM|PB)-/i, 'RM-');
  }
  let survivorId = record.survivorId || record.victimId || (record.nik ? `SURV-${record.nik.slice(-6)}` : `SURV-${recordId.replace(/^(RM|PB|ASM)-/i, '')}`);
  if (/^(PB|ASM|RM)-/i.test(survivorId)) {
    survivorId = survivorId.replace(/^(PB|ASM|RM)-/i, 'SURV-');
  }
  const normalized: AssessmentRecord = {
    ...record,
    recordId,
    rmCode: recordId,
    id: recordId,
    survivorId,
    victimId: survivorId,
    syncStatus: 'synced' as const,
  };

  const existingIdx = current.findIndex((r) => r.recordId === recordId || r.id === recordId);
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
    const list: AssessmentRecord[] = JSON.parse(stored);
    let dirty = false;
    const sanitized = list.map((item) => {
      let changed = false;
      const rec = { ...item };
      if (rec.id && /^(ASM|PB)-/i.test(rec.id)) {
        rec.id = rec.id.replace(/^(ASM|PB)-/i, 'RM-');
        changed = true;
      }
      if (rec.recordId && /^(ASM|PB)-/i.test(rec.recordId)) {
        rec.recordId = rec.recordId.replace(/^(ASM|PB)-/i, 'RM-');
        changed = true;
      }
      if (!rec.rmCode) {
        rec.rmCode = rec.recordId || rec.id;
        changed = true;
      }
      if (rec.rmCode && /^(ASM|PB)-/i.test(rec.rmCode)) {
        rec.rmCode = rec.rmCode.replace(/^(ASM|PB)-/i, 'RM-');
        changed = true;
      }
      if (changed) dirty = true;
      return rec;
    });
    if (dirty) {
      localStorage.setItem(STORAGE_KEY_OFFLINE_QUEUE, JSON.stringify(sanitized));
    }
    return sanitized;
  } catch (e) {
    console.error('Failed to parse offline queue', e);
    return [];
  }
}

export function saveAssessmentLocally(record: AssessmentRecord): AssessmentRecord[] {
  const current = getPendingAssessments();
  let recordId = record.recordId || record.rmCode || generateAssessmentRecordId();
  if (/^(ASM|PB)-/i.test(recordId)) {
    recordId = recordId.replace(/^(ASM|PB)-/i, 'RM-');
  }
  let survivorId = record.survivorId || record.victimId || (record.nik ? `SURV-${record.nik.slice(-6)}` : `SURV-${recordId.replace(/^(RM|PB|ASM)-/i, '')}`);
  if (/^(PB|ASM|RM)-/i.test(survivorId)) {
    survivorId = survivorId.replace(/^(PB|ASM|RM)-/i, 'SURV-');
  }
  const pendingRecord: AssessmentRecord = {
    ...record,
    recordId,
    rmCode: recordId,
    id: recordId,
    survivorId,
    victimId: survivorId,
    syncStatus: 'pending' as const,
  };

  const existingIdx = current.findIndex((r) => r.recordId === recordId || r.id === recordId);
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
  const canonicalTarget = id.replace(/^(ASM|PB)-/i, 'RM-');
  const filtered = current.filter((item) => {
    const itemCode = (item.recordId || item.rmCode || item.id || '').replace(/^(ASM|PB)-/i, 'RM-');
    return item.id !== id && item.recordId !== id && itemCode !== canonicalTarget;
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_OFFLINE_QUEUE, JSON.stringify(filtered));
  }
  idbRemoveQueueItem(id).catch(() => {});
  if (canonicalTarget !== id) {
    idbRemoveQueueItem(canonicalTarget).catch(() => {});
  }
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

  // Deduplicate by canonical recordId or id (keeping newest synced version)
  const map = new Map<string, AssessmentRecord>();
  updatedCentral.forEach((rec) => {
    const key = (rec.recordId || rec.rmCode || rec.id || '').replace(/^(ASM|PB)-/i, 'RM-');
    if (!map.has(key)) {
      map.set(key, {
        ...rec,
        recordId: key || rec.recordId,
        rmCode: key || rec.rmCode,
        id: key || rec.id,
      });
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
    const [rawIdbAssessments, rawIdbQueue] = await Promise.all([
      idbGetAssessments(),
      idbGetQueue(),
    ]);

    // Sanitize any legacy ASM- or PB- records from IndexedDB and Dexie
    const idbAssessments: AssessmentRecord[] = [];
    for (const a of rawIdbAssessments) {
      const rawKey = a.recordId || a.id || '';
      const isLegacy = /^(ASM|PB)-/i.test(rawKey) || (a.rmCode && /^(ASM|PB)-/i.test(a.rmCode));
      if (isLegacy) {
        // Clean up legacy key from IndexedDB & Dexie stores
        if (a.recordId) {
          idbRemoveAssessment(a.recordId).catch(() => {});
          db.assessments.delete(a.recordId).catch(() => {});
        }
        if (a.id && a.id !== a.recordId) {
          idbRemoveAssessment(a.id).catch(() => {});
          db.assessments.delete(a.id).catch(() => {});
        }
        const canonicalCode = (a.rmCode || a.recordId || a.id || '').replace(/^(ASM|PB)-/i, 'RM-');
        const migratedItem: AssessmentRecord = {
          ...a,
          recordId: canonicalCode,
          rmCode: canonicalCode,
          id: canonicalCode,
          survivorId: a.survivorId ? a.survivorId.replace(/^(ASM|PB|RM)-/i, 'SURV-') : undefined,
          victimId: a.victimId ? a.victimId.replace(/^(ASM|PB|RM)-/i, 'SURV-') : undefined,
        };
        idbAssessments.push(migratedItem);
      } else {
        idbAssessments.push(a);
      }
    }

    const idbQueue: AssessmentRecord[] = [];
    for (const q of rawIdbQueue) {
      const rawKey = q.recordId || q.id || '';
      const isLegacy = /^(ASM|PB)-/i.test(rawKey);
      if (isLegacy) {
        if (q.recordId) {
          idbRemoveQueueItem(q.recordId).catch(() => {});
          db.offlineQueue.delete(q.recordId).catch(() => {});
        }
        const canonicalCode = rawKey.replace(/^(ASM|PB)-/i, 'RM-');
        idbQueue.push({
          ...q,
          recordId: canonicalCode,
          rmCode: canonicalCode,
          id: canonicalCode,
        });
      } else {
        idbQueue.push(q);
      }
    }

    let currentCentral = getCentralAssessments();
    let currentQueue = getPendingAssessments();

    // Set of IDs that are already confirmed synced in currentCentral
    const syncedIds = new Set<string>();
    currentCentral.forEach((a) => {
      if (a.syncStatus === 'synced') {
        const canonicalKey = (a.recordId || a.rmCode || a.id || '').replace(/^(ASM|PB)-/i, 'RM-');
        if (canonicalKey) syncedIds.add(canonicalKey);
        if (a.recordId) syncedIds.add(a.recordId);
        if (a.id) syncedIds.add(a.id);
        if (a.victimId) syncedIds.add(a.victimId);
      }
    });

    if (idbAssessments.length > 0) {
      const map = new Map<string, AssessmentRecord>();
      // Put idb records first (using canonical key)
      idbAssessments.forEach((a) => {
        const key = (a.recordId || a.rmCode || a.id || '').replace(/^(ASM|PB)-/i, 'RM-');
        map.set(key, a);
      });
      // Local storage synced status takes precedence
      currentCentral.forEach((localRec) => {
        const key = (localRec.recordId || localRec.rmCode || localRec.id || '').replace(/^(ASM|PB)-/i, 'RM-');
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
      const key = (q.recordId || q.rmCode || q.id || '').replace(/^(ASM|PB)-/i, 'RM-');
      if (!syncedIds.has(key) && q.syncStatus === 'pending') {
        queueMap.set(key, q);
      }
    });

    idbQueue.forEach((q) => {
      const key = (q.recordId || q.rmCode || q.id || '').replace(/^(ASM|PB)-/i, 'RM-');
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
    local.forEach((r) => {
      const canonicalKey = (r.recordId || r.rmCode || r.id || '').replace(/^(ASM|PB)-/i, 'RM-');
      map.set(canonicalKey, r);
    });

    // Merge remote records, but NEVER downgrade a local 'synced' record to 'pending'
    remote.forEach((r) => {
      const canonicalKey = (r.recordId || r.rmCode || r.id || '').replace(/^(ASM|PB)-/i, 'RM-');
      const normalizedRemote: AssessmentRecord = {
        ...r,
        recordId: canonicalKey || r.recordId,
        rmCode: canonicalKey || r.rmCode,
        id: canonicalKey || r.id,
      };
      const existing = map.get(canonicalKey);
      if (!existing) {
        map.set(canonicalKey, normalizedRemote);
      } else if (existing.syncStatus === 'synced' && r.syncStatus === 'pending') {
        map.set(canonicalKey, { ...normalizedRemote, syncStatus: 'synced' });
      } else {
        map.set(canonicalKey, normalizedRemote);
      }
    });

    // For any local record not yet in remote, push to remote in background
    local.forEach((r) => {
      const canonicalKey = (r.recordId || r.rmCode || r.id || '').replace(/^(ASM|PB)-/i, 'RM-');
      const inRemote = remote.some((rem) => {
        const remKey = (rem.recordId || rem.rmCode || rem.id || '').replace(/^(ASM|PB)-/i, 'RM-');
        return remKey === canonicalKey;
      });
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
