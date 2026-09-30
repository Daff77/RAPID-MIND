import { apiClient } from '../lib/api';
import { db } from '../lib/db';
import { AssessmentRecord } from '../types/assessment';

export interface SyncResult {
  syncedCount: number;
  skippedCount: number;
  syncedRecords: AssessmentRecord[];
  errors: any[];
}

export const syncService = {
  /**
   * Sync all pending offline records to Laravel central database.
   */
  async syncPendingQueue(): Promise<SyncResult> {
    const queue = await db.offlineQueue.toArray();
    if (queue.length === 0) {
      return { syncedCount: 0, skippedCount: 0, syncedRecords: [], errors: [] };
    }

    try {
      const payload = {
        records: queue.map((item) => ({
          ...item,
          clientEventId: item.clientEventId || item.recordId || `offline-${Date.now()}`,
          victimId: item.victimId || item.id,
          posko: item.location,
        })),
      };

      const res = await apiClient.post<{
        success: boolean;
        syncedCount: number;
        skippedCount: number;
        errors: any[];
      }>('/assessments/sync', payload);

      // Successfully synced: clear offline queue in Dexie
      await db.offlineQueue.clear();

      // Mark records as synced in Dexie assessments table
      const markSynced: AssessmentRecord[] = queue.map((q) => ({
        ...q,
        syncStatus: 'synced',
      }));
      await db.assessments.bulkPut(markSynced);

      // Also check and sync pending offline emergency alerts if any
      const pendingAlerts = await db.emergencyAlerts.where('syncStatus').equals('pending').toArray();
      if (pendingAlerts.length > 0) {
        for (const alert of pendingAlerts) {
          try {
            await apiClient.post('/emergency', alert);
            await db.emergencyAlerts.update(alert.id, { syncStatus: 'synced' });
          } catch {}
        }
      }

      return {
        syncedCount: res.syncedCount,
        skippedCount: res.skippedCount,
        syncedRecords: markSynced,
        errors: res.errors || [],
      };
    } catch (err: any) {
      console.warn('Sync failed (will retry on next reconnection):', err);
      throw err;
    }
  },

  /**
   * Register automatic reconnection handler.
   */
  initAutoSync(onSyncSuccess?: (result: SyncResult) => void) {
    if (typeof window === 'undefined') return () => {};

    const handleOnline = async () => {
      try {
        const result = await syncService.syncPendingQueue();
        if (result.syncedCount > 0 && onSyncSuccess) {
          onSyncSuccess(result);
        }
      } catch {}
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  },
};
