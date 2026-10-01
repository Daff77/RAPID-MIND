import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  AssessmentRecord,
  KPIStats,
} from '../types/assessment';
import {
  getCentralAssessments,
  getPendingAssessments,
  getOnlineStatus,
  setOnlineStatus as persistOnlineStatus,
  saveCentralAssessment,
  saveAssessmentLocally,
  syncPendingAssessments,
  syncAssessmentsWithSupabase,
  hydrateFromIndexedDB,
} from '../services/offlineStorage';
import { syncSurvivorsWithSupabase, hydrateSurvivorsFromIndexedDB } from '../data/seedSurvivors';
import { isIndexedDBSupported, openIndexedDB } from '../services/indexedDbService';
import { emergencyService, EmergencyAlertItem } from '../services/emergencyService';
import { syncService } from '../services/syncService';

interface AssessmentContextValue {
  centralAssessments: AssessmentRecord[];
  offlineQueue: AssessmentRecord[];
  allAssessments: AssessmentRecord[];
  isOnline: boolean;
  isSyncing: boolean;
  isUsingSupabase: boolean; // Preserved for UI compatibility (represents Cloud API active)
  isIndexedDBReady: boolean;
  syncSuccessBanner: string | null;
  toggleOnlineStatus: (explicitStatus?: boolean) => void;
  addAssessment: (record: Omit<AssessmentRecord, 'syncStatus'>) => { record: AssessmentRecord; isOfflineSaved: boolean };
  triggerSync: () => Promise<number>;
  kpiStats: KPIStats;
}

const AssessmentContext = createContext<AssessmentContextValue | undefined>(undefined);

