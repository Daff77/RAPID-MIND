import React, { useState } from 'react';
import { VolunteerHeader } from '../components/volunteer/VolunteerHeader';
import { AutoLookupHomeScreen } from '../components/volunteer/AutoLookupHomeScreen';
import { PFAMenuSection } from '../components/volunteer/PFAMenuSection';
import { SRQ20InterviewWizard } from '../components/volunteer/SRQ20InterviewWizard';
import { NewAssessmentWizard } from '../components/volunteer/NewAssessmentWizard';
import { VolunteerHistory } from '../components/volunteer/VolunteerHistory';
import { FloatingRedFlagButton } from '../components/volunteer/FloatingRedFlagButton';
import { SurvivorProfile } from '../types/assessment';

interface VolunteerPageProps {
  onGoToDashboard: () => void;
}

type VolunteerActiveView = 'home' | 'pfa' | 'srq20' | 'new_triase' | 'history';

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
    <div className="min-h-screen bg-[#F6F8FB] text-slate-900 flex flex-col font-sans relative">
      {/* Sticky Volunteer Header */}
      <VolunteerHeader
        currentTab={activeView === 'history' ? 'history' : activeView === 'new_triase' ? 'new' : 'home'}
        onSelectTab={(tab) => {
          if (tab === 'home') setActiveView('home');
          else if (tab === 'new') setActiveView('new_triase');
          else if (tab === 'history') setActiveView('history');
        }}
        onGoToDashboard={onGoToDashboard}
      />

      {/* Main Container */}
      <main className="flex-1 px-3 sm:px-4 py-5 max-w-2xl mx-auto w-full pb-24">
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

        {/* METODE TRIASE LAPANGAN STT + CHECKLIST */}
        {activeView === 'new_triase' && (
          <NewAssessmentWizard
            initialMethod="VERBAL"
            onAssessmentSaved={() => setActiveView('history')}
            onCancel={() => setActiveView('home')}
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
