import { AssessmentRecord } from '../types/assessment';
import { INITIAL_ASSESSMENTS } from '../data/mockAssessments';

const STORAGE_KEY_ASSESSMENTS = 'rapidmind_central_assessments_v1';
const STORAGE_KEY_OFFLINE_QUEUE = 'rapidmind_offline_pending_v1';
const STORAGE_KEY_ONLINE_STATUS = 'rapidmind_is_online_v1';

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
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse central assessments from storage', e);
    return INITIAL_ASSESSMENTS;
  }
}

export function saveCentralAssessment(record: AssessmentRecord): AssessmentRecord[] {
  const current = getCentralAssessments();
  // Unshift so new items appear first
  const updated = [{ ...record, syncStatus: 'synced' as const }, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_ASSESSMENTS, JSON.stringify(updated));
  }
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
  const pendingRecord: AssessmentRecord = {
    ...record,
    syncStatus: 'pending',
  };
  const updated = [pendingRecord, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_OFFLINE_QUEUE, JSON.stringify(updated));
  }
  return updated;
}

export function removeSyncedAssessment(id: string): void {
  const current = getPendingAssessments();
  const filtered = current.filter((item) => item.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_OFFLINE_QUEUE, JSON.stringify(filtered));
  }
}

export async function syncPendingAssessments(): Promise<{
  syncedCount: number;
  syncedRecords: AssessmentRecord[];
}> {
  const pending = getPendingAssessments();
  if (pending.length === 0) {
    return { syncedCount: 0, syncedRecords: [] };
  }

  // Artificial network latency simulation (900ms) for realistic demo feedback
  await new Promise((resolve) => setTimeout(resolve, 900));

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

  return {
    syncedCount: pending.length,
    syncedRecords: markSynced,
  };
}

export function resetToDemoData(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_ASSESSMENTS, JSON.stringify(INITIAL_ASSESSMENTS));
    localStorage.removeItem(STORAGE_KEY_OFFLINE_QUEUE);
    localStorage.setItem(STORAGE_KEY_ONLINE_STATUS, 'true');
  }
}