export const AssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [centralAssessments, setCentralAssessments] = useState<AssessmentRecord[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<AssessmentRecord[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isIndexedDBReady, setIsIndexedDBReady] = useState<boolean>(false);
  const [syncSuccessBanner, setSyncSuccessBanner] = useState<string | null>(null);
  const isUsingSupabase = true; // Laravel Cloud API is enabled

  const isSyncingRef = useRef(false);
  isSyncingRef.current = isSyncing;

  const triggerSync = useCallback(async (): Promise<number> => {
    if (isSyncingRef.current) return 0;
    const pending = getPendingAssessments();
    const central = getCentralAssessments();
    const pendingInCentral = central.some((a) => a.syncStatus === 'pending');
    if (pending.length === 0 && offlineQueue.length === 0 && !pendingInCentral) return 0;

    setIsSyncing(true);
    isSyncingRef.current = true;
    try {
      const result = await syncPendingAssessments();
      setCentralAssessments(getCentralAssessments());
      setOfflineQueue([]);
      if (result.syncedCount > 0) {
        setSyncSuccessBanner(`✓ ${result.syncedCount} rekaman otomatis disinkronisasi ke server pusat.`);
        setTimeout(() => setSyncSuccessBanner(null), 5000);
      }
      return result.syncedCount;
    } finally {
      setIsSyncing(false);
      isSyncingRef.current = false;
    }
  }, [offlineQueue]);

  const triggerSyncRef = useRef(triggerSync);
  triggerSyncRef.current = triggerSync;

  // Initialize from storage on mount & trigger cloud sync
  useEffect(() => {
    setCentralAssessments(getCentralAssessments());
    setOfflineQueue(getPendingAssessments());
    const onlineSetting = getOnlineStatus();
    const nativeOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const initialOnline = onlineSetting && nativeOnline;
    setIsOnline(initialOnline);

    // Hydrate from IndexedDB on startup for high-capacity offline persistence
    if (isIndexedDBSupported()) {
      openIndexedDB()
        .then(() => {
          setIsIndexedDBReady(true);
          return Promise.all([
            hydrateFromIndexedDB(),
            hydrateSurvivorsFromIndexedDB(),
          ]);
        })
        .then(([idbRes]) => {
          if (idbRes) {
            setCentralAssessments(idbRes.assessments);
            setOfflineQueue(idbRes.pending);
            if (initialOnline && idbRes.pending.length > 0) {
              triggerSyncRef.current();
            }
          }
        })
        .catch((err) => {
          console.warn('IndexedDB startup initialization note:', err);
        });
    }

    if (initialOnline) {
      Promise.all([
        syncSurvivorsWithSupabase(),
        syncAssessmentsWithSupabase(),
      ])
        .then(() => {
          setCentralAssessments(getCentralAssessments());
          setOfflineQueue(getPendingAssessments());
          const pending = getPendingAssessments();
          if (pending.length > 0) {
            triggerSyncRef.current();
          }
        })
        .catch((err) => {
          console.warn('Initial cloud sync skipped:', err);
        });
    }

    // Auto-sync listener when browser reconnects to internet
    const handleOnline = () => {
      setIsOnline(true);
      persistOnlineStatus(true);
      // Auto-sync immediately when online connection returns!
      setTimeout(() => {
        const pending = getPendingAssessments();
        if (pending.length > 0) {
          triggerSyncRef.current();
        }
      }, 300);
    };

    const handleOffline = () => {
      setIsOnline(false);
      persistOnlineStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Auto-sync when user returns to the tab and is online
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        setIsOnline(true);
        persistOnlineStatus(true);
        const pending = getPendingAssessments();
        if (pending.length > 0) {
          triggerSyncRef.current();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic auto-sync heartbeat (every 20s if online with pending items)
    const syncHeartbeat = setInterval(() => {
      if (navigator.onLine && !isSyncingRef.current) {
        const pending = getPendingAssessments();
        if (pending.length > 0) {
          triggerSyncRef.current();
        }
      }
    }, 20000);

    // Realtime Reverb WebSockets listener for emergency triage events
    const unsubscribeRealtime = emergencyService.listenForRealtimeAlerts(
      (createdAlert: EmergencyAlertItem) => {
        // When a new T0 emergency alert is created, ensure it appears in the assessment registry
        setCentralAssessments((prev) => {
          const exists = prev.find((a) => a.recordId === createdAlert.recordId);
          if (exists) {
            return prev.map((a) =>
              a.recordId === createdAlert.recordId ? { ...a, t0Status: createdAlert.status } : a
            );
          }
          return prev;
        });
      },
      (confirmedAlert: EmergencyAlertItem) => {
        setCentralAssessments((prev) =>
          prev.map((a) =>
            a.recordId === confirmedAlert.recordId
              ? {
                  ...a,
                  t0Status: 'T0-Confirmed',
                  hospitalReferralStatus: 'in_transit',
                  hospitalNotes: confirmedAlert.teleNotes,
                }
              : a
          )
        );
      },
      (downgradedAlert: EmergencyAlertItem) => {
        setCentralAssessments((prev) =>
          prev.map((a) =>
            a.recordId === downgradedAlert.recordId
              ? {
                  ...a,
                  t0Status: 'Downgraded',
                  triageTier: downgradedAlert.downgradedTier || 'T1',
                  zone: downgradedAlert.downgradedTier === 'T1' ? 'RED' : 'YELLOW',
                }
              : a
          )
        );
      }
    );

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(syncHeartbeat);
      unsubscribeRealtime();
    };
  }, []);

  const toggleOnlineStatus = useCallback((explicitStatus?: boolean) => {
    setIsOnline((prev) => {
      const next = explicitStatus !== undefined ? explicitStatus : !prev;
      persistOnlineStatus(next);
      if (next) {
        // As soon as user enables online, trigger auto-sync
        setTimeout(() => {
          const pending = getPendingAssessments();
          if (pending.length > 0) {
            triggerSyncRef.current();
          }
        }, 150);
      }
      return next;
    });
  }, []);

  const addAssessment = useCallback((recordData: Omit<AssessmentRecord, 'syncStatus'>) => {
    if (!isOnline) {
      const savedQueue = saveAssessmentLocally(recordData as AssessmentRecord);
      setOfflineQueue([...savedQueue]);
      const savedRecord = (recordData as any).recordId
        ? savedQueue.find((r) => r.recordId === (recordData as any).recordId) || savedQueue[0]
        : savedQueue[0];
      return { record: savedRecord, isOfflineSaved: true };
    } else {
      const updatedCentral = saveCentralAssessment(recordData as AssessmentRecord);
      setCentralAssessments([...updatedCentral]);
      const savedRecord = (recordData as any).recordId
        ? updatedCentral.find((r) => r.recordId === (recordData as any).recordId) || updatedCentral[0]
        : updatedCentral[0];
      return { record: savedRecord, isOfflineSaved: false };
    }
  }, [isOnline]);

  // Combined records for the volunteer view (pending items at top, deduplicated, synced takes precedence)
  const allAssessments = useMemo(() => {
    const map = new Map<string, AssessmentRecord>();
    // Add all central assessments first
    centralAssessments.forEach((c) => {
      const key = c.recordId || c.id;
      map.set(key, c);
    });
    // Add offlineQueue items only if not already marked synced in central
    offlineQueue.forEach((q) => {
      const key = q.recordId || q.id;
      const existing = map.get(key);
      if (!existing || existing.syncStatus !== 'synced') {
        map.set(key, q);
      }
    });

    const records = Array.from(map.values());
    records.sort((a, b) => {
      if (a.syncStatus === 'pending' && b.syncStatus !== 'pending') return -1;
      if (a.syncStatus !== 'pending' && b.syncStatus === 'pending') return 1;
      return 0;
    });
    return records;
  }, [offlineQueue, centralAssessments]);

  // Derived KPI Stats from central assessments calculated per unique survivor's latest status
  const kpiStats = useMemo<KPIStats>(() => {
    const totalAssessments = centralAssessments.length;
    const latestSurvivorMap = new Map<string, AssessmentRecord>();
    for (const r of centralAssessments) {
      const key = r.victimId || r.id;
      if (key && !latestSurvivorMap.has(key)) {
        latestSurvivorMap.set(key, r);
      }
    }

    const uniqueSurvivors = Array.from(latestSurvivorMap.values());
    const total = uniqueSurvivors.length;
    let green = 0;
    let yellow = 0;
    let red = 0;
    let t0Count = 0;
    let t1Count = 0;
    let t2Count = 0;
    let t3Count = 0;

    for (const r of uniqueSurvivors) {
      if (r.zone === 'GREEN') green++;
      else if (r.zone === 'YELLOW') yellow++;
      else if (r.zone === 'RED') red++;

      if (r.triageTier === 'T0' || (r.zone === 'RED' && r.criticalTriggered)) t0Count++;
      else if (r.triageTier === 'T1' || (r.zone === 'RED' && !r.criticalTriggered)) t1Count++;
      else if (r.triageTier === 'T2' || r.zone === 'YELLOW') t2Count++;
      else t3Count++;
    }

    const greenPct = total > 0 ? Math.round((green / total) * 100) : 0;
    const yellowPct = total > 0 ? Math.round((yellow / total) * 100) : 0;
    const redPct = total > 0 ? Math.round((red / total) * 100) : 0;

    return {
      total,
      totalAssessments,
      green,
      yellow,
      red,
      t0Count,
      t1Count,
      t2Count,
      t3Count,
      greenPct,
      yellowPct,
      redPct,
      pendingSync: offlineQueue.length,
    };
  }, [centralAssessments, offlineQueue]);

  return (
    <AssessmentContext.Provider
      value={{
        centralAssessments,
        offlineQueue,
        allAssessments,
        isOnline,
        isSyncing,
        isUsingSupabase,
        isIndexedDBReady,
        syncSuccessBanner,
        toggleOnlineStatus,
        addAssessment,
        triggerSync,
        kpiStats,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessment = (): AssessmentContextValue => {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
};
