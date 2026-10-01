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
import { Download, Filter, FileText } from 'lucide-react';

interface DashboardPageProps {}

export const DashboardPage: React.FC<DashboardPageProps> = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [activePhaseFilter, setActivePhaseFilter] = useState<'all' | 'acute' | 'longitudinal'>('all');
  const { centralAssessments } = useAssessment();

  const handleExport = () => {
    alert('Mengunduh Laporan Agregat Wilayah BPBD & Dinkes (PDF / Excel)...');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      <DashboardHeader
        activeSection={activeSection}
        onSelectSection={(sec) => setActiveSection(sec)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Global Filter & Export Bar (Role 3: BPBD / Dinkes Command Center) */}
        {activeSection === 'overview' && (
          <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                <span>Filter Fase Bencana:</span>
              </span>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActivePhaseFilter('all')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activePhaseFilter === 'all'
                      ? 'bg-white text-blue-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Fase
                </button>

                <button
                  type="button"
                  onClick={() => setActivePhaseFilter('acute')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activePhaseFilter === 'acute'
                      ? 'bg-white text-blue-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Fase Akut (H 1–3)
                </button>

                <button
                  type="button"
                  onClick={() => setActivePhaseFilter('longitudinal')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activePhaseFilter === 'longitudinal'
                      ? 'bg-white text-blue-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Fase Lanjutan (H 4–30)
                </button>
              </div>

              <div className="hidden xl:flex items-center gap-1 text-[11px] font-mono font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                <FileText className="w-3 h-3 text-slate-400" />
                <span>{centralAssessments.length} total rekaman triase</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExport}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Ekspor Laporan (PDF/Excel)</span>
            </button>
          </div>
        )}

        {/* 1. Pusat Komando & Geospasial (Overview) */}
        {activeSection === 'overview' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Overview Metrics Cards */}
            <KPICards />

            {/* Emergency T0 Attention Panel (conditional if T0 active) */}
            <PriorityRedPanel />

            {/* Triage Distribution & Post Burden Charts */}
            <TriageCharts />

            {/* Geospatial Situation & Station Overview */}
            <TriageMap />

            {/* Recent Assessment Registry Log */}
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
