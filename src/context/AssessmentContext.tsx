import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
} from '../services/offlineStorage';

interface AssessmentContextValue {
  centralAssessments: AssessmentRecord[];
  offlineQueue: AssessmentRecord[];
  allAssessments: AssessmentRecord[];
  isOnline: boolean;
  isSyncing: boolean;
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
  const [syncSuccessBanner, setSyncSuccessBanner] = useState<string | null>(null);

  // Initialize from storage on mount
  useEffect(() => {
    setCentralAssessments(getCentralAssessments());
    setOfflineQueue(getPendingAssessments());
    setIsOnline(getOnlineStatus());
  }, []);

  const toggleOnlineStatus = useCallback((explicitStatus?: boolean) => {
    setIsOnline((prev) => {
      const next = explicitStatus !== undefined ? explicitStatus : !prev;
      persistOnlineStatus(next);
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

  const triggerSync = useCallback(async (): Promise<number> => {
    if (offlineQueue.length === 0) return 0;
    setIsSyncing(true);
    try {
      const result = await syncPendingAssessments();
      setCentralAssessments(getCentralAssessments());
      setOfflineQueue([]);
      setSyncSuccessBanner(`✓ ${result.syncedCount} asesmen berhasil disinkronisasi ke server pusat.`);
      setTimeout(() => setSyncSuccessBanner(null), 5000);
      return result.syncedCount;
    } finally {
      setIsSyncing(false);
    }
  }, [offlineQueue]);

  // Combined records for the volunteer view (pending items at top)
  const allAssessments = useMemo(() => {
    return [...offlineQueue, ...centralAssessments];
  }, [offlineQueue, centralAssessments]);

  // Derived KPI Stats from central assessments calculated per unique survivor's latest status
  const kpiStats = useMemo<KPIStats>(() => {
    const totalAssessments = centralAssessments.length;
    // centralAssessments has newest records first; group by unique survivor (victimId || id)
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

  const value = useMemo(
    () => ({
      centralAssessments,
      offlineQueue,
      allAssessments,
      isOnline,
      isSyncing,
      syncSuccessBanner,
      toggleOnlineStatus,
      addAssessment,
      triggerSync,
      kpiStats,
    }),
    [
      centralAssessments,
      offlineQueue,
      allAssessments,
      isOnline,
      isSyncing,
      syncSuccessBanner,
      toggleOnlineStatus,
      addAssessment,
      triggerSync,
      kpiStats,
    ]
  );

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
};

export function useAssessment() {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
}
