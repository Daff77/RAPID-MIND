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
  resetToDemoData as storageResetDemo,
} from '../services/offlineStorage';
import { DemoScenario } from '../data/demoScenarios';

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
  resetDemoData: () => void;
  activeScenario: DemoScenario | null;
  applyDemoScenario: (scenario: DemoScenario) => void;
  clearDemoScenario: () => void;
  kpiStats: KPIStats;
}

const AssessmentContext = createContext<AssessmentContextValue | undefined>(undefined);

export const AssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [centralAssessments, setCentralAssessments] = useState<AssessmentRecord[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<AssessmentRecord[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessBanner, setSyncSuccessBanner] = useState<string | null>(null);
  const [activeScenario, setActiveScenario] = useState<DemoScenario | null>(null);

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
      const savedRecord = savedQueue[0];
      return { record: savedRecord, isOfflineSaved: true };
    } else {
      const updatedCentral = saveCentralAssessment(recordData as AssessmentRecord);
      setCentralAssessments([...updatedCentral]);
      const savedRecord = updatedCentral[0];
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
      setSyncSuccessBanner(`✓ ${result.syncedCount} assessment${result.syncedCount > 1 ? 's' : ''} synchronized successfully.`);
      setTimeout(() => setSyncSuccessBanner(null), 5000);
      return result.syncedCount;
    } finally {
      setIsSyncing(false);
    }
  }, [offlineQueue]);

  const resetDemoData = useCallback(() => {
    storageResetDemo();
    setCentralAssessments(getCentralAssessments());
    setOfflineQueue([]);
    setIsOnline(true);
    setActiveScenario(null);
    setSyncSuccessBanner('Demo data reset to initial benchmark state.');
    setTimeout(() => setSyncSuccessBanner(null), 4000);
  }, []);

  const applyDemoScenario = useCallback((scenario: DemoScenario) => {
    setActiveScenario(scenario);
  }, []);

  const clearDemoScenario = useCallback(() => {
    setActiveScenario(null);
  }, []);

  // Combined records for the volunteer view (pending items at top)
  const allAssessments = useMemo(() => {
    return [...offlineQueue, ...centralAssessments];
  }, [offlineQueue, centralAssessments]);

  // Derived KPI Stats from central assessments
  const kpiStats = useMemo<KPIStats>(() => {
    const total = centralAssessments.length;
    let green = 0;
    let yellow = 0;
    let red = 0;

    for (const r of centralAssessments) {
      if (r.zone === 'GREEN') green++;
      else if (r.zone === 'YELLOW') yellow++;
      else if (r.zone === 'RED') red++;
    }

    const greenPct = total > 0 ? Math.round((green / total) * 100) : 0;
    const yellowPct = total > 0 ? Math.round((yellow / total) * 100) : 0;
    const redPct = total > 0 ? Math.round((red / total) * 100) : 0;

    return {
      total,
      green,
      yellow,
      red,
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
      resetDemoData,
      activeScenario,
      applyDemoScenario,
      clearDemoScenario,
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
      resetDemoData,
      activeScenario,
      applyDemoScenario,
      clearDemoScenario,
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
