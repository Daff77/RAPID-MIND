import React, { useState } from 'react';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { KPICards } from '../components/dashboard/KPICards';
import { PriorityRedPanel } from '../components/dashboard/PriorityRedPanel';
import { TriageCharts } from '../components/dashboard/TriageCharts';
import { TriageMap } from '../components/dashboard/TriageMap';
import { RecentAssessmentsTable } from '../components/dashboard/RecentAssessmentsTable';
import { UserManagementSection } from '../components/dashboard/UserManagementSection';
import { LongitudinalDataSection } from '../components/dashboard/LongitudinalDataSection';
import { useAssessment } from '../context/AssessmentContext';
import { Download, Filter } from 'lucide-react';

interface DashboardPageProps {
  onGoToVolunteer: () => void;
  onGoToHospital?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onGoToVolunteer,
  onGoToHospital,
}) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [activePhaseFilter, setActivePhaseFilter] = useState<'all' | 'acute' | 'longitudinal'>('all');
  const { centralAssessments } = useAssessment();

  const handleExport = () => {
    alert('Mengunduh Laporan Agregat Wilayah BPBD & Dinkes (PDF / Excel)...');
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-900 flex flex-col font-sans">
      <DashboardHeader
        activeSection={activeSection}
        onSelectSection={(sec) => setActiveSection(sec)}
        onGoToVolunteer={onGoToVolunteer}
        onGoToHospital={onGoToHospital}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Global Filter & Export Bar (Role 3: BPBD / Dinkes Command Center) */}
        {activeSection === 'overview' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                <span>Filter Fase Penanganan Bencana:</span>
              </span>

              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActivePhaseFilter('all')}
                  className={`px-3 py-1 rounded-lg transition ${
                    activePhaseFilter === 'all'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Semua Fase
                </button>

                <button
                  type="button"
                  onClick={() => setActivePhaseFilter('acute')}
                  className={`px-3 py-1 rounded-lg transition ${
                    activePhaseFilter === 'acute'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Fase Akut (H 1–3)
                </button>

                <button
                  type="button"
                  onClick={() => setActivePhaseFilter('longitudinal')}
                  className={`px-3 py-1 rounded-lg transition ${
                    activePhaseFilter === 'longitudinal'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Fase Lanjutan (H 4–30)
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExport}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Ekspor Laporan (PDF/Excel)</span>
            </button>
          </div>
        )}

        {/* 1. Pusat Komando & Geospasial (Overview) */}
        {activeSection === 'overview' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <KPICards />
            <PriorityRedPanel />
            <TriageCharts />
            <TriageMap />
            <RecentAssessmentsTable />
          </div>
        )}

        {/* 2. Data Longitudinal Penapisan Penyintas (Hari 1 - 30) */}
        {activeSection === 'longitudinal' && <LongitudinalDataSection />}

        {/* 3. Manajemen Relawan & Pengguna (Admin BPBD / Dinkes) */}
        {activeSection === 'users' && <UserManagementSection />}
      </main>
    </div>
  );
};
