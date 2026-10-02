import React, { useState } from 'react';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { Sidebar } from '../components/dashboard/Sidebar';
import { KPICards } from '../components/dashboard/KPICards';
import { PriorityRedPanel } from '../components/dashboard/PriorityRedPanel';
import { TriageMap } from '../components/dashboard/TriageMap';
import { TriageCharts } from '../components/dashboard/TriageCharts';
import { RecentAssessmentsTable } from '../components/dashboard/RecentAssessmentsTable';
import { UserManagementSection } from '../components/dashboard/UserManagementSection';
import { LongitudinalDataSection } from '../components/dashboard/LongitudinalDataSection';
import { useAssessment } from '../context/AssessmentContext';

export const DashboardPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { offlineQueue } = useAssessment();

  const handleSelectNav = (sectionId: string) => {
    // Map sidebar IDs to views
    if (sectionId === 'overview' || sectionId === 'penyintas' || sectionId === 'asesmen') {
      setActiveSection('overview');
      if (sectionId === 'penyintas' || sectionId === 'asesmen') {
        const tableElem = document.getElementById('master-data-table');
        if (tableElem) {
          tableElem.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else if (sectionId === 'longitudinal' || sectionId === 'log') {
      setActiveSection('longitudinal');
    } else if (
      sectionId === 'users' ||
      sectionId === 'posko' ||
      sectionId === 'relawan-master' ||
      sectionId === 'faskes'
    ) {
      setActiveSection('users');
    } else if (sectionId === 'laporan') {
      alert('Membuka modul pelaporan komprehensif BPBD / Dinkes.');
    } else if (sectionId === 'offline') {
      alert(
        `Mode Offline: ${
          offlineQueue.length > 0
            ? `${offlineQueue.length} data antrean tersimpan lokal di IndexedDB siap disinkronkan saat terhubung kembali.`
            : 'Semua data telah tersimpan lokal di peramban.'
        }`
      );
    } else {
      setActiveSection(sectionId);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* Top Header spanning across the entire layout */}
      <DashboardHeader
        activeSection={activeSection}
        onSelectSection={handleSelectNav}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
      />

      {/* Main Body: Fixed Left Sidebar + Main Content Area */}
      <div className="flex-1 flex flex-row w-full">
        {/* Fixed Left Navigation Sidebar */}
        <Sidebar
          activeItem={activeSection}
          onSelectItem={handleSelectNav}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          offlineCount={offlineQueue.length}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1600px] mx-auto w-full">
          {/* 1. Primary Command Center (Pusat Komando) */}
          {activeSection === 'overview' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              {/* Row 1: Top KPI Cards (5 compact cards) */}
              <KPICards />

              {/* Row 2: Emergency Alert Cards + Geospatial Map side-by-side */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
                {/* Left (7 cols): Peringatan Dini Kasus T0 */}
                <div className="xl:col-span-7 flex flex-col">
                  <PriorityRedPanel />
                </div>

                {/* Right (5 cols): Sebaran Kasus Geospasial */}
                <div className="xl:col-span-5 flex flex-col">
                  <TriageMap />
                </div>
              </div>

              {/* Row 3: 3 Analytics Panels Side-by-Side */}
              <TriageCharts />

              {/* Row 4: Master Data Penyintas Table */}
              <RecentAssessmentsTable />
            </div>
          )}

          {/* 2. Data Longitudinal Penapisan Penyintas (30 Hari) */}
          {activeSection === 'longitudinal' && <LongitudinalDataSection />}

          {/* 3. Manajemen Relawan & Posko Sumber Daya */}
          {activeSection === 'users' && <UserManagementSection />}
        </main>
      </div>
    </div>
  );
};
