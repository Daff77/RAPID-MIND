import React, { useState, useEffect } from 'react';
import { VolunteerHeader } from '../components/volunteer/VolunteerHeader';
import { AutoLookupHomeScreen } from '../components/volunteer/AutoLookupHomeScreen';
import { PFAMenuSection } from '../components/volunteer/PFAMenuSection';
import { SRQ20InterviewWizard } from '../components/volunteer/SRQ20InterviewWizard';
import { VolunteerHistory } from '../components/volunteer/VolunteerHistory';
import { FloatingRedFlagButton } from '../components/volunteer/FloatingRedFlagButton';
import { SurvivorProfile } from '../types/assessment';
import { getStoredSurvivors } from '../data/seedSurvivors';

interface VolunteerPageProps {}

type VolunteerActiveView = 'home' | 'pfa' | 'srq20' | 'history';

const STORAGE_KEY_FLOW = 'rapidmind_volunteer_active_flow';

export const VolunteerPage: React.FC<VolunteerPageProps> = () => {
  const [activeView, setActiveView] = useState<VolunteerActiveView>(() => {
    if (typeof window === 'undefined') return 'home';
    try {
      const stored = localStorage.getItem(STORAGE_KEY_FLOW);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.activeView && parsed.selectedSurvivor) {
          return parsed.activeView;
        }
      }
    } catch (e) {
      console.warn('Failed to parse active flow', e);
    }
    return 'home';
  });

  const [selectedSurvivor, setSelectedSurvivor] = useState<SurvivorProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_FLOW);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.selectedSurvivor) {
          const fresh = getStoredSurvivors().find((s) => s.id === parsed.selectedSurvivor.id);
          return fresh || parsed.selectedSurvivor;
        }
      }
    } catch (e) {
      console.warn('Failed to parse active survivor', e);
    }
    return null;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeView === 'home' || !selectedSurvivor) {
      localStorage.removeItem(STORAGE_KEY_FLOW);
    } else {
      localStorage.setItem(
        STORAGE_KEY_FLOW,
        JSON.stringify({ activeView, selectedSurvivor })
      );
    }
  }, [activeView, selectedSurvivor]);

  // Synchronously ensure flow state is saved on refresh/unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (typeof window === 'undefined') return;
      if (activeView !== 'home' && selectedSurvivor) {
        try {
          localStorage.setItem(
            STORAGE_KEY_FLOW,
            JSON.stringify({ activeView, selectedSurvivor })
          );
        } catch {}
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeView, selectedSurvivor]);

  const handleSelectSurvivorFromLookup = (survivor: SurvivorProfile, targetFlow: 'pfa' | 'srq20') => {
    setSelectedSurvivor(survivor);
    if (targetFlow === 'pfa') {
      setActiveView('pfa');
    } else {
      setActiveView('srq20');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans relative">
      {/* Sticky Volunteer Header */}
      <VolunteerHeader
        currentTab={activeView === 'history' ? 'history' : 'home'}
        onSelectTab={(tab) => setActiveView(tab)}
      />

      {/* Main Container — Mobile-First (16px edge padding, safe bottom clearance for dock) */}
      <main className="flex-1 px-4 sm:px-6 py-4 sm:py-6 max-w-2xl mx-auto w-full pb-28 sm:pb-32">
        {/* HOMESCREEN & IDENTITAS PENYINTAS (AUTO-LOOKUP SYSTEM) */}
        {activeView === 'home' && (
          <AutoLookupHomeScreen
            onSelectSurvivor={handleSelectSurvivorFromLookup}
            onOpenHistory={() => setActiveView('history')}
          />
        )}

        {/* MENU PFA (FASE AKUT: HARI 1–3) */}
        {activeView === 'pfa' && selectedSurvivor && (
          <PFAMenuSection
            survivor={selectedSurvivor}
            onComplete={(updated) => {
              setSelectedSurvivor(updated);
              setActiveView('home');
            }}
            onProceedToSRQ20={(updated) => {
              setSelectedSurvivor(updated);
              setActiveView('srq20');
            }}
            onBack={() => setActiveView('home')}
          />
        )}

        {/* MENU WAWANCARA SRQ-20 (HARI 4–30) & FUNGSI HARIAN */}
        {activeView === 'srq20' && selectedSurvivor && (
          <SRQ20InterviewWizard
            survivor={selectedSurvivor}
            onComplete={() => {
              // Stay on result screen or return home
            }}
            onBack={() => setActiveView('home')}
          />
        )}

        {/* RIWAYAT ASESMEN PENYINTAS */}
        {activeView === 'history' && <VolunteerHistory />}
      </main>

      {/* 🚨 ALWAYS-ON FLOATING SHORTCUT: RED FLAG EMERGENCY */}
      <FloatingRedFlagButton
        currentVictimId={selectedSurvivor?.id || 'VCT-ACTIVE'}
        currentVictimName={selectedSurvivor?.name || 'Penyintas Lapangan'}
        currentLocation={selectedSurvivor?.posko || 'Posko A'}
        onEmergencyTriggered={() => {
          // Keep floating or notify
        }}
      />
    </div>
  );
};
