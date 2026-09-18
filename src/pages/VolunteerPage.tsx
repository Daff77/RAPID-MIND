import React, { useState } from 'react';
import { VolunteerHeader } from '../components/volunteer/VolunteerHeader';
import { VolunteerHome } from '../components/volunteer/VolunteerHome';
import { NewAssessmentWizard } from '../components/volunteer/NewAssessmentWizard';
import { VolunteerHistory } from '../components/volunteer/VolunteerHistory';
import { DemoPresetsPanel } from '../components/volunteer/DemoPresetsPanel';
import { DemoScenario } from '../data/demoScenarios';
import { AssessmentMethod } from '../types/assessment';

interface VolunteerPageProps {
  onGoToDashboard: () => void;
}

export const VolunteerPage: React.FC<VolunteerPageProps> = ({ onGoToDashboard }) => {
  const [currentTab, setCurrentTab] = useState<'home' | 'new' | 'history'>('home');
  const [selectedInitialMethod, setSelectedInitialMethod] = useState<AssessmentMethod>('VERBAL');
  const [isDemoDrawerOpen, setIsDemoDrawerOpen] = useState(false);

  const handleStartNewAssessment = (method?: AssessmentMethod) => {
    if (method) setSelectedInitialMethod(method);
    setCurrentTab('new');
  };

  const handleScenarioActivated = (_scenario: DemoScenario) => {
    setCurrentTab('new');
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-900 flex flex-col">
      {/* Sticky Light Header */}
      <VolunteerHeader
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onGoToDashboard={onGoToDashboard}
        onOpenDemoDrawer={() => setIsDemoDrawerOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 px-3 sm:px-4 py-5 max-w-2xl mx-auto w-full pb-16">
        {currentTab === 'home' && (
          <VolunteerHome
            onStartNewAssessment={handleStartNewAssessment}
            onViewHistory={() => setCurrentTab('history')}
            onGoToDashboard={onGoToDashboard}
          />
        )}

        {currentTab === 'new' && (
          <NewAssessmentWizard
            initialMethod={selectedInitialMethod}
            onAssessmentSaved={() => setCurrentTab('history')}
            onCancel={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'history' && <VolunteerHistory />}
      </main>

      {/* Discreet Demo Presets Drawer */}
      <DemoPresetsPanel
        isOpen={isDemoDrawerOpen}
        onClose={() => setIsDemoDrawerOpen(false)}
        onScenarioActivated={handleScenarioActivated}
      />
    </div>
  );
};
