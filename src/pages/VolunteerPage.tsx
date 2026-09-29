import React, { useState } from 'react';
import { VolunteerHeader } from '../components/volunteer/VolunteerHeader';
import { AutoLookupHomeScreen } from '../components/volunteer/AutoLookupHomeScreen';
import { PFAMenuSection } from '../components/volunteer/PFAMenuSection';
import { SRQ20InterviewWizard } from '../components/volunteer/SRQ20InterviewWizard';
import { VolunteerHistory } from '../components/volunteer/VolunteerHistory';
import { FloatingRedFlagButton } from '../components/volunteer/FloatingRedFlagButton';
import { SurvivorProfile } from '../types/assessment';

interface VolunteerPageProps {
  onGoToDashboard: () => void;
}

type VolunteerActiveView = 'home' | 'pfa' | 'srq20' | 'history';

export const VolunteerPage: React.FC<VolunteerPageProps> = ({ onGoToDashboard }) => {
  const [activeView, setActiveView] = useState<VolunteerActiveView>('home');
  const [selectedSurvivor, setSelectedSurvivor] = useState<SurvivorProfile | null>(null);

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
        onGoToDashboard={onGoToDashboard}
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
