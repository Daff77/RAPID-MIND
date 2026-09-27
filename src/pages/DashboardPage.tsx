import React, { useState } from 'react';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { KPICards } from '../components/dashboard/KPICards';
import { PriorityRedPanel } from '../components/dashboard/PriorityRedPanel';
import { TriageCharts } from '../components/dashboard/TriageCharts';
import { TriageMap } from '../components/dashboard/TriageMap';
import { RecentAssessmentsTable } from '../components/dashboard/RecentAssessmentsTable';
import { UserManagementSection } from '../components/dashboard/UserManagementSection';
import { useAssessment } from '../context/AssessmentContext';
import { MOCK_LOCATIONS } from '../data/mockLocations';

interface DashboardPageProps {
  onGoToVolunteer: () => void;
  onGoToHospital?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onGoToVolunteer,
  onGoToHospital,
}) => {
  const [activeSection, setActiveSection] = useState('overview');
  const { centralAssessments } = useAssessment();

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-900 flex flex-col font-sans">
      <DashboardHeader
        activeSection={activeSection}
        onSelectSection={(sec) => setActiveSection(sec)}
        onGoToVolunteer={onGoToVolunteer}
        onGoToHospital={onGoToHospital}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* 1. Overview */}
        {activeSection === 'overview' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <KPICards />
            <PriorityRedPanel />
            <TriageCharts />
            <TriageMap />
            <RecentAssessmentsTable />
          </div>
        )}

        {/* 2. Assessments Archive */}
        {activeSection === 'assessments' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Assessments Archive
                </h2>
                <span className="text-xs text-slate-500">
                  {centralAssessments.length} total records
                </span>
              </div>
            </div>
            <RecentAssessmentsTable />
          </div>
        )}

        {/* 3. Response Posts (Locations) */}
        {activeSection === 'locations' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {MOCK_LOCATIONS.map((loc) => {
                const records = centralAssessments.filter((r) => r.location === loc.name);
                const green = records.filter((r) => r.zone === 'GREEN').length;
                const yellow = records.filter((r) => r.zone === 'YELLOW').length;
                const red = records.filter((r) => r.zone === 'RED').length;
                const total = records.length;

                return (
                  <div
                    key={loc.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{loc.name}</h3>
                        <span className="text-[11px] text-slate-500">{loc.coordinator}</span>
                      </div>
                      <span className="text-base font-mono font-bold text-slate-900">{total}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-center text-[11px] font-semibold pt-1 border-t border-slate-100">
                      <span className="text-emerald-700 bg-emerald-50 py-0.5 rounded">
                        {green} 🟢
                      </span>
                      <span className="text-amber-800 bg-amber-50 py-0.5 rounded">
                        {yellow} 🟡
                      </span>
                      <span className="text-red-700 bg-red-50 py-0.5 rounded">
                        {red} 🔴
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <TriageMap />
          </div>
        )}

        {/* 4. Kelola Pengguna (User Management - Admin Only) */}
        {activeSection === 'users' && (
          <UserManagementSection />
        )}
      </main>
    </div>
  );
};
